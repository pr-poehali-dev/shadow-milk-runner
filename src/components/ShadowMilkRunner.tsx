import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Obstacle {
  id: number;
  x: number;
  type: 'hole' | 'barrier';
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'star' | 'cookie';
}

export default function ShadowMilkRunner() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [speed, setSpeed] = useState(5);
  
  const gameLoopRef = useRef<number>();
  const obstacleCounterRef = useRef(0);
  const collectibleCounterRef = useRef(0);

  const handleJump = useCallback(() => {
    if (gameState === 'playing' && !isJumping) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 600);
    }
  }, [gameState, isJumping]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setDistance(0);
    setSpeed(5);
    setObstacles([]);
    setCollectibles([]);
    obstacleCounterRef.current = 0;
    collectibleCounterRef.current = 0;
  };

  const gameOver = () => {
    setGameState('gameover');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setDistance(prev => prev + 1);
      
      if (Math.random() < 0.015) {
        setObstacles(prev => [...prev, {
          id: obstacleCounterRef.current++,
          x: window.innerWidth,
          type: Math.random() > 0.5 ? 'hole' : 'barrier'
        }]);
      }
      
      if (Math.random() < 0.02) {
        setCollectibles(prev => [...prev, {
          id: collectibleCounterRef.current++,
          x: window.innerWidth,
          y: Math.random() > 0.5 ? 100 : 200,
          type: Math.random() > 0.3 ? 'star' : 'cookie'
        }]);
      }

      setObstacles(prev => 
        prev.map(obs => ({ ...obs, x: obs.x - speed }))
          .filter(obs => obs.x > -100)
      );

      setCollectibles(prev => 
        prev.map(col => ({ ...col, x: col.x - speed }))
          .filter(col => col.x > -100)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, speed]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const playerX = 120;
    const playerY = isJumping ? 200 : 320;
    const playerWidth = 60;
    const playerHeight = 80;

    obstacles.forEach(obs => {
      if (obs.x < playerX + playerWidth && obs.x + 60 > playerX) {
        if (obs.type === 'barrier' && !isJumping) {
          gameOver();
        } else if (obs.type === 'hole' && !isJumping) {
          gameOver();
        }
      }
    });

    collectibles.forEach((col, index) => {
      if (
        col.x < playerX + playerWidth && 
        col.x + 30 > playerX &&
        Math.abs(col.y - (playerY - 40)) < 40
      ) {
        setScore(prev => prev + (col.type === 'star' ? 10 : 5));
        setCollectibles(prev => prev.filter((_, i) => i !== index));
      }
    });

  }, [obstacles, collectibles, isJumping, gameState]);

  useEffect(() => {
    if (distance > 0 && distance % 1000 === 0) {
      setSpeed(prev => prev + 0.5);
    }
  }, [distance]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleJump]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-purple-300 via-pink-200 to-yellow-100"
      onClick={handleJump}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(157,78,221,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,107,157,0.2),transparent_50%)]" />

      {gameState === 'menu' && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full gap-8">
          <h1 className="text-8xl font-bold text-center" style={{
            color: '#FFC107',
            textShadow: '4px 4px 0 #4A148C, -2px -2px 0 #9D4EDD, 2px -2px 0 #9D4EDD, -2px 2px 0 #9D4EDD, 2px 2px 0 #9D4EDD'
          }}>
            SHADOW<br/>RUNNER
          </h1>
          <Button 
            onClick={startGame}
            className="text-3xl px-16 py-8 rounded-full font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-2xl transform hover:scale-110 transition-all"
          >
            ИГРАТЬ
          </Button>
          <p className="text-xl text-purple-800 font-semibold">Нажми ПРОБЕЛ или кликни для прыжка!</p>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div className="absolute top-6 left-6 z-10 flex gap-6">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border-4 border-purple-400">
              <div className="flex items-center gap-2">
                <Icon name="Star" className="text-yellow-500" size={24} />
                <span className="text-2xl font-bold text-purple-800">{score}</span>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border-4 border-pink-400">
              <div className="flex items-center gap-2">
                <Icon name="Zap" className="text-orange-500" size={24} />
                <span className="text-2xl font-bold text-purple-800">{Math.floor(distance / 10)}м</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-600 to-yellow-400 border-t-8 border-yellow-700" />

          <div
            className={`absolute left-24 transition-all ${isJumping ? 'animate-jump' : 'animate-run'}`}
            style={{
              bottom: isJumping ? '320px' : '128px',
              width: '60px',
              height: '80px',
              transition: isJumping ? 'none' : 'bottom 0.1s'
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-purple-800 rounded-3xl" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full border-4 border-purple-900" />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-12 h-12 bg-pink-500 rounded-full" />
              <div className="absolute bottom-2 left-2 w-5 h-8 bg-purple-900 rounded-lg" />
              <div className="absolute bottom-2 right-2 w-5 h-8 bg-purple-900 rounded-lg" />
            </div>
          </div>

          {obstacles.map(obs => (
            <div
              key={obs.id}
              className="absolute"
              style={{
                left: `${obs.x}px`,
                bottom: obs.type === 'barrier' ? '128px' : '96px',
                width: '60px',
                height: obs.type === 'barrier' ? '80px' : '32px'
              }}
            >
              {obs.type === 'barrier' ? (
                <div className="w-full h-full bg-gradient-to-b from-red-500 to-red-700 rounded-lg border-4 border-red-900 shadow-xl" />
              ) : (
                <div className="w-full h-full bg-purple-900 rounded-t-full border-4 border-purple-950" />
              )}
            </div>
          ))}

          {collectibles.map(col => (
            <div
              key={col.id}
              className="absolute animate-bounce-small"
              style={{
                left: `${col.x}px`,
                bottom: `${col.y}px`,
                width: '30px',
                height: '30px'
              }}
            >
              {col.type === 'star' ? (
                <Icon name="Star" className="text-yellow-400 fill-yellow-400 animate-spin-slow" size={30} />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 border-4 border-orange-600" />
              )}
            </div>
          ))}
        </>
      )}

      {gameState === 'gameover' && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full gap-8">
          <h2 className="text-7xl font-bold" style={{
            color: '#FF6B9D',
            textShadow: '3px 3px 0 #4A148C, -2px -2px 0 #9D4EDD'
          }}>
            GAME OVER
          </h2>
          <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-4 border-purple-400">
            <div className="flex flex-col gap-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <Icon name="Star" className="text-yellow-500" size={32} />
                <span className="text-4xl font-bold text-purple-800">Очки: {score}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Icon name="Zap" className="text-orange-500" size={32} />
                <span className="text-4xl font-bold text-purple-800">Дистанция: {Math.floor(distance / 10)}м</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={startGame}
            className="text-3xl px-16 py-8 rounded-full font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-2xl transform hover:scale-110 transition-all"
          >
            ЕЩЁ РАЗ
          </Button>
        </div>
      )}
    </div>
  );
}
