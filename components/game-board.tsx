'use client'

import React, { useState, useEffect, useCallback } from 'react'

const GRID_ROWS = 12
const GRID_COLS = 18

type BlockType = 'player1' | 'player2' | 'tnt' | 'obstacle' | 'booster'

interface Block {
  x: number
  y: number
  type: BlockType
}

export function GameBoardComponent() {
  const [blocks, setBlocks] = useState<Block[]>([
    // Player 1 blocks (blue)
    { x: 1, y: 1, type: 'player1' },
    { x: 2, y: 1, type: 'player1' },
    // Player 2 blocks (green)
    { x: 16, y: 1, type: 'player2' },
    { x: 17, y: 1, type: 'player2' },
    // TNT blocks
    { x: 5, y: 5, type: 'tnt' },
    { x: 12, y: 8, type: 'tnt' },
    // Obstacle blocks
    { x: 8, y: 3, type: 'obstacle' },
    { x: 10, y: 7, type: 'obstacle' },
    // Booster blocks
    { x: 3, y: 6, type: 'booster' },
    { x: 15, y: 4, type: 'booster' },
  ])

  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1')
  const [command, setCommand] = useState('')
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null)

  const checkWinCondition = useCallback((updatedBlocks: Block[]) => {
    const player1Win = updatedBlocks.some(block => block.type === 'player1' && block.y === GRID_ROWS - 1)
    const player2Win = updatedBlocks.some(block => block.type === 'player2' && block.y === GRID_ROWS - 1)

    if (player1Win) {
      setWinner('player1')
    } else if (player2Win) {
      setWinner('player2')
    }
  }, [])

  const moveBlock = useCallback((dx: number, dy: number) => {
    if (winner) return // Prevent moves after game is won

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((block) => {
        if (block.type === currentPlayer) {
          let newX = block.x + dx
          let newY = block.y + dy
          
          // Limit movement to 1 block at a time
          newX = Math.max(block.x - 1, Math.min(block.x + 1, newX))
          newY = Math.max(block.y - 1, Math.min(block.y + 1, newY))
          
          // Ensure the block stays within the grid
          newX = Math.max(0, Math.min(GRID_COLS - 1, newX))
          newY = Math.max(0, Math.min(GRID_ROWS - 1, newY))
          
          // Check for collisions
          const collision = prevBlocks.find(
            (b) => b.x === newX && b.y === newY && b.type !== currentPlayer
          )
          
          if (collision) {
            switch (collision.type) {
              case 'tnt':
                // Remove TNT and don't move
                return prevBlocks.filter((b) => b !== collision)
              case 'obstacle':
                // Don't move
                return block
              case 'booster':
                // Move an extra space in the same direction
                newX = Math.max(0, Math.min(GRID_COLS - 1, newX + dx))
                newY = Math.max(0, Math.min(GRID_ROWS - 1, newY + dy))
                return { ...block, x: newX, y: newY }
              default:
                return block
            }
          }
          
          return { ...block, x: newX, y: newY }
        }
        return block
      })

      checkWinCondition(updatedBlocks)
      return updatedBlocks
    })
    
    setCurrentPlayer(currentPlayer === 'player1' ? 'player2' : 'player1')
  }, [currentPlayer, winner, checkWinCondition])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        moveBlock(0, -1)
        break
      case 'ArrowDown':
        moveBlock(0, 1)
        break
      case 'ArrowLeft':
        moveBlock(-1, 0)
        break
      case 'ArrowRight':
        moveBlock(1, 0)
        break
    }
  }, [moveBlock])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const [direction] = command.toLowerCase().split(' ')

    switch (direction) {
      case 'up':
        moveBlock(0, -1)
        break
      case 'down':
        moveBlock(0, 1)
        break
      case 'left':
        moveBlock(-1, 0)
        break
      case 'right':
        moveBlock(1, 0)
        break
    }

    setCommand('')
  }

  const renderGrid = () => {
    const grid = []
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const block = blocks.find((b) => b.x === col && b.y === row)
        let bgColor = 'bg-transparent'
        if (block) {
          switch (block.type) {
            case 'player1':
              bgColor = 'bg-blue-600'
              break
            case 'player2':
              bgColor = 'bg-green-600'
              break
            case 'tnt':
              bgColor = 'bg-red-600'
              break
            case 'obstacle':
              bgColor = 'bg-gray-600'
              break
            case 'booster':
              bgColor = 'bg-yellow-400'
              break
          }
        }
        grid.push(
          <div
            key={`${row}-${col}`}
            className={`w-8 h-8 border border-gray-700 ${bgColor} ${
              row === GRID_ROWS - 1 ? 'border-b-4 border-b-red-600' : ''
            }`}
          />
        )
      }
    }
    return grid
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div
        className="grid gap-0 mb-4"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        }}
      >
        {renderGrid()}
      </div>
      {winner ? (
        <div className="text-2xl font-bold text-white mb-4">
          {winner === 'player1' ? 'Player 1' : 'Player 2'} wins!
        </div>
      ) : (
        <form onSubmit={handleCommand} className="w-full max-w-3xl mb-4">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-full p-2 bg-gray-900 text-red-500 font-mono focus:outline-none"
            placeholder={`${currentPlayer}@blocks.io:~$ (Type 'up', 'down', 'left', or 'right')`}
          />
        </form>
      )}
      <div className="text-white">
        Current player: {currentPlayer === 'player1' ? 'Player 1 (Blue)' : 'Player 2 (Green)'}
      </div>
    </div>
  )
}