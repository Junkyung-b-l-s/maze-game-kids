import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, Volume2, VolumeX, Timer, Footprints } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateMaze, findPath, type Cell } from './utils/mazeGenerator';
import { withJosa } from './utils/koreanUtils';

// Types
type Character = 'naeun' | 'doha' | 'mom' | 'dad';
type Target = 'chorong' | 'unicorn' | 'prince' | 'mermaid' | 'elsa' | 'bitnaping' | 'bebephin' | 'peppa' | 'george';
type Difficulty = 'easy' | 'medium' | 'hard';
type GameStatus = 'start' | 'playing' | 'won' | 'lost';

const DIFFICULTY_MAP = {
  easy: { rows: 5, cols: 5 },
  medium: { rows: 10, cols: 10 },
  hard: { rows: 15, cols: 15 },
};

const CHARACTERS: Record<Character, { name: string, img: string, mazeColor: string, wallColor: string }> = {
  naeun: { name: '나은', img: 'naeun.jpeg', mazeColor: '#f3f0ff', wallColor: '#845ef7' },
  doha: { name: '도하', img: 'doha.jpeg', mazeColor: '#ebfbee', wallColor: '#40c057' },
  mom: { name: '엄마', img: 'mom.jpeg', mazeColor: '#fff5f5', wallColor: '#fa5252' },
  dad: { name: '아빠', img: 'dad.jpeg', mazeColor: '#fff9db', wallColor: '#fab005' },
};

const TARGETS: Record<Target, { name: string, img: string }> = {
  chorong: { name: '초롱핑', img: 'chorong.webp' },
  unicorn: { name: '유니콘', img: 'unicorn.png' },
  prince: { name: '왕자님', img: 'prince.webp' },
  mermaid: { name: '인어공주', img: 'ariel.jpg' },
  elsa: { name: '엘사', img: 'Elsa.webp' },
  bitnaping: { name: '빛나핑', img: 'bitnaping.jpeg' },
  bebephin: { name: '베베핀', img: 'bebephin.webp' },
  peppa: { name: '페파', img: 'peppa.jpg' },
  george: { name: '조지', img: 'george.webp' },
};

const QUIZZES = [
  { type: 'math', question: '5 + 3 = ?', options: ['7', '8', '9'], answer: '8' },
  { type: 'math', question: '9 - 4 = ?', options: ['4', '5', '6'], answer: '5' },
  { type: 'math', question: '2 + 6 = ?', options: ['7', '8', '9'], answer: '8' },
  { type: 'math', question: '8 - 3 = ?', options: ['5', '6', '7'], answer: '5' },
  { type: 'word', question: '🍎 (이것은 무엇일까요?)', options: ['Apple', 'Banana', 'Grape'], answer: 'Apple' },
  { type: 'word', question: '🚗 (이것은 무엇일까요?)', options: ['Bike', 'Car', 'Plane'], answer: 'Car' },
  { type: 'word', question: '🐶 (이것은 무엇일까요?)', options: ['Cat', 'Dog', 'Bear'], answer: 'Dog' },
  { type: 'word', question: '☀️ (이것은 무엇일까요?)', options: ['Moon', 'Star', 'Sun'], answer: 'Sun' },
];

