import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement; name: string }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement; name: string }>()
  private videoGrid: HTMLElement | null
  private otherVideosContainer: HTMLElement | null
  private controlsContainer: HTMLElement | null
  private myVideo = document.createElement('video')
  private myName = 'You'
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    // Initialize DOM elements
    this.videoGrid = document.querySelector('.video-grid')
    this.otherVideosContainer = document.querySelector('.other-videos-container')
    this.controlsContainer = document.querySelector('.video-controls')
    
    // Create video grid if it doesn't exist
    if (!this.videoGrid) {
      console.log('Video grid not found, creating one')
      this.videoGrid = document.createElement('div')
      this.videoGrid.className = 'video-grid'
      document.body.appendChild(this.videoGrid)
      
      // Style for main video container
      this.videoGrid.style.position = 'fixed'
      this.videoGrid.style.top = '0'
      this.videoGrid.style.left = '0'
      this.videoGrid.style.width = '100%'
      this.videoGrid.style.height = '100%'
      this.videoGrid.style.zIndex = '1'
    }
    
    // Create other videos container if it doesn't exist
    if (!this.otherVideosContainer) {
      console.log('Other videos container not found, creating one')
      this.otherVideosContainer = document.createElement('div')
      this.otherVideosContainer.className = 'other-videos-container'
      document.body.appendChild(this.otherVideosContainer)
      
      // Style for other videos container - position for side-by-side layout
      this.otherVideosContainer.style.display = 'flex'
      this.otherVideosContainer.style.justifyContent = 'center'
      this.otherVideosContainer.style.alignItems = 'center'
      this.otherVideosContainer.style.flexWrap = 'wrap'
      this.otherVideosContainer.style.position = 'fixed'
      this.otherVideosContainer.style.top = '20px' // Same height as main video
      this.otherVideosContainer.style.left = '0'
      this.otherVideosContainer.style.width = '100%'
      this.otherVideosContainer.style.zIndex = '1'
      this.otherVideosContainer.style.pointerEvents = 'none'
    }
    
    // Create controls container if it doesn't exist
    if (!this.controlsContainer) {
      console.log('Controls container not found, creating one')
      this.controlsContainer = document.createElement('div')
      this.controlsContainer.className = 'video-controls'
      document.body.appendChild(this.controlsContainer)
      
      // Style the controls container to be at the bottom center
      this.controlsContainer.style.position = 'fixed'
      this.controlsContainer.style.bottom = '20px'
      this.controlsContainer.style.left = '50%'
      this.controlsContainer.style.transform = 'translateX(-50%)'
      this.controlsContainer.style.display = 'flex'
      this.controlsContainer.style.gap = '20px'
      this.controlsContainer.style.backgroundColor = 'rgba(0,0,0,0.5)'
      this.controlsContainer.style.padding = '10px 20px'
      this.controlsContainer.style.borderRadius = '30px'
      this.controlsContainer.style.zIndex = '1000'
    }
    
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId, {
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    })
    this.network = network
    console.log('userId:', userId)
    console.log('sanitizedId:', sanitizedId)
    this.myPeer.on('error', (err) => {
      console.log(err.type)
      console.error(err)
      
      // Attempt to reconnect on certain errors
      if (err.type === 'network' || err.type === 'disconnected') {
        setTimeout(() => {
          console.log('Attempting to reconnect peer...')
          this.myPeer.reconnect()
        }, 3000)
      }
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true
    
    // Style my video to appear in the top center
    this.myVideo.className = 'my-video'
    this.myVideo.style.width = '220px'
    this.myVideo.style.height = '140px'
    this.myVideo.style.objectFit = 'cover'
    this.myVideo.style.borderRadius = '8px'
    this.myVideo.style.position = 'fixed'
    this.myVideo.style.top = '20px'
    this.myVideo.style.left = '50%'
    this.myVideo.style.transform = 'translateX(-50%)'
    this.myVideo.style.zIndex = '2'
    this.myVideo.style.background = 'rgba(0,0,0,0.2)'

    // config peerJS
    this.initialize()
  }

  // Add overlays to a video without changing its structure
  private addOverlaysToVideo(video: HTMLVideoElement, name: string) {
    const videoContainer = video.parentElement;
    const videoId = `video-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    video.id = videoId;
    
    // Add name overlay
    const nameOverlay = document.createElement('div');
    nameOverlay.className = `name-overlay-${videoId}`;
    nameOverlay.innerText = name;
    nameOverlay.style.position = 'fixed';
    nameOverlay.style.top = '5px';
    nameOverlay.style.left = '5px';
    nameOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    nameOverlay.style.color = 'white';
    nameOverlay.style.padding = '2px 8px';
    nameOverlay.style.borderRadius = '4px';
    nameOverlay.style.fontSize = '12px';
    nameOverlay.style.zIndex = '10';
    document.body.appendChild(nameOverlay);
    
    // Add video status overlay (center)
    const videoStatusOverlay = document.createElement('div');
    videoStatusOverlay.className = `video-status-overlay-${videoId}`;
    videoStatusOverlay.innerHTML = '<i class="fas fa-video-slash"></i>';
    videoStatusOverlay.style.position = 'fixed';
    videoStatusOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    videoStatusOverlay.style.color = 'white';
    videoStatusOverlay.style.padding = '8px';
    videoStatusOverlay.style.borderRadius = '50%';
    videoStatusOverlay.style.zIndex = '10';
    videoStatusOverlay.style.display = 'none'; // Initially hidden
    document.body.appendChild(videoStatusOverlay);
    
    // Add mic status overlay (bottom right)
    const micStatusOverlay = document.createElement('div');
    micStatusOverlay.className = `mic-status-overlay-${videoId}`;
    micStatusOverlay.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    micStatusOverlay.style.position = 'fixed';
    micStatusOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    micStatusOverlay.style.color = 'white';
    micStatusOverlay.style.padding = '4px';
    micStatusOverlay.style.borderRadius = '50%';
    micStatusOverlay.style.zIndex = '10';
    micStatusOverlay.style.display = 'none'; // Initially hidden
    document.body.appendChild(micStatusOverlay);
    
    // Update overlay positions when video position changes
    this.updateOverlayPositions(video);
    
    return { nameOverlay, videoStatusOverlay, micStatusOverlay };
  }
  
  // Update overlay positions based on video position
  private updateOverlayPositions(video: HTMLVideoElement) {
    const videoId = video.id;
    const videoRect = video.getBoundingClientRect();
    
    // Update name overlay
    const nameOverlay = document.querySelector(`.name-overlay-${videoId}`) as HTMLElement;
    if (nameOverlay) {
      nameOverlay.style.top = `${videoRect.top + 5}px`;
      nameOverlay.style.left = `${videoRect.left + 5}px`;
    }
    
    // Update video status overlay
    const videoStatusOverlay = document.querySelector(`.video-status-overlay-${videoId}`) as HTMLElement;
    if (videoStatusOverlay) {
      videoStatusOverlay.style.top = `${videoRect.top + (videoRect.height / 2) - 15}px`;
      videoStatusOverlay.style.left = `${videoRect.left + (videoRect.width / 2) - 15}px`;
    }
    
    // Update mic status overlay
    const micStatusOverlay = document.querySelector(`.mic-status-overlay-${videoId}`) as HTMLElement;
    if (micStatusOverlay) {
      micStatusOverlay.style.top = `${videoRect.bottom - 25}px`;
      micStatusOverlay.style.left = `${videoRect.right - 25}px`;
    }
  }
  
  // Remove overlays for a video
  private removeOverlaysForVideo(video: HTMLVideoElement) {
    const videoId = video.id;
    if (!videoId) return;
    
    const nameOverlay = document.querySelector(`.name-overlay-${videoId}`);
    if (nameOverlay) nameOverlay.remove();
    
    const videoStatusOverlay = document.querySelector(`.video-status-overlay-${videoId}`);
    if (videoStatusOverlay) videoStatusOverlay.remove();
    
    const micStatusOverlay = document.querySelector(`.mic-status-overlay-${videoId}`);
    if (micStatusOverlay) micStatusOverlay.remove();
  }
  
  // Update video status
  public updateVideoStatus(video: HTMLVideoElement, isOff: boolean) {
    const videoId = video.id;
    if (!videoId) return;
    
    const overlay = document.querySelector(`.video-status-overlay-${videoId}`) as HTMLElement;
    if (overlay) {
      overlay.style.display = isOff ? 'block' : 'none';
    }
  }
  
  // Update mic status
  public updateMicStatus(video: HTMLVideoElement, isMuted: boolean) {
    const videoId = video.id;
    if (!videoId) return;
    
    const overlay = document.querySelector(`.mic-status-overlay-${videoId}`) as HTMLElement;
    if (overlay) {
      overlay.style.display = isMuted ? 'block' : 'none';
    }
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
        const peerName = `Player ${this.onCalledPeers.size + 1}`;
        this.onCalledPeers.set(call.peer, { call, video, name: peerName })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream, false, peerName)
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
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia is not supported in this browser');
      if (alertOnError) window.alert('Video calls are not supported in this browser. Please try a different browser like Chrome or Firefox.');
      return;
    }
    
    // ask the browser to get user media
    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        console.log('Successfully got media stream');
        this.myStream = stream
        
        // Try to improve video quality after getting the stream
        try {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            console.log("Video track constraints:", videoTrack.getConstraints());
            console.log("Video track settings:", videoTrack.getSettings());
          }
        } catch (e) {
          console.log("Could not log video track info", e);
        }
        
        this.addVideoStream(this.myVideo, this.myStream, true, this.myName)
        this.setUpControls()
        store.dispatch(setVideoConnected(true))
        this.network.videoConnected()
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error)
        if (alertOnError) window.alert('No webcam or microphone found, or permission is blocked')
      })
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(userId)
      if (!this.peers.has(sanitizedId)) {
        console.log('calling', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        const peerName = `Player ${this.peers.size + 1}`;
        this.peers.set(sanitizedId, { call, video, name: peerName })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream, false, peerName)
        })

        // Add error handling and retry logic
        call.on('error', (err) => {
          console.error('Call error with peer:', sanitizedId, err);
          // Try to reconnect after a delay
          setTimeout(() => {
            if (this.peers.has(sanitizedId)) {
              console.log('Attempting to reconnect call to', sanitizedId);
              this.deleteVideoStream(sanitizedId);
              this.connectToNewUser(userId);
            }
          }, 5000);
        });

        // on close is triggered manually with deleteVideoStream()
      }
    }
  }

  // method to add new video stream
  addVideoStream(video: HTMLVideoElement, stream: MediaStream, isMyVideo = false, peerName = 'Player') {
    video.srcObject = stream;
    video.playsInline = true;
    video.autoplay = true;
    
    if (!isMyVideo) {
      // Style other users' videos
      video.style.width = '220px';
      video.style.height = '140px';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      video.style.background = 'rgba(0,0,0,0.2)';
    }
    
    video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded, attempting to play...');
      video.play().catch(error => {
        console.error('Error playing video:', error);
      });
    });
    
    // Add error handling for video element
    video.addEventListener('error', (e) => {
      console.error('Video element error:', e);
    });
    
    // Add videos directly to body first, they'll be moved to the row container during repositioning
    document.body.appendChild(video);
    
    // Add overlays
    const overlays = this.addOverlaysToVideo(video, peerName);
    
    // Set up track mute/unmute event listeners to update indicators
    stream.getAudioTracks().forEach(track => {
      // Set initial state
      this.updateMicStatus(video, !track.enabled);
      
      // Monitor for changes
      track.addEventListener('mute', () => {
        this.updateMicStatus(video, true);
      });
      track.addEventListener('unmute', () => {
        this.updateMicStatus(video, false);
      });
    });
    
    stream.getVideoTracks().forEach(track => {
      // Set initial state
      this.updateVideoStatus(video, !track.enabled);
      
      // Monitor for changes
      track.addEventListener('mute', () => {
        this.updateVideoStatus(video, true);
      });
      track.addEventListener('unmute', () => {
        this.updateVideoStatus(video, false);
      });
    });
    
    // Reposition all videos
    if (!isMyVideo) {
      this.repositionPeerVideos();
    }
  }

  // Reposition peer videos to left and right sides
  private repositionPeerVideos() {
    console.log('Repositioning peer videos');
    
    // Get all peers from both maps
    const allPeers = [...this.peers.entries(), ...this.onCalledPeers.entries()];
    
    // Get window width to calculate positions
    const windowWidth = window.innerWidth;
    const myVideoWidth = 220; // Width of your video
    const peerVideoWidth = 220; // Width of peer videos
    const gap = 10; // Gap between videos
    
    // Calculate total width needed for all videos (including your video)
    const totalVideos = allPeers.length + 1; // +1 for your video
    const totalWidth = (totalVideos * peerVideoWidth) + ((totalVideos - 1) * gap);
    const startX = (windowWidth - totalWidth) / 2;
    
    // Create a container for all videos if it doesn't exist
    if (!document.querySelector('.video-row-container')) {
      const videoRowContainer = document.createElement('div');
      videoRowContainer.className = 'video-row-container';
      videoRowContainer.style.position = 'fixed';
      videoRowContainer.style.top = '20px';
      videoRowContainer.style.left = '0';
      videoRowContainer.style.width = '100%';
      videoRowContainer.style.display = 'flex';
      videoRowContainer.style.justifyContent = 'center';
      videoRowContainer.style.alignItems = 'center';
      videoRowContainer.style.gap = `${gap}px`;
      videoRowContainer.style.zIndex = '2';
      document.body.appendChild(videoRowContainer);
    }
    
    const videoRowContainer = document.querySelector('.video-row-container') as HTMLElement;
    
    // Clear the container
    while (videoRowContainer.firstChild) {
      videoRowContainer.removeChild(videoRowContainer.firstChild);
    }
    
    // Reposition your video
    this.myVideo.style.position = 'static'; // Reset position for flex layout
    this.myVideo.style.transform = 'none'; // Remove transform
    this.myVideo.style.margin = '0'; // Remove margin
    
    // Remove your video from body if it's there
    if (this.myVideo.parentElement === document.body) {
      document.body.removeChild(this.myVideo);
    }
    
    // Determine where to insert your video (in the middle)
    const middleIndex = Math.floor(allPeers.length / 2);
    
    // Add all videos to the container in the correct order
    for (let i = 0; i <= allPeers.length; i++) {
      if (i === middleIndex) {
        // Add your video in the middle
        videoRowContainer.appendChild(this.myVideo);
      }
      
      if (i < allPeers.length) {
        const [id, { video }] = allPeers[i];
        
        // Reset peer video styles for flex layout
        video.style.position = 'static';
        video.style.margin = '0';
        
        // Remove from body if it's there
        if (video.parentElement === document.body) {
          document.body.removeChild(video);
        }
        
        // Add to container
        videoRowContainer.appendChild(video);
      }
    }
    
    // Update overlay positions after repositioning
    setTimeout(() => {
      this.updateOverlayPositions(this.myVideo);
      allPeers.forEach(([id, { video }]) => {
        this.updateOverlayPositions(video);
      });
    }, 50);
    
    console.log(`Video row container width: ${totalWidth}px, starting at: ${startX}px`);
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      
      // Remove overlays
      if (peer?.video) {
        this.removeOverlaysForVideo(peer.video);
      }
      
      peer?.video.remove()
      this.peers.delete(sanitizedId)
      
      // Reposition remaining videos
      this.repositionPeerVideos()
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      
      // Remove overlays
      if (onCalledPeer?.video) {
        this.removeOverlaysForVideo(onCalledPeer.video);
      }
      
      onCalledPeer?.video.remove()
      this.onCalledPeers.delete(sanitizedId)
      
      // Reposition remaining videos
      this.repositionPeerVideos()
    }
  }

  // method to set up controls with icons
  setUpControls() {
    if (!this.controlsContainer) return;
    
    // Create mic control
    const micButton = document.createElement('div')
    micButton.className = 'control-icon mic-on'
    micButton.innerHTML = '<i class="fas fa-microphone"></i>'  // Using Font Awesome
    micButton.style.cursor = 'pointer'
    micButton.style.color = 'white'
    micButton.style.fontSize = '24px'
    micButton.style.width = '40px'
    micButton.style.height = '40px'
    micButton.style.display = 'flex'
    micButton.style.alignItems = 'center'
    micButton.style.justifyContent = 'center'
    
    micButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getAudioTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>'
          micButton.className = 'control-icon mic-off'
          this.updateMicStatus(this.myVideo, true);
        } else {
          audioTrack.enabled = true
          micButton.innerHTML = '<i class="fas fa-microphone"></i>'
          micButton.className = 'control-icon mic-on'
          this.updateMicStatus(this.myVideo, false);
        }
      }
    })
    
    // Create video control
    const videoButton = document.createElement('div')
    videoButton.className = 'control-icon video-on'
    videoButton.innerHTML = '<i class="fas fa-video"></i>'  // Using Font Awesome
    videoButton.style.cursor = 'pointer'
    videoButton.style.color = 'white'
    videoButton.style.fontSize = '24px'
    videoButton.style.width = '40px'
    videoButton.style.height = '40px'
    videoButton.style.display = 'flex'
    videoButton.style.alignItems = 'center'
    videoButton.style.justifyContent = 'center'
    
    videoButton.addEventListener('click', () => {
      if (this.myStream) {
        const videoTrack = this.myStream.getVideoTracks()[0]
        if (videoTrack.enabled) {
          videoTrack.enabled = false
          videoButton.innerHTML = '<i class="fas fa-video-slash"></i>'
          videoButton.className = 'control-icon video-off'
          this.updateVideoStatus(this.myVideo, true);
        } else {
          videoTrack.enabled = true
          videoButton.innerHTML = '<i class="fas fa-video"></i>'
          videoButton.className = 'control-icon video-on'
          this.updateVideoStatus(this.myVideo, false);
        }
      }
    })
    
    // Create cut/reload button
    const cutButton = document.createElement('div')
    cutButton.className = 'control-icon cut-call'
    cutButton.innerHTML = '<i class="fas fa-phone-slash"></i>'  // Using Font Awesome
    cutButton.style.cursor = 'pointer'
    cutButton.style.color = 'red'
    cutButton.style.fontSize = '24px'
    cutButton.style.width = '40px'
    cutButton.style.height = '40px'
    cutButton.style.display = 'flex'
    cutButton.style.alignItems = 'center'
    cutButton.style.justifyContent = 'center'
    
    cutButton.addEventListener('click', () => {
      // Close all connections before reloading
      this.peers.forEach(({ call }) => call.close());
      this.onCalledPeers.forEach(({ call }) => call.close());
      
      // Stop all tracks
      if (this.myStream) {
        this.myStream.getTracks().forEach(track => track.stop());
      }
      
      // Reload the page
      window.location.reload();
    })
    
    // Add controls to container
    this.controlsContainer.appendChild(micButton)
    this.controlsContainer.appendChild(videoButton)
    this.controlsContainer.appendChild(cutButton)
    
    // Add Font Awesome if not already included
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link')
      fontAwesome.rel = 'stylesheet'
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
      document.head.appendChild(fontAwesome)
    }
  }
}