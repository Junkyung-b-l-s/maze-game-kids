import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateMaze, type Cell } from './utils/mazeGenerator';

// Types
type Character = 'naeun' | 'doha';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_MAP = {
  easy: { rows: 5, cols: 5, size: 80 },
  medium: { rows: 10, cols: 10, size: 50 },
  hard: { rows: 15, cols: 15, size: 35 },
};

const CHARACTERS = {
  naeun: {
    name: '나은',
    img: '/naeun.jpeg',
    target: '빛나핑',
    targetImg: '/bitnaping.jpeg',
    mazeColor: '#a29bfe', // Purple-ish
    wallColor: '#6c5ce7'
  },
  doha: {
    name: '도하',
    img: '/doha.jpeg',
    target: '베베핀',
    targetImg: '/bebephin.webp',
    mazeColor: '#b2f2bb', // Green-ish
    wallColor: '#40c057'
  },
};

export default function App() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won'>('start');
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPosition, setPlayerPosition] = useState({ r: 0, c: 0 });
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Game
  const startGame = () => {
    if (!character) return;
    const { rows, cols } = DIFFICULTY_MAP[difficulty];
    setMaze(generateMaze(rows, cols));
    setPlayerPosition({ r: 0, c: 0 });
    setGameState('playing');
  };

  const handleNewMaze = () => {
    const { rows, cols } = DIFFICULTY_MAP[difficulty];
    setMaze(generateMaze(rows, cols));
    setPlayerPosition({ r: 0, c: 0 });
    setGameState('playing');
  };

  // Movement Logic
  const movePlayer = (dr: number, dc: number) => {
    const { r, c } = playerPosition;
    const nr = r + dr;
    const nc = c + dc;
    const { rows, cols } = DIFFICULTY_MAP[difficulty];

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;

    const currentCell = maze[r][c];
    if (dr === -1 && currentCell.walls.top) return;
    if (dr === 1 && currentCell.walls.bottom) return;
    if (dc === -1 && currentCell.walls.left) return;
    if (dc === 1 && currentCell.walls.right) return;

    setPlayerPosition({ r: nr, c: nc });
    playSound('move');

    if (nr === rows - 1 && nc === cols - 1) {
      setGameState('won');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      playSound('win');
    }
  };

  // Drag Interaction
  const lastPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const threshold = DIFFICULTY_MAP[difficulty].size * 0.8; // Increased threshold for more deliberate movement

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        movePlayer(0, dx > 0 ? 1 : -1);
      } else {
        movePlayer(dy > 0 ? 1 : -1, 0);
      }
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Sounds (Using Web Audio API)
  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = (type: 'move' | 'win') => {
    if (isMuted) return;
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (type === 'move' ? 0.05 : 0.5));
  };

  if (gameState === 'start') {
    return (
      <div className="app-container">
        <div className="glass-card">
          <h1 className="title">신나는 미로 체험!</h1>

          <div className="selection-grid">
            {(['naeun', 'doha'] as Character[]).map((id) => (
              <div
                key={id}
                className={`selection-card ${character === id ? 'active' : ''}`}
                onClick={() => setCharacter(id)}
              >
                <img src={CHARACTERS[id].img} alt={CHARACTERS[id].name} className="selection-image" />
                <h2>{CHARACTERS[id].name}</h2>
              </div>
            ))}
          </div>

          <div className="difficulty-buttons">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`btn btn-difficulty ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            disabled={!character}
            onClick={startGame}
          >
            시작하기!
          </button>
        </div>
      </div>
    );
  }

  const currentDiff = DIFFICULTY_MAP[difficulty];
  const currentChar = CHARACTERS[character!];

  return (
    <div className="app-container">
      <div className="maze-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="maze-grid"
          style={{
            gridTemplateRows: `repeat(${currentDiff.rows}, ${currentDiff.size}px)`,
            gridTemplateColumns: `repeat(${currentDiff.cols}, ${currentDiff.size}px)`,
            backgroundColor: currentChar.mazeColor,
            borderColor: currentChar.wallColor,
          }}
        >
          {maze.flat().map((cell, i) => (
            <div key={i} className="maze-cell">
              {cell.walls.top && <div className="wall wall-top" style={{ backgroundColor: currentChar.wallColor }} />}
              {cell.walls.right && <div className="wall wall-right" style={{ backgroundColor: currentChar.wallColor }} />}
              {cell.walls.bottom && <div className="wall wall-bottom" style={{ backgroundColor: currentChar.wallColor }} />}
              {cell.walls.left && <div className="wall wall-left" style={{ backgroundColor: currentChar.wallColor }} />}
            </div>
          ))}

          {/* Player */}
          <motion.div
            className="player"
            animate={{
              x: playerPosition.c * currentDiff.size,
              y: playerPosition.r * currentDiff.size,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: currentDiff.size, height: currentDiff.size, padding: 4 }}
          >
            <motion.img
              key={`${playerPosition.r}-${playerPosition.c}`}
              src={currentChar.img}
              initial={{ y: 0 }}
              animate={{
                y: [0, -currentDiff.size * 0.5, 0],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </motion.div>

          {/* Goal */}
          <div
            className="goal"
            style={{
              left: (currentDiff.cols - 1) * currentDiff.size,
              top: (currentDiff.rows - 1) * currentDiff.size,
              width: currentDiff.size,
              height: currentDiff.size,
              padding: 4
            }}
          >
            <motion.img
              src={currentChar.targetImg}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-difficulty" onClick={() => setGameState('start')}>
          <Settings size={24} /> 처음으로
        </button>
        <button className="btn btn-difficulty" onClick={handleNewMaze}>
          <RefreshCw size={24} /> 새로운 미로
        </button>
        <button className="btn btn-difficulty" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {gameState === 'won' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="glass-card"
            style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, textAlign: 'center' }}
          >
            <h1 style={{ marginBottom: '1rem' }}>🎉 성공! 🎉</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{currentChar.name}가 {currentChar.target}를 찾았어요!</p>
            <button className="btn btn-primary" onClick={handleNewMaze}>다시 하기</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