export default function App() {
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameState, setGameState] = useState<GameStatus>('start');
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPosition, setPlayerPosition] = useState({ r: 0, c: 0 });
  const [isMuted, setIsMuted] = useState(false);

  // T-Rex state
  const [tRexPosition, setTRexPosition] = useState({ r: 0, c: 0 });
  const [isTRexActive, setIsTRexActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Game Stats
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Quiz
  const [activeQuiz, setActiveQuiz] = useState<typeof QUIZZES[0] | null>(null);
  const quizSolvedRef = useRef<Set<string>>(new Set());

  // Screen size for maximizing maze
  const [cellSize, setCellSize] = useState(50);
  const mazeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCellSize = () => {
      const { rows, cols } = DIFFICULTY_MAP[difficulty];
      const padding = 120; // Room for UI
      const availableWidth = window.innerWidth - 40;
      const availableHeight = window.innerHeight - padding - 80;
      const sizeW = Math.floor(availableWidth / cols);
      const sizeH = Math.floor(availableHeight / rows);
      setCellSize(Math.min(sizeW, sizeH, 100)); // Max 100px
    };
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [difficulty, gameState]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && gameState === 'playing') {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameState]);

  const startGame = () => {
    if (selectedCharacters.length === 0 || !target) return;
    const { rows, cols } = DIFFICULTY_MAP[difficulty];
    const { maze: newMaze } = generateMaze(rows, cols);
    setMaze(newMaze);
    setPlayerPosition({ r: 0, c: 0 });
    setTRexPosition({ r: 0, c: 0 });
    setIsTRexActive(false);
    setGameState('playing');
    setElapsedTime(0);
    setStepCount(0);
    setIsTimerRunning(false);
    quizSolvedRef.current.clear();
  };

  const handleNewMaze = () => {
    const { rows, cols } = DIFFICULTY_MAP[difficulty];
    const { maze: newMaze } = generateMaze(rows, cols);
    setMaze(newMaze);
    setPlayerPosition({ r: 0, c: 0 });
    setTRexPosition({ r: 0, c: 0 });
    setIsTRexActive(false);
    setGameState('playing');
    setElapsedTime(0);
    setStepCount(0);
    setIsTimerRunning(false);
    quizSolvedRef.current.clear();
    setActiveQuiz(null);
  };

  const movePlayer = (dr: number, dc: number) => {
    if (activeQuiz) return;

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

    // Start timer on first move
    if (!isTimerRunning) setIsTimerRunning(true);

    const nextCell = maze[nr][nc];
    const cellKey = `${nr},${nc}`;

    // T-Rex Activation and Movement
    // Use Manhattan distance or simple grid progress for a more robust trigger
    const progressFactor = (nr + nc) / (rows + cols - 2);

    if (!isTRexActive && progressFactor >= 0.45) { // Activate around 45% progress
      setIsTRexActive(true);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 1000);
      playSound('roar'); // Play the roar sound!
    }

    if (isTRexActive && stepCount % 3 !== 0) { // Move 2 steps for every 3 player steps (Faster!)
      const pathForTRex = findPath(maze, tRexPosition, { r: nr, c: nc }, rows, cols);
      if (pathForTRex.length > 1) {
        const nextTRexPos = pathForTRex[1];
        setTRexPosition(nextTRexPos);

        // Check for collision
        if (nextTRexPos.r === nr && nextTRexPos.c === nc) {
          setGameState('lost');
          setIsTimerRunning(false);
          return;
        }
      }
    }

    if (nextCell.isQuizCell && !quizSolvedRef.current.has(cellKey)) {
      setPlayerPosition({ r: nr, c: nc }); // Move to the quiz cell
      setStepCount(prev => prev + 1);
      const randomQuiz = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      setActiveQuiz(randomQuiz);
      playSound('move');
      return;
    }

    setPlayerPosition({ r: nr, c: nc });
    setStepCount(prev => prev + 1);
    playSound('move');

    if (nr === rows - 1 && nc === cols - 1) {
      setGameState('won');
      setIsTimerRunning(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      playSound('win');
    }
  };

  const solveQuiz = (option: string) => {
    if (!activeQuiz) return;
    if (option === activeQuiz.answer) {
      const cellKey = `${playerPosition.r},${playerPosition.c}`;
      quizSolvedRef.current.add(cellKey);
      setActiveQuiz(null);
      playSound('win');
    } else {
      playSound('move'); // "Wrong" sound or just same move sound
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
    const threshold = cellSize * 0.5;

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
  const playSound = (type: 'move' | 'win' | 'roar') => {
    if (isMuted) return;
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'roar') {
      // Synthesize a roar-like sound using low frequency and noise
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      return; // Early return because we connected differently
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (type === 'move' ? 0.05 : 0.5));
  };

  if (gameState === 'start') {
    return (
      <div className="app-container start-screen">
        <div className="glass-card">
          <h1 className="title">신나는 미로 체험!</h1>

          <div className="selection-wrapper">
            <div className="section">
              <h3>나의 캐릭터 선택</h3>
              <div className="selection-grid players">
                {(Object.keys(CHARACTERS) as Character[]).map((id) => (
                  <div
                    key={id}
                    className={`selection-card ${selectedCharacters.includes(id) ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCharacters(prev =>
                        prev.includes(id)
                          ? prev.filter(c => c !== id)
                          : [...prev, id]
                      );
                    }}
                  >
                    <img src={CHARACTERS[id].img} alt={CHARACTERS[id].name} className="selection-image" />
                    <p>{CHARACTERS[id].name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <h3>도와줄 친구 선택</h3>
              <div className="selection-grid targets">
                {(Object.keys(TARGETS) as Target[]).map((id) => (
                  <div
                    key={id}
                    className={`selection-card mini ${target === id ? 'active' : ''}`}
                    onClick={() => setTarget(id)}
                  >
                    <img src={TARGETS[id].img} alt={TARGETS[id].name} className="selection-image-mini" />
                    <p>{TARGETS[id].name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section bottom-controls">
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
              disabled={selectedCharacters.length === 0 || !target}
              onClick={startGame}
            >
              미로 탐험 시작!
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDiff = DIFFICULTY_MAP[difficulty];
  const themeChar = CHARACTERS[selectedCharacters[0]]; // Use first character for theme
  const currentTarget = TARGETS[target!];

  const getJoinedNames = () => {
    const names = selectedCharacters.map(id => CHARACTERS[id].name);
    if (names.length === 1) return withJosa(names[0], '이/가');
    const last = names.pop()!;
    return `${names.join(', ')} 그리고 ${withJosa(last, '이/가')}`;
  };

  return (
    <div className="app-container playing">
      <div className="stats-header">
        <div className="stat-item">
          <Timer size={20} />
          <span>{elapsedTime}초</span>
        </div>
        <div className="stat-item">
          <Footprints size={20} />
          <span>{stepCount}걸음</span>
        </div>
      </div>

      <div className="maze-wrapper">
        <div className="maze-container"
          ref={mazeRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="maze-grid"
            style={{
              gridTemplateRows: `repeat(${currentDiff.rows}, ${cellSize}px)`,
              gridTemplateColumns: `repeat(${currentDiff.cols}, ${cellSize}px)`,
              backgroundColor: themeChar.mazeColor,
              borderColor: themeChar.wallColor,
              transform: screenShake ? 'translate(2px, 2px)' : 'none',
              transition: 'transform 0.1s'
            }}
          >
            {maze.flat().map((cell, i) => (
              <div key={i} className="maze-cell" style={{ width: cellSize, height: cellSize }}>
                {cell.walls.top && <div className="wall wall-top" style={{ backgroundColor: themeChar.wallColor }} />}
                {cell.walls.right && <div className="wall wall-right" style={{ backgroundColor: themeChar.wallColor }} />}
                {cell.walls.bottom && <div className="wall wall-bottom" style={{ backgroundColor: themeChar.wallColor }} />}
                {cell.walls.left && <div className="wall wall-left" style={{ backgroundColor: themeChar.wallColor }} />}
                {cell.isQuizCell && !quizSolvedRef.current.has(`${cell.r},${cell.c}`) && (
                  <div className="quiz-cell-marker">?</div>
                )}
              </div>
            ))}

            {/* T-Rex */}
            <AnimatePresence>
              {isTRexActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: tRexPosition.c * cellSize,
                    y: tRexPosition.r * cellSize,
                  }}
                  className="t-rex"
                  style={{
                    position: 'absolute',
                    width: cellSize,
                    height: cellSize,
                    fontSize: cellSize * 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 8,
                    pointerEvents: 'none'
                  }}
                >
                  🦖
                </motion.div>
              )}
            </AnimatePresence>

            {/* Players Group */}
            <motion.div
              className="player-group"
              animate={{
                x: playerPosition.c * cellSize,
                y: playerPosition.r * cellSize,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: cellSize,
                height: cellSize,
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              {selectedCharacters.map((id, index) => {
                const char = CHARACTERS[id];
                // Scale down characters when multiple are selected
                const count = selectedCharacters.length;
                const scale = count > 1 ? (count > 2 ? 0.4 : 0.5) : 0.7;

                // Arrange in a small circle or grid if many
                const spread = cellSize * 0.2;
                const offset = count > 1
                  ? {
                    x: (index % 2 === 0 ? -1 : 1) * spread,
                    y: (index < 2 ? -1 : 1) * spread
                  }
                  : { x: 0, y: 0 };

                return (
                  <div
                    key={id}
                    style={{
                      position: 'absolute',
                      width: cellSize * scale,
                      height: cellSize * scale,
                      left: `calc(50% + ${offset.x}px)`,
                      top: `calc(50% + ${offset.y}px)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {[
                        { name: 'arm-l', x: '-15%', y: '25%', swing: [-40, 40], origin: 'top right' },
                        { name: 'arm-r', x: '90%', y: '25%', swing: [40, -40], origin: 'top left' },
                        { name: 'leg-l', x: '20%', y: '80%', swing: [30, -30], origin: 'top center' },
                        { name: 'leg-r', x: '55%', y: '80%', swing: [-30, 30], origin: 'top center' },
                      ].map(limb => (
                        <motion.div
                          key={limb.name}
                          style={{
                            position: 'absolute',
                            width: limb.name.includes('arm') ? '20%' : '25%',
                            height: '40%',
                            backgroundColor: char.wallColor,
                            borderRadius: '10px',
                            left: limb.x,
                            top: limb.y,
                            zIndex: 1,
                            transformOrigin: limb.origin
                          }}
                          animate={{
                            rotate: stepCount % 2 === 0 ? limb.swing[0] : limb.swing[1]
                          }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        />
                      ))}
                      <motion.img
                        src={char.img}
                        animate={{
                          scale: [1, 1.2, 1],
                          y: [0, -cellSize * 0.1, 0],
                          rotate: stepCount % 2 === 0 ? -10 : 10
                        }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid white',
                          display: 'block',
                          zIndex: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Goal */}
            <div
              className="goal"
              style={{
                left: (currentDiff.cols - 1) * cellSize,
                top: (currentDiff.rows - 1) * cellSize,
                width: cellSize,
                height: cellSize,
                padding: cellSize * 0.1
              }}
            >
              <motion.img
                src={currentTarget.img}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid gold' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-icon" onClick={() => setGameState('start')}>
          <Settings size={24} />
        </button>
        <button className="btn btn-icon" onClick={handleNewMaze}>
          <RefreshCw size={24} />
        </button>
        <button className="btn btn-icon" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {activeQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="quiz-overlay"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="quiz-card glass-card"
            >
              <h2>반짝 퀴즈!</h2>
              <p className="questionText">{activeQuiz.question}</p>
              <div className="quiz-options">
                {activeQuiz.options.map((opt, i) => (
                  <button key={i} className="btn btn-quiz" onClick={() => solveQuiz(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'won' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="win-overlay"
          >
            <div className="glass-card win-card">
              <h1>🎉 성공! 🎉</h1>
              <p>{getJoinedNames()} {withJosa(currentTarget.name, '을/를')} 찾았어요!</p>
              <div className="final-stats">
                <div><Timer size={16} /> {elapsedTime}초</div>
                <div><Footprints size={16} /> {stepCount}걸음</div>
              </div>
              <button className="btn btn-primary" onClick={handleNewMaze}>다시 하기</button>
            </div>
          </motion.div>
        )}

        {gameState === 'lost' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="win-overlay"
          >
            <div className="glass-card win-card" style={{ border: '4px solid #fa5252' }}>
              <h1 style={{ color: '#fa5252', fontSize: '3rem' }}>🦖 쿠와아앙! 🦖</h1>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>티라노에게 잡혔어요! 다시 도망가 볼까요?</p>
              <div className="final-stats">
                <div><Footprints size={16} /> {stepCount}걸음 도망침</div>
              </div>
              <button className="btn btn-primary" style={{ background: '#fa5252' }} onClick={handleNewMaze}>다시 도전!</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
