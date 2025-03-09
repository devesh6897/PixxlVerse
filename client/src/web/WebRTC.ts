import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network
    this.videoGrid = document.querySelector('.video-grid')
    
    console.log('WebRTC initialized with userId:', userId)
    console.log('sanitizedId:', sanitizedId)
    
    this.myPeer.on('error', (err) => {
      console.log('PeerJS error:', err.type)
      console.error('PeerJS error details:', err)
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

    // config peerJS
    this.initialize()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  private replaceInvalidId(userId: string) {
    return userId.replace(/[^0-9a-z]/gi, 'G')
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      if (!this.onCalledPeers.has(call.peer)) {
        call.answer(this.myStream)
        const video = document.createElement('video')
        this.onCalledPeers.set(call.peer, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
      // on close is triggered manually with deleteOnCalledVideoStream()
    })
  }

  // check if permission has been granted before
  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions?.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia(false)
    })
  }

  getUserMedia(alertOnError = true) {
    console.log('Attempting to get user media...')
    // ask the browser to get user media
    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        console.log('User media obtained successfully')
        this.myStream = stream
        this.addVideoStream(this.myVideo, this.myStream)
        store.dispatch(setVideoConnected(true))
        this.network.videoConnected()
      })
      .catch((error) => {
        console.error('Error getting user media:', error)
        if (alertOnError) window.alert('No webcam or microphone found, or permission is blocked')
      })
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    console.log('Attempting to connect to user:', userId)
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(userId)
      if (!this.peers.has(sanitizedId)) {
        console.log('Calling peer:', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        this.peers.set(sanitizedId, { call, video })

        call.on('stream', (userVideoStream) => {
          console.log('Received stream from user:', sanitizedId)
          this.addVideoStream(video, userVideoStream)
        })

        // on close is triggered manually with deleteVideoStream()
      }
    } else {
      console.warn('Cannot connect to user - no local stream available')
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.className = 'video-element'
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    
    if (this.videoGrid) {
      // Ensure the video grid is visible
      (this.videoGrid as HTMLElement).style.display = 'flex'
      this.videoGrid.append(video)
      
      console.log(`Video added to grid. Total videos: ${this.videoGrid.children.length}`)
      
      // Center the videos in the container
      this.updateVideoGridLayout()
    }
  }

  // New method to update video grid layout
  private updateVideoGridLayout() {
    if (!this.videoGrid) return
    
    const totalVideos = this.videoGrid.children.length
    console.log(`Updating video grid layout. Total videos: ${totalVideos}`)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.video.remove()
      this.onCalledPeers.delete(sanitizedId)
    }
  }

  // Stub method that does nothing, for backward compatibility
  setUpButtons() {
    console.log('setUpButtons is deprecated - using VideoControls component instead')
  }

  // Method to toggle audio on/off
  toggleAudio(enabled: boolean) {
    if (this.myStream) {
      const audioTrack = this.myStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = enabled
        console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`)
      }
    }
  }

  // Method to toggle video on/off
  toggleVideo(enabled: boolean) {
    if (this.myStream) {
      const videoTrack = this.myStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = enabled
        console.log(`Video ${enabled ? 'enabled' : 'disabled'}`)
        
        // If turning off video, only hide my own video
        if (!enabled) {
          // Hide my video
          if (this.myVideo && this.myVideo.parentElement) {
            (this.myVideo as HTMLElement).style.display = 'none';
          }
        } else {
          // Show my video again
          if (this.myVideo && this.myVideo.parentElement) {
            (this.myVideo as HTMLElement).style.display = 'block';
          }
        }
        
        // Make sure the video grid is still visible if there are other videos
        if (this.videoGrid && this.videoGrid.children.length > 1) {
          (this.videoGrid as HTMLElement).style.display = 'flex';
        }
      }
    }
  }

  // Method to check if video track is enabled
  isVideoEnabled(): boolean {
    return Boolean(
      this.myStream && 
      this.myStream.getVideoTracks().length > 0 && 
      this.myStream.getVideoTracks()[0].enabled
    )
  }
}
