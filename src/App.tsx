import { useEffect, useState } from 'react'
import { CatchGame } from '@/components/CatchGame'
import { FlappyGame } from '@/components/FlappyGame'
import { GameMenu, type GameId } from '@/components/GameMenu'
import { PacmanGame } from '@/components/PacmanGame'
import { RacerGame } from '@/components/RacerGame'
import { WhackGame } from '@/components/WhackGame'

function gameFromHash(): GameId | null {
  const id = window.location.hash.replace(/^#\/?/, '')
  return id === 'pacman' || id === 'flappy-aisha' || id === 'whack-a-dad' || id === 'catch-the-food' || id === 'dagracer' ? id : null
}

export default function App() {
  const [game, setGame] = useState(gameFromHash)

  useEffect(() => {
    const onHash = () => setGame(gameFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const open = (id: GameId | null) => {
    window.location.hash = id ? `/${id}` : ''
  }

  if (game === 'pacman') return <PacmanGame onExit={() => open(null)} />
  if (game === 'flappy-aisha') return <FlappyGame onExit={() => open(null)} />
  if (game === 'whack-a-dad') return <WhackGame onExit={() => open(null)} />
  if (game === 'catch-the-food') return <CatchGame onExit={() => open(null)} />
  if (game === 'dagracer') return <RacerGame onExit={() => open(null)} />
  return <GameMenu onPick={open} />
}
