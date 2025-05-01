import React, { useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeGameWindow, setSelectedGame } from '../stores/GameWindowStore'

// Define games with their display information
const games = [
  { id: 'flappy-bird', name: 'Flappy Bird', path: 'Games/Flappy Bird/index.html', image: 'Games/images/Flappy Bird.png' },
  { id: 'chess', name: 'Chess', path: 'Games/Chess/main.html', image: 'Games/images/Chess.png' },
  { id: 'tank-shooter', name: 'Tank Shooter', path: 'Games/Tank Shooter/main.html', image: 'Games/images/Tank Game.jpg' }
]

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 16px;
  width: 100%;
  height: 100%;
  z-index: 1000;
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

  .close {
    position: absolute;
    top: 0px;
    right: 0px;
    color: white;
  }
  
  .back {
    position: absolute;
    top: 0px;
    left: 0px;
    color: white;
  }
`

const GameWrapper = styled.div`
  flex: 1;
  border-radius: 25px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
    flex: 1;
    background: white;
  }
`

const GameSelectionWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
`

const GameCard = styled.div`
  width: 200px;
  background: #333;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    
    .game-name-overlay {
      opacity: 1;
    }
  }

  img {
    width: 180px;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .game-name-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    background-color: rgba(0, 0, 0, 0.65);
    border-radius: 4px;
    
    @supports ((-webkit-backdrop-filter: blur(5px)) or (backdrop-filter: blur(5px))) {
      background-color: rgba(0, 0, 0, 0.4);
      -webkit-backdrop-filter: blur(5px);
      backdrop-filter: blur(5px);
    }
    
    h3 {
      margin: 0;
      font-size: 22px;
      text-align: center;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
      padding: 10px;
    }
  }
`

const Header = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 8px;

  h2 {
    margin: 0;
  }
`

export default function GameWindow() {
  const isOpen = useAppSelector((state) => state.gameWindow.isOpen)
  const selectedGame = useAppSelector((state) => state.gameWindow.selectedGame)
  const dispatch = useAppDispatch()
  const [gameLoading, setGameLoading] = useState(false)

  if (!isOpen) return null

  const handleGameSelect = (gameId: string) => {
    setGameLoading(true)
    dispatch(setSelectedGame(gameId))
  }

  const handleBackToSelection = () => {
    dispatch(setSelectedGame(null))
  }

  const selectedGameData = games.find(game => game.id === selectedGame)

  const handleIframeLoad = () => {
    setGameLoading(false)
  }

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeGameWindow())}
        >
          <CloseIcon />
        </IconButton>

        {selectedGame && (
          <IconButton
            aria-label="back to selection"
            className="back"
            onClick={handleBackToSelection}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        <GameWrapper>
          {selectedGame ? (
            <>
              <Header>
                <h2>{selectedGameData?.name}</h2>
              </Header>
              {gameLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  zIndex: 1
                }}>
                  Loading game...
                </div>
              )}
              <iframe 
                title={selectedGameData?.name || 'Game'} 
                src={selectedGameData?.path}
                onLoad={handleIframeLoad}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
                allowFullScreen
              />
            </>
          ) : (
            <>
              <Header>
                <h2>Select a Game</h2>
              </Header>
              <GameSelectionWrapper>
                {games.map(game => (
                  <GameCard 
                    key={game.id} 
                    onClick={() => handleGameSelect(game.id)}
                  >
                    <img src={game.image} alt={game.name} />
                    <div className="game-name-overlay">
                      <h3>{game.name}</h3>
                    </div>
                  </GameCard>
                ))}
              </GameSelectionWrapper>
            </>
          )}
        </GameWrapper>
      </Wrapper>
    </Backdrop>
  )
} 