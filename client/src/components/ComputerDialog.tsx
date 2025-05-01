import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeComputerDialog } from '../stores/ComputerStore'

import Video from './Video'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 16px 180px 16px 16px;
`
const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #222639;
  border-radius: 16px;
  padding: 16px;
  color: #eee;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 5px #0000006f;

  .close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
`

const Toolbar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #ffffff30;
  
  .button-group {
    display: flex;
    gap: 10px;
  }
  
  .status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #b87efa;
    font-weight: bold;
  }
`

const Instructions = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
  
  h3 {
    color: #b87efa;
    margin-top: 0;
    margin-bottom: 8px;
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 4px;
  }
`

const NoStreamsMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-top: 20px;
  
  h3 {
    color: #b87efa;
    margin-bottom: 16px;
  }
  
  p {
    max-width: 500px;
    margin: 0 auto;
  }
`

const VideoGrid = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));

  .video-container {
    position: relative;
    background: black;
    border-radius: 8px;
    overflow: hidden;

    video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      object-fit: contain;
    }

    .player-name {
      position: absolute;
      bottom: 16px;
      left: 16px;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgb(0 0 0 / 60%), 0 0 2px rgb(0 0 0 / 30%);
      white-space: nowrap;
    }
  }
`

function VideoContainer({ playerName, stream }) {
  return (
    <div className="video-container">
      <Video srcObject={stream} autoPlay></Video>
      {playerName && <div className="player-name">{playerName}</div>}
    </div>
  )
}

export default function ComputerDialog() {
  const dispatch = useAppDispatch()
  const playerNameMap = useAppSelector((state) => state.user.playerNameMap)
  const shareScreenManager = useAppSelector((state) => state.computer.shareScreenManager)
  const myStream = useAppSelector((state) => state.computer.myStream)
  const peerStreams = useAppSelector((state) => state.computer.peerStreams)
  const [isSharing, setIsSharing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const attemptScreenShare = () => {
    setIsLoading(true)
    try {
      shareScreenManager?.startScreenShare()
    } catch (error) {
      console.error("Screen share error:", error)
      setErrorMessage("Failed to start screen sharing. Please try again.")
      setShowError(true)
    }
  }
  
  const stopScreenShare = () => {
    try {
      shareScreenManager?.stopScreenShare()
    } catch (error) {
      console.error("Error stopping screen share:", error)
    }
  }
  
  // Update state when stream changes
  useEffect(() => {
    setIsSharing(!!shareScreenManager?.myStream)
    setIsLoading(false)
  }, [shareScreenManager?.myStream])
  
  const hasAnyStreams = myStream || peerStreams.size > 0
  const otherUsersCount = peerStreams.size

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeComputerDialog())}
        >
          <CloseIcon />
        </IconButton>

        <Toolbar>
          <div className="button-group">
            <Button
              variant="contained"
              color="secondary"
              startIcon={isSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              onClick={() => {
                if (isSharing) {
                  stopScreenShare()
                } else {
                  attemptScreenShare()
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" style={{ marginRight: 8 }} />
                  Preparing...
                </>
              ) : isSharing ? (
                'Stop Sharing'
              ) : (
                'Share Screen'
              )}
            </Button>
          </div>
          
          <div className="status">
            {isSharing ? (
              <>
                <span className="status-dot" style={{ 
                  display: 'inline-block', 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: '#b87efa', 
                  borderRadius: '50%' 
                }}></span>
                Sharing your screen
              </>
            ) : otherUsersCount > 0 ? (
              `${otherUsersCount} user${otherUsersCount > 1 ? 's' : ''} connected`
            ) : (
              'Not sharing'
            )}
          </div>
        </Toolbar>
        
        {!hasAnyStreams && (
          <Instructions>
            <h3>Screen Sharing</h3>
            <ul>
              <li>Click the "Share Screen" button to begin sharing your screen.</li>
              <li>You'll be prompted to select which screen or application to share.</li>
              <li>Other users in this room will automatically see your shared screen.</li>
              <li>To stop sharing at any time, click "Stop Sharing" or close this dialog.</li>
              <li>For best performance, modern browsers like Chrome, Firefox, or Edge are recommended.</li>
            </ul>
          </Instructions>
        )}

        {hasAnyStreams ? (
          <VideoGrid>
            {myStream && <VideoContainer stream={myStream} playerName="You (Sharing)" />}

            {[...peerStreams.entries()].map(([id, { stream }]) => {
              const playerName = playerNameMap.get(id) || 'Unknown User'
              return <VideoContainer key={id} playerName={playerName} stream={stream} />
            })}
          </VideoGrid>
        ) : (
          <NoStreamsMessage>
            <h3>No Active Screen Shares</h3>
            <p>
              No one is currently sharing their screen. Click the "Share Screen" button 
              above to start sharing your screen with others in this room.
            </p>
          </NoStreamsMessage>
        )}
        
        <Snackbar
          open={showError}
          autoHideDuration={5000}
          onClose={() => setShowError(false)}
        >
          <Alert severity="error">{errorMessage}</Alert>
        </Snackbar>
      </Wrapper>
    </Backdrop>
  )
}
