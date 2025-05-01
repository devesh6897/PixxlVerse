import Peer from 'peerjs'
import store from '../stores'
import { setMyStream, addVideoStream, removeVideoStream } from '../stores/ComputerStore'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

export default class ShareScreenManager {
  private myPeer: Peer
  myStream?: MediaStream

  constructor(private userId: string) {
    const sanatizedId = this.makeId(userId)
    this.myPeer = new Peer(sanatizedId)
    this.myPeer.on('error', (err) => {
      console.log('ShareScreenWebRTC err.type', err.type)
      console.error('ShareScreenWebRTC', err)
    })

    this.myPeer.on('call', (call) => {
      call.answer()

      call.on('stream', (userVideoStream) => {
        store.dispatch(addVideoStream({ id: call.peer, call, stream: userVideoStream }))
      })
      // we handled on close on our own
    })
  }

  onOpen() {
    if (this.myPeer.disconnected) {
      this.myPeer.reconnect()
    }
  }

  onClose() {
    this.stopScreenShare(false)
    this.myPeer.disconnect()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  // Also for screen sharing ID add a `-ss` at the end.
  private makeId(id: string) {
    return `${id.replace(/[^0-9a-z]/gi, 'G')}-ss`
  }

  startScreenShare() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Screen sharing is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }
    
    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      .then((stream) => {

        const track = stream.getVideoTracks()[0]
        if (track) {
          console.log('Screen sharing started successfully');
          
          // Try to improve video quality if possible
          try {
            const capabilities = track.getCapabilities();
            if (capabilities) {
              console.log("Screen share capabilities:", capabilities);
              
              // Try to set higher resolution if supported
              if (track.applyConstraints) {
                track.applyConstraints({
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                  frameRate: { ideal: 30 }
                }).catch(e => console.log("Could not apply constraints:", e));
              }
            }
          } catch (e) {
            console.log("Could not get screen share capabilities", e);
          }
          
          track.onended = () => {
            this.stopScreenShare()
          }
        } else {
          console.error('No video track found in the screen sharing stream');
          alert('Failed to start screen sharing: No video track available');
          this.stopScreenShare(true);
          return;
        }

        this.myStream = stream
        store.dispatch(setMyStream(stream))

        // Call all existing users.
        const game = phaserGame.scene.keys.game as Game
        const computerItem = game.computerMap.get(store.getState().computer.computerId!)
        if (computerItem) {
          for (const userId of computerItem.currentUsers) {
            this.onUserJoined(userId)
          }
        }
      })
      .catch((error) => {
        console.error('Error starting screen share:', error);
        
        let errorMessage = 'Could not start screen sharing. ';
        
        if (error.name === 'NotAllowedError') {
          errorMessage += 'You denied permission to share your screen.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No screen available to share.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Your screen is already being captured by another application.';
        } else {
          errorMessage += 'Please make sure you have permissions enabled.';
        }
        
        alert(errorMessage);
      });
  }


  stopScreenShare(shouldDispatch = true) {
    if (this.myStream) {
      this.myStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track:", e);
        }
      });
      this.myStream = undefined;
    }
    
    if (shouldDispatch) {
      store.dispatch(setMyStream(null))
      // Manually let all other existing users know screen sharing is stopped
      const game = phaserGame.scene.keys.game as Game
      game.network.onStopScreenShare(store.getState().computer.computerId!)
    }
  }

  onUserJoined(userId: string) {
    if (!this.myStream || userId === this.userId) return

    const sanatizedId = this.makeId(userId)
    try {
      const call = this.myPeer.call(sanatizedId, this.myStream);
      
      // Add error handler for call
      call.on('error', (err) => {
        console.error(`Error in peer call to ${sanatizedId}:`, err);
      });
    } catch (error) {
      console.error(`Failed to establish call with ${sanatizedId}:`, error);
    }
  }

  onUserLeft(userId: string) {
    if (userId === this.userId) return

    const sanatizedId = this.makeId(userId)
    store.dispatch(removeVideoStream(sanatizedId))
  }
}
