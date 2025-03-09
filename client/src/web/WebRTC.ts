import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement; container: HTMLDivElement; usernameEl: HTMLDivElement }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement; container: HTMLDivElement; usernameEl: HTMLDivElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private myVideo = document.createElement('video')
  private myVideoContainer = document.createElement('div')
  private myUsernameEl = document.createElement('div')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network
    this.videoGrid = document.querySelector('.video-grid')
    
    // Set up my video container and username display
    this.myVideoContainer.className = 'video-container'
    this.myUsernameEl.className = 'video-username'
    this.myUsernameEl.textContent = 'You'
    
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
        
        // Create container and username element
        const container = document.createElement('div')
        container.className = 'video-container'
        
        const usernameEl = document.createElement('div')
        usernameEl.className = 'video-username'
        
        // Get username from store if possible
        const state = store.getState()
        const username = state.user.playerNameMap.get(call.peer) || 'Peer'
        usernameEl.textContent = username
        
        // Add to map with new structure
        this.onCalledPeers.set(call.peer, { call, video, container, usernameEl })

        call.on('stream', (userVideoStream) => {
          // Add video and container elements to DOM
          container.appendChild(video)
          container.appendChild(usernameEl)
          
          video.srcObject = userVideoStream
          video.playsInline = true
          video.className = 'video-element'
          video.addEventListener('loadedmetadata', () => {
            video.play()
          })
          
          if (this.videoGrid) {
            (this.videoGrid as HTMLElement).style.display = 'flex'
            this.videoGrid.appendChild(container)
          }
        })
      }
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
        
        // Set up container with video and username
        this.myVideoContainer = document.createElement('div')
        this.myVideoContainer.className = 'video-container'
        
        this.myUsernameEl = document.createElement('div')
        this.myUsernameEl.className = 'video-username'
        
        // Get my name from store if possible
        const state = store.getState()
        const mySessionId = state.user.sessionId
        const myName = state.user.playerNameMap.get(mySessionId) || 'You'
        this.myUsernameEl.textContent = myName
        
        // Add video to container
        this.myVideoContainer.appendChild(this.myVideo)
        this.myVideoContainer.appendChild(this.myUsernameEl)
        
        // Add the video
        this.myVideo.srcObject = stream
        this.myVideo.playsInline = true
        this.myVideo.className = 'video-element'
        this.myVideo.muted = true
        this.myVideo.addEventListener('loadedmetadata', () => {
          this.myVideo.play()
        })
        
        // Add container to grid
        if (this.videoGrid) {
          (this.videoGrid as HTMLElement).style.display = 'flex'
          this.videoGrid.appendChild(this.myVideoContainer)
        }
        
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
        
        // Get the username from the Redux store
        const state = store.getState()
        const username = state.user.playerNameMap.get(sanitizedId) || sanitizedId
        
        // Create video element and container
        const video = document.createElement('video')
        const container = document.createElement('div')
        container.className = 'video-container'
        
        // Create username element
        const usernameEl = document.createElement('div')
        usernameEl.className = 'video-username'
        usernameEl.textContent = username
        
        // Store the elements
        this.peers.set(sanitizedId, { call, video, container, usernameEl })

        call.on('stream', (userVideoStream) => {
          console.log('Received stream from user:', sanitizedId)
          this.addPeerVideoStream(video, userVideoStream, sanitizedId, container, usernameEl)
        })
      }
    } else {
      console.warn('Cannot connect to user - no local stream available')
    }
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.container.remove() // Remove the whole container instead of just the video
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.container.remove() // Remove the whole container instead of just the video
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
        if (!enabled && this.myVideo) {
          this.myVideo.style.display = 'none';
        } else if (this.myVideo) {
          this.myVideo.style.display = 'block';
        }
        
        // Make sure the video grid is still visible if there are other videos
        if (this.videoGrid && this.videoGrid.children.length > 1) {
          const gridElement = this.videoGrid as HTMLElement;
          gridElement.style.display = 'flex';
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

  // Add video stream for peers with username
  addPeerVideoStream(video: HTMLVideoElement, stream: MediaStream, userId: string, container: HTMLDivElement, usernameEl: HTMLDivElement) {
    video.srcObject = stream
    video.playsInline = true
    video.className = 'video-element'
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    
    // Get username from Redux store
    const state = store.getState()
    const username = state.user.playerNameMap.get(userId) || userId
    usernameEl.textContent = username
    
    // Add video and username to container
    container.appendChild(video)
    container.appendChild(usernameEl)
    
    if (this.videoGrid) {
      // Ensure the video grid is visible
      const gridElement = this.videoGrid as HTMLElement;
      gridElement.style.display = 'flex'
      this.videoGrid.appendChild(container)
      
      console.log(`Peer video added to grid for: ${username}. Total videos: ${this.videoGrid.children.length}`)
      this.updateVideoGridLayout()
    }
  }

  // New method to update video grid layout
  private updateVideoGridLayout() {
    if (!this.videoGrid) return
    
    const totalVideos = this.videoGrid.children.length
    console.log(`Updating video grid layout. Total videos: ${totalVideos}`)
  }
}
