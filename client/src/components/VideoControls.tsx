import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { useAppSelector } from '../hooks'

const Backdrop = styled.div`
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 1000;
`

const Button = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }

  &.active {
    background-color: #1ea2df;
    border-color: #fff;
  }
`

export default function VideoControls() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const game = phaserGame.scene.keys.game as Game

  const toggleMute = () => {
    if (game.network?.webRTC) {
      game.network.webRTC.toggleAudio(isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (game.network?.webRTC) {
      game.network.webRTC.toggleVideo(!isVideoOn)
      setIsVideoOn(!isVideoOn)
    }
  }

  // Only show controls when video is connected
  if (!videoConnected) return null

  return (
    <Backdrop>
      <Button 
        onClick={toggleMute} 
        className={isMuted ? 'active' : ''}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOffIcon /> : <MicIcon />}
      </Button>
      <Button 
        onClick={toggleVideo} 
        className={!isVideoOn ? 'active' : ''}
        title={isVideoOn ? 'Turn off video' : 'Turn on video'}
      >
        {isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
      </Button>
    </Backdrop>
  )
} 