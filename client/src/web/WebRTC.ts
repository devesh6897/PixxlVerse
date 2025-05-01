import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'
import { phaserEvents, Event } from '../events/EventCenter'

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
  private isVideoContainerVisible = true;
  private currentLayout: 'row' | 'column' = 'row';

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

    // Setup event listeners for player video and audio state changes
    this.setupStateChangeListeners();

    // Setup layout change listeners
    this.setupLayoutChangeListeners();

    // config peerJS
    this.initialize()

    // Add keyboard shortcut for toggling video visibility
    document.addEventListener('keydown', (e) => {
      // Alt+V to toggle video visibility
      if (e.altKey && e.key.toLowerCase() === 'v') {
        this.toggleVideoContainerVisibility();
        
        // Update the toggle button icon
        const toggleVisibilityButton = document.querySelector('.visibility-toggle') as HTMLElement;
        if (toggleVisibilityButton) {
          toggleVisibilityButton.innerHTML = this.isVideoContainerVisible 
            ? '<i class="fas fa-eye-slash"></i>' 
            : '<i class="fas fa-eye"></i>';
          
          toggleVisibilityButton.title = this.isVideoContainerVisible 
            ? 'Hide videos (Alt+V)' 
            : 'Show videos (Alt+V)';
        }
      }
    });
  }

  // Setup listeners for player state changes
  private setupStateChangeListeners() {
    // Listen for player video state changes
    phaserEvents.on(Event.PLAYER_VIDEO_STATE_CHANGED, (playerId: string, enabled: boolean) => {
      console.log(`Player ${playerId} video state changed to ${enabled ? 'enabled' : 'disabled'}`);
      
      // Find the peer's video element
      let peerVideo: HTMLVideoElement | undefined;
      
      // Check in peers map
      if (this.peers.has(playerId)) {
        peerVideo = this.peers.get(playerId)?.video;
      }
      
      // Check in onCalledPeers map
      if (!peerVideo && this.onCalledPeers.has(playerId)) {
        peerVideo = this.onCalledPeers.get(playerId)?.video;
      }
      
      // If we found the video element, update its status
      if (peerVideo) {
        this.updateVideoStatus(peerVideo, !enabled);
        this.updateOverlayPositions(peerVideo);
      }
    });
    
    // Listen for player audio state changes
    phaserEvents.on(Event.PLAYER_AUDIO_STATE_CHANGED, (playerId: string, enabled: boolean) => {
      console.log(`Player ${playerId} audio state changed to ${enabled ? 'enabled' : 'disabled'}`);
      
      // Find the peer's video element
      let peerVideo: HTMLVideoElement | undefined;
      
      // Check in peers map
      if (this.peers.has(playerId)) {
        peerVideo = this.peers.get(playerId)?.video;
      }
      
      // Check in onCalledPeers map
      if (!peerVideo && this.onCalledPeers.has(playerId)) {
        peerVideo = this.onCalledPeers.get(playerId)?.video;
      }
      
      // If we found the video element, update its status
      if (peerVideo) {
        this.updateMicStatus(peerVideo, !enabled);
        this.updateOverlayPositions(peerVideo);
      }
    });
  }

  // Setup listeners for layout changes
  private setupLayoutChangeListeners() {
    // Listen for screen sharing
    phaserEvents.on(Event.SCREEN_SHARING_STARTED, () => {
      this.currentLayout = 'column';
      this.repositionPeerVideos('column');
    });
    
    phaserEvents.on(Event.SCREEN_SHARING_STOPPED, () => {
      this.currentLayout = 'row';
      this.repositionPeerVideos('row');
    });
    
    // Listen for whiteboard activation
    phaserEvents.on(Event.WHITEBOARD_ACTIVATED, () => {
      this.currentLayout = 'column';
      this.repositionPeerVideos('column');
    });
    
    phaserEvents.on(Event.WHITEBOARD_DEACTIVATED, () => {
      this.currentLayout = 'row';
      this.repositionPeerVideos('row');
    });
    
    // Listen for game activation
    phaserEvents.on(Event.GAME_STARTED, () => {
      this.currentLayout = 'column';
      this.repositionPeerVideos('column');
    });
    
    phaserEvents.on(Event.GAME_STOPPED, () => {
      this.currentLayout = 'row';
      this.repositionPeerVideos('row');
    });
    
    // Add a window resize listener to ensure the layout adapts to window size changes
    window.addEventListener('resize', () => {
      // Get the current container
      const videoContainer = document.querySelector('.video-row-container') as HTMLElement;
      if (videoContainer) {
        // Check if we're in column mode by testing the flexDirection property
        const isColumnMode = videoContainer.style.flexDirection === 'column';
        this.currentLayout = isColumnMode ? 'column' : 'row';
        this.repositionPeerVideos(this.currentLayout);
      }
    });
    
    // We're now adding the layout toggle button directly in setUpControls
    // so we don't need to create it here anymore
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
    nameOverlay.style.zIndex = '100';
    document.body.appendChild(nameOverlay);
    
    // Ensure Font Awesome is loaded
    this.ensureFontAwesomeLoaded();
    
    // Update overlay positions when video position changes
    this.updateOverlayPositions(video);
    
    return { nameOverlay };
  }
  
  // Update overlay positions based on video position
  private updateOverlayPositions(video: HTMLVideoElement) {
    const videoId = video.id;
    if (!videoId) return;
    
    const videoRect = video.getBoundingClientRect();
    if (videoRect.width === 0 || videoRect.height === 0) return; // Video not visible yet
    
    // Update name overlay
    const nameOverlay = document.querySelector(`.name-overlay-${videoId}`) as HTMLElement;
    if (nameOverlay) {
      nameOverlay.style.top = `${videoRect.top + 5}px`;
      nameOverlay.style.left = `${videoRect.left + 5}px`;
      nameOverlay.style.zIndex = '10';
    }
  }
  
  // Remove overlays for a video
  private removeOverlaysForVideo(video: HTMLVideoElement) {
    const videoId = video.id;
    if (!videoId) return;
    
    const nameOverlay = document.querySelector(`.name-overlay-${videoId}`);
    if (nameOverlay) nameOverlay.remove();
  }
  
  // Update video status
  public updateVideoStatus(video: HTMLVideoElement, isOff: boolean) {
    // The overlay icons have been removed, but we keep this method
    // to maintain compatibility with existing code
    console.log(`Setting video status for ${video.id} to ${isOff ? 'off' : 'on'}`);
  }
  
  // Update mic status
  public updateMicStatus(video: HTMLVideoElement, isMuted: boolean) {
    // The overlay icons have been removed, but we keep this method
    // to maintain compatibility with existing code
    console.log(`Setting mic status for ${video.id} to ${isMuted ? 'muted' : 'unmuted'}`);
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
        
        // Get the player name from the playerNameMap in the store
        const playerName = this.getRealPlayerName(call.peer);
        this.onCalledPeers.set(call.peer, { call, video, name: playerName })

        call.on('stream', (userVideoStream) => {
          // Check for updated name when stream starts
          const updatedName = this.getRealPlayerName(call.peer);
          this.addVideoStream(video, userVideoStream, false, updatedName)
          
          // Monitor tracks for mute/disable events
          this.monitorRemoteStreamTracks(video, userVideoStream);
        })
      }
      // on close is triggered manually with deleteOnCalledVideoStream()
    })
  }
  
  // Get the real player name from the store's playerNameMap
  private getRealPlayerName(peerId: string): string {
    try {
      const state = store.getState();
      if (state && state.user && state.user.playerNameMap) {
        // playerNameMap is a Map, so we need to use the Map.get method
        const nameFromMap = state.user.playerNameMap.get(peerId);
        if (nameFromMap) {
          return nameFromMap;
        }
        
        // Try with original ID if the sanitation affected it
        const sanitizedId = this.replaceInvalidId(peerId);
        // For Maps, we need to use keys() iterator
        for (const key of state.user.playerNameMap.keys()) {
          if (this.replaceInvalidId(key) === sanitizedId) {
            return state.user.playerNameMap.get(key) || `Player ${peerId.substring(0, 4)}`;
          }
        }
      }
    } catch (e) {
      console.error('Error getting player name from store:', e);
    }
    
    // Fall back to default name if we can't find the real one
    return `Player ${peerId.substring(0, 4)}`;
  }

  // Monitor remote stream tracks for mute/disable events
  private monitorRemoteStreamTracks(video: HTMLVideoElement, stream: MediaStream) {
    console.log('Setting up monitoring for remote tracks in stream:', stream.id);
    
    // For audio tracks
    stream.getAudioTracks().forEach(track => {
      // Define a function to check if audio is actually muted
      const checkAudioState = () => {
        // If track is explicitly disabled, it's definitely muted
        if (!track.enabled) return true;
        return false;
      };
      
      // Set initial state in log only
      console.log('Initial audio track state set to unmuted for new connection');
      
      // Create a periodic check for track state
      const audioInterval = setInterval(() => {
        if (!video.parentElement) {
          // Video was removed, clear interval
          clearInterval(audioInterval);
          return;
        }
        
        const isMuted = checkAudioState();
        this.updateMicStatus(video, isMuted);
      }, 500);
      
      // Standard events
      track.addEventListener('mute', () => {
        console.log('Audio track muted event triggered');
        this.updateMicStatus(video, true);
      });
      
      track.addEventListener('unmute', () => {
        console.log('Audio track unmuted event triggered');
        this.updateMicStatus(video, false);
      });
      
      // Listen for track enabled/disabled changes
      const self = this;
      const originalEnabledGetter = Object.getOwnPropertyDescriptor(track, 'enabled')?.get;
      const originalEnabledSetter = Object.getOwnPropertyDescriptor(track, 'enabled')?.set;
      
      // Only override if we can actually get the original accessors
      if (originalEnabledGetter && originalEnabledSetter) {
        Object.defineProperty(track, 'enabled', {
          get: function() {
            return originalEnabledGetter.call(this);
          },
          set: function(value: boolean) {
            originalEnabledSetter.call(this, value);
            console.log('Audio track enabled changed to:', value);
            setTimeout(() => {
              const isMuted = !value;
              self.updateMicStatus(video, isMuted);
            }, 0);
          }
        });
      }
      
      track.addEventListener('ended', () => {
        console.log('Audio track ended event triggered');
        this.updateMicStatus(video, true);
        clearInterval(audioInterval);
      });
    });
    
    // For video tracks
    stream.getVideoTracks().forEach(track => {
      // Define a function to check if video is actually disabled
      const checkVideoState = () => {
        // If track is explicitly disabled, it's definitely off
        if (!track.enabled) return true;
        return false;
      };
      
      // Set initial state in log only
      console.log('Initial video track state set to enabled for new connection');
      
      // Create a periodic check for track state
      const videoInterval = setInterval(() => {
        if (!video.parentElement) {
          // Video was removed, clear interval
          clearInterval(videoInterval);
          return;
        }
        
        const isOff = checkVideoState();
        this.updateVideoStatus(video, isOff);
      }, 500);
      
      // Standard events
      track.addEventListener('mute', () => {
        console.log('Video track muted event triggered');
        this.updateVideoStatus(video, true);
      });
      
      track.addEventListener('unmute', () => {
        console.log('Video track unmuted event triggered');
        this.updateVideoStatus(video, false);
      });
      
      // Listen for track enabled/disabled changes
      const self = this;
      const originalEnabledGetter = Object.getOwnPropertyDescriptor(track, 'enabled')?.get;
      const originalEnabledSetter = Object.getOwnPropertyDescriptor(track, 'enabled')?.set;
      
      // Only override if we can actually get the original accessors
      if (originalEnabledGetter && originalEnabledSetter) {
        Object.defineProperty(track, 'enabled', {
          get: function() {
            return originalEnabledGetter.call(this);
          },
          set: function(value: boolean) {
            originalEnabledSetter.call(this, value);
            console.log('Video track enabled changed to:', value);
            setTimeout(() => {
              const isOff = !value;
              self.updateVideoStatus(video, isOff);
            }, 0);
          }
        });
      }
      
      track.addEventListener('ended', () => {
        console.log('Video track ended event triggered');
        this.updateVideoStatus(video, true);
        clearInterval(videoInterval);
      });
    });
    
    // Add a listener to handle video playing status
    video.addEventListener('playing', () => {
      console.log('Video playing event triggered');
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].enabled) {
        this.updateVideoStatus(video, false);
      }
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].enabled) {
        this.updateMicStatus(video, false);
      }
    });
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
        
        // Try to get my name from the store
        try {
          const state = store.getState();
          // Get my own ID from session
          const myId = state?.user?.sessionId || '';
          // Try to find my name in the playerNameMap using my ID
          const myName = myId ? (state?.user?.playerNameMap.get(myId) || this.myName) : this.myName;
          this.myName = myName;
        } catch (e) {
          console.error('Could not get my name from store:', e);
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
        
        // Get the player name from the playerNameMap in the store
        const playerName = this.getRealPlayerName(sanitizedId);
        this.peers.set(sanitizedId, { call, video, name: playerName })

        call.on('stream', (userVideoStream) => {
          // Check for updated name when stream starts
          const updatedName = this.getRealPlayerName(sanitizedId);
          this.addVideoStream(video, userVideoStream, false, updatedName)
          
          // Monitor tracks for mute/disable events
          this.monitorRemoteStreamTracks(video, userVideoStream);
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
    
    // Add name overlay
    const overlays = this.addOverlaysToVideo(video, peerName);
    
    // If videos are hidden, hide the name overlay immediately
    if (!this.isVideoContainerVisible && overlays.nameOverlay) {
      overlays.nameOverlay.style.display = 'none';
    }
    
    // Set up track mute/unmute event listeners to keep track of state (for your own video)
    if (isMyVideo) {
      stream.getAudioTracks().forEach(track => {
        // Track initial state
        console.log(`Initial audio track state: ${track.enabled ? 'enabled' : 'disabled'}`);
        
        // Monitor for changes
        track.addEventListener('mute', () => {
          this.updateMicStatus(video, true);
        });
        track.addEventListener('unmute', () => {
          this.updateMicStatus(video, false);
        });
        
        // Initial state logging
        if (!track.enabled) {
          this.updateMicStatus(video, true);
        }
      });
      
      stream.getVideoTracks().forEach(track => {
        // Track initial state
        console.log(`Initial video track state: ${track.enabled ? 'enabled' : 'disabled'}`);
        
        // Monitor for changes
        track.addEventListener('mute', () => {
          this.updateVideoStatus(video, true);
        });
        track.addEventListener('unmute', () => {
          this.updateVideoStatus(video, false);
        });
        
        // Initial state logging
        if (!track.enabled) {
          this.updateVideoStatus(video, true);
        }
      });
    }
    
    // Reposition all videos using the current layout
    if (!isMyVideo) {
      this.repositionPeerVideos(this.currentLayout);
    }
    
    // Update the video label if videos are hidden
    if (!this.isVideoContainerVisible) {
      this.updateVideoLabel();
    }
  }

  // Method to switch layout between row (default) and column (when screen sharing/games/whiteboard is active)
  public switchVideoLayout(mode: 'row' | 'column') {
    console.log(`Switching video layout to ${mode} mode`);
    
    const videoRowContainer = document.querySelector('.video-row-container') as HTMLElement;
    if (!videoRowContainer) {
      console.error('Video container not found');
      return;
    }
    
    if (mode === 'column') {
      // Adjust the container to be a column on the right side
      videoRowContainer.style.flexDirection = 'column';
      videoRowContainer.style.left = 'auto';
      videoRowContainer.style.right = '10px';
      videoRowContainer.style.top = '10px';
      videoRowContainer.style.bottom = '10px';
      videoRowContainer.style.width = '230px'; // Just enough for one video
      videoRowContainer.style.height = 'auto';
      videoRowContainer.style.maxHeight = '100vh';
      videoRowContainer.style.overflowY = 'auto';
      videoRowContainer.style.justifyContent = 'flex-start';
      
      // Adjust each video to be smaller in column mode
      const allVideos = videoRowContainer.querySelectorAll('video');
      allVideos.forEach(video => {
        (video as HTMLElement).style.width = '220px';
        (video as HTMLElement).style.height = '140px';
        (video as HTMLElement).style.marginBottom = '10px';
      });
    } else {
      // Reset to horizontal row at the top
      videoRowContainer.style.flexDirection = 'row';
      videoRowContainer.style.left = '0';
      videoRowContainer.style.right = 'auto';
      videoRowContainer.style.top = '20px';
      videoRowContainer.style.bottom = 'auto';
      videoRowContainer.style.width = '100%';
      videoRowContainer.style.height = 'auto';
      videoRowContainer.style.maxHeight = 'none';
      videoRowContainer.style.overflowY = 'visible';
      videoRowContainer.style.justifyContent = 'center';
      
      // Reset video margins
      const allVideos = videoRowContainer.querySelectorAll('video');
      allVideos.forEach(video => {
        (video as HTMLElement).style.marginBottom = '0';
      });
    }
    
    // Update name overlay positions after layout change
    setTimeout(() => {
      this.updateOverlayPositions(this.myVideo);
      
      [...this.peers.entries(), ...this.onCalledPeers.entries()].forEach(([id, { video }]) => {
        this.updateOverlayPositions(video);
      });
    }, 100);
  }

  // Reposition peer videos to left and right sides
  private repositionPeerVideos(layout: 'row' | 'column' = 'row') {
    console.log('Repositioning peer videos with layout:', layout);
    
    // Update the current layout if a specific layout is provided
    if (layout) {
      this.currentLayout = layout;
    }
    
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
    
    // Determine where to insert your video
    let myVideoPosition = 0;
    if (layout === 'row') {
      // In row layout, put your video in the middle
      myVideoPosition = Math.floor(allPeers.length / 2);
    } else {
      // In column layout, put your video at the top
      myVideoPosition = 0;
    }
    
    // Add all videos to the container in the correct order
    for (let i = 0; i <= allPeers.length; i++) {
      if (i === myVideoPosition) {
        // Add your video
        videoRowContainer.appendChild(this.myVideo);
      }
      
      if (i < allPeers.length) {
        const [id, { video }] = allPeers[i];
        
        // Reset peer video styles for flex layout
        video.style.position = 'static';
        video.style.margin = '0';
        
        // For column layout, add bottom margin except for the last video
        if (layout === 'column' && i < allPeers.length - 1) {
          video.style.marginBottom = '10px';
        }
        
        // Remove from body if it's there
        if (video.parentElement === document.body) {
          document.body.removeChild(video);
        }
        
        // Add to container
        videoRowContainer.appendChild(video);
      }
    }
    
    // Set the layout direction
    if (layout === 'column') {
      this.switchVideoLayout('column');
    } else {
      this.switchVideoLayout('row');
    }
    
    // Update name overlay positions after repositioning
    setTimeout(() => {
      this.updateOverlayPositions(this.myVideo);
      allPeers.forEach(([id, { video }]) => {
        this.updateOverlayPositions(video);
      });
    }, 50);
    
    console.log(`Video container configured for ${layout} layout`);
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
      
      // Reposition remaining videos with current layout
      this.repositionPeerVideos(this.currentLayout)
      
      // Update the video label if videos are hidden
      if (!this.isVideoContainerVisible) {
        this.updateVideoLabel();
      }
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
      
      // Reposition remaining videos with current layout
      this.repositionPeerVideos(this.currentLayout)
      
      // Update the video label if videos are hidden
      if (!this.isVideoContainerVisible) {
        this.updateVideoLabel();
      }
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
          
          // Get the player instance from the game state
          try {
            const state = store.getState();
            // Safely access the game object with type assertion
            const gameScene = (window as any).game?.scene?.keys?.game;
            
            if (gameScene && gameScene.myPlayer) {
              // Update player audio state - this will broadcast to others
              gameScene.myPlayer.setAudioEnabled(false);
            } else {
              // Fallback to direct network update if player instance not available
              this.network.updatePlayerProps({ audioEnabled: false });
            }
          } catch (e) {
            console.error('Error updating player audio state:', e);
            // Fallback to direct network update
            this.network.updatePlayerProps({ audioEnabled: false });
          }
        } else {
          audioTrack.enabled = true
          micButton.innerHTML = '<i class="fas fa-microphone"></i>'
          micButton.className = 'control-icon mic-on'
          this.updateMicStatus(this.myVideo, false);
          
          // Get the player instance from the game state
          try {
            const state = store.getState();
            // Safely access the game object with type assertion
            const gameScene = (window as any).game?.scene?.keys?.game;
            
            if (gameScene && gameScene.myPlayer) {
              // Update player audio state - this will broadcast to others
              gameScene.myPlayer.setAudioEnabled(true);
            } else {
              // Fallback to direct network update if player instance not available
              this.network.updatePlayerProps({ audioEnabled: true });
            }
          } catch (e) {
            console.error('Error updating player audio state:', e);
            // Fallback to direct network update
            this.network.updatePlayerProps({ audioEnabled: true });
          }
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
          
          // Get the player instance from the game state
          try {
            const state = store.getState();
            // Safely access the game object with type assertion
            const gameScene = (window as any).game?.scene?.keys?.game;
            
            if (gameScene && gameScene.myPlayer) {
              // Update player video state - this will broadcast to others
              gameScene.myPlayer.setVideoEnabled(false);
            } else {
              // Fallback to direct network update if player instance not available
              this.network.updatePlayerProps({ videoEnabled: false });
            }
          } catch (e) {
            console.error('Error updating player video state:', e);
            // Fallback to direct network update
            this.network.updatePlayerProps({ videoEnabled: false });
          }
        } else {
          videoTrack.enabled = true
          videoButton.innerHTML = '<i class="fas fa-video"></i>'
          videoButton.className = 'control-icon video-on'
          this.updateVideoStatus(this.myVideo, false);
          
          // Get the player instance from the game state
          try {
            const state = store.getState();
            // Safely access the game object with type assertion
            const gameScene = (window as any).game?.scene?.keys?.game;
            
            if (gameScene && gameScene.myPlayer) {
              // Update player video state - this will broadcast to others
              gameScene.myPlayer.setVideoEnabled(true);
            } else {
              // Fallback to direct network update if player instance not available
              this.network.updatePlayerProps({ videoEnabled: true });
            }
          } catch (e) {
            console.error('Error updating player video state:', e);
            // Fallback to direct network update
            this.network.updatePlayerProps({ videoEnabled: true });
          }
        }
      }
    })
    
    // Create layout toggle button
    const layoutButton = document.createElement('div');
    layoutButton.className = 'control-icon layout-toggle';
    
    // Set initial icon based on the current layout (consistency)
    layoutButton.innerHTML = this.currentLayout === 'column' 
      ? '<i class="fas fa-th"></i>' // Row layout icon (to switch to row)
      : '<i class="fas fa-th-list"></i>'; // Column layout icon (to switch to column)
    
    layoutButton.style.cursor = 'pointer';
    layoutButton.style.color = 'white';
    layoutButton.style.fontSize = '24px';
    layoutButton.style.width = '40px';
    layoutButton.style.height = '40px';
    layoutButton.style.display = 'flex';
    layoutButton.style.alignItems = 'center';
    layoutButton.style.justifyContent = 'center';
    layoutButton.title = this.currentLayout === 'column' 
      ? 'Switch to row layout' 
      : 'Switch to column layout';
    
    layoutButton.addEventListener('click', () => {
      this.currentLayout = this.currentLayout === 'row' ? 'column' : 'row';
      this.repositionPeerVideos(this.currentLayout);
      
      // Update icon
      if (this.currentLayout === 'column') {
        layoutButton.innerHTML = '<i class="fas fa-th"></i>'; // Row layout icon
        layoutButton.title = 'Switch to row layout';
      } else {
        layoutButton.innerHTML = '<i class="fas fa-th-list"></i>'; // Column layout icon
        layoutButton.title = 'Switch to column layout';
      }
    });
    
    // Create video visibility toggle button
    const toggleVisibilityButton = document.createElement('div');
    toggleVisibilityButton.className = 'control-icon visibility-toggle';
    toggleVisibilityButton.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Eye slash icon
    toggleVisibilityButton.style.cursor = 'pointer';
    toggleVisibilityButton.style.color = 'white';
    toggleVisibilityButton.style.fontSize = '24px';
    toggleVisibilityButton.style.width = '40px';
    toggleVisibilityButton.style.height = '40px';
    toggleVisibilityButton.style.display = 'flex';
    toggleVisibilityButton.style.alignItems = 'center';
    toggleVisibilityButton.style.justifyContent = 'center';
    toggleVisibilityButton.title = 'Hide videos (Alt+V)';
    
    toggleVisibilityButton.addEventListener('click', () => {
      const isVisible = this.toggleVideoContainerVisibility();
      
      // Update icon based on the current state
      if (isVisible) {
        toggleVisibilityButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
        toggleVisibilityButton.title = 'Hide videos (Alt+V)';
      } else {
        toggleVisibilityButton.innerHTML = '<i class="fas fa-eye"></i>';
        toggleVisibilityButton.title = 'Show videos (Alt+V)';
      }
    });
    
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
    this.controlsContainer.appendChild(layoutButton)
    this.controlsContainer.appendChild(toggleVisibilityButton)
    this.controlsContainer.appendChild(cutButton)
    
    // Add Font Awesome if not already included
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link')
      fontAwesome.rel = 'stylesheet'
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
      document.head.appendChild(fontAwesome)
    }
  }

  // Ensure Font Awesome is loaded
  private ensureFontAwesomeLoaded() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      document.head.appendChild(fontAwesome);
      
      console.log('Added Font Awesome stylesheet to document head');
    }
  }

  // Helper method to update the video label content
  private updateVideoLabel() {
    const videoLabel = document.querySelector('.video-label') as HTMLElement;
    if (!videoLabel) return;
    
    // Get all participants and format names
    const allPeers = [...this.peers.entries(), ...this.onCalledPeers.entries()];
    let participantNames = '';
    
    // Count total participants (including myself)
    const totalParticipants = allPeers.length + 1;
    
    // Add my name first
    participantNames += `${this.myName} (You)`;
    
    // Add peer names
    if (allPeers.length > 0) {
      participantNames += ` + ${allPeers.length} `;
      if (allPeers.length === 1) {
        participantNames += `(${allPeers[0][1].name})`;
      } else {
        participantNames += 'others';
      }
    }
    
    // Update the label content with participant count badge
    videoLabel.innerHTML = `
      <i class="fas fa-video"></i> 
      <span>${participantNames}</span>
      <span class="participant-count" style="
        display: inline-block;
        background-color: rgba(255,255,255,0.2);
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        text-align: center;
        line-height: 18px;
        margin-left: 5px;
      ">${totalParticipants}</span>
    `;
    
    // Add tooltip with full names if truncated
    videoLabel.title = `Video participants (${totalParticipants}): ${participantNames}`;
  }

  // Method to toggle video container visibility
  public toggleVideoContainerVisibility(show?: boolean) {
    const videoRowContainer = document.querySelector('.video-row-container') as HTMLElement;
    if (!videoRowContainer) return;
    
    // Determine whether to show or hide
    const shouldShow = show !== undefined ? show : !this.isVideoContainerVisible;
    this.isVideoContainerVisible = shouldShow;
    
    if (shouldShow) {
      // Show the video container
      videoRowContainer.style.display = 'flex';
      
      // Remove the label if it exists
      const videoLabel = document.querySelector('.video-label');
      if (videoLabel) videoLabel.remove();
      
      // Show all name overlays
      document.querySelectorAll('[class^="name-overlay-"]').forEach((overlay) => {
        (overlay as HTMLElement).style.display = 'block';
      });
    } else {
      // Hide the video container
      videoRowContainer.style.display = 'none';
      
      // Hide all name overlays
      document.querySelectorAll('[class^="name-overlay-"]').forEach((overlay) => {
        (overlay as HTMLElement).style.display = 'none';
      });
      
      // Create or update a small label to show instead
      let videoLabel = document.querySelector('.video-label') as HTMLElement;
      if (!videoLabel) {
        videoLabel = document.createElement('div');
        videoLabel.className = 'video-label';
        videoLabel.style.position = 'fixed';
        videoLabel.style.right = '10px';
        videoLabel.style.top = '10px';
        videoLabel.style.backgroundColor = 'rgba(0,0,0,0.5)';
        videoLabel.style.color = 'white';
        videoLabel.style.padding = '5px 10px';
        videoLabel.style.borderRadius = '4px';
        videoLabel.style.fontSize = '12px';
        videoLabel.style.zIndex = '2';
        videoLabel.style.cursor = 'pointer';
        videoLabel.style.maxWidth = '200px';
        videoLabel.style.whiteSpace = 'nowrap';
        videoLabel.style.overflow = 'hidden';
        videoLabel.style.textOverflow = 'ellipsis';
        videoLabel.style.display = 'flex';
        videoLabel.style.alignItems = 'center';
        videoLabel.style.gap = '5px';
        videoLabel.style.opacity = '0';
        videoLabel.style.transform = 'translateY(-10px)';
        videoLabel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Add tooltip showing keyboard shortcut
        videoLabel.title = 'Click to show videos (Alt+V)';
        
        videoLabel.addEventListener('click', () => {
          this.toggleVideoContainerVisibility(true);
          
          // Update button state
          const toggleVisibilityButton = document.querySelector('.visibility-toggle') as HTMLElement;
          if (toggleVisibilityButton) {
            toggleVisibilityButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
            toggleVisibilityButton.title = 'Hide videos (Alt+V)';
          }
        });
        
        document.body.appendChild(videoLabel);
        
        // Trigger animation after a small delay
        setTimeout(() => {
          videoLabel.style.opacity = '1';
          videoLabel.style.transform = 'translateY(0)';
        }, 50);
      }
      
      // Update the video label content
      this.updateVideoLabel();
    }
    
    // Return current state
    return this.isVideoContainerVisible;
  }
}