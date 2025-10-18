import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

interface SnakeGameProps {
  onClose?: () => void;
  errorType?: string;
}

export const SnakeGame = ({ onClose, errorType }: SnakeGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('hideout_snake_highscore') || '0');
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 0;
    let dy = 0;
    let currentScore = 0;

    const drawGame = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw snake
      ctx.fillStyle = '#8ebf5c';
      snake.forEach((segment, index) => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        if (index === 0) {
          // Draw eyes on head
          ctx.fillStyle = '#000';
          ctx.fillRect(segment.x * gridSize + 5, segment.y * gridSize + 5, 3, 3);
          ctx.fillRect(segment.x * gridSize + 12, segment.y * gridSize + 5, 3, 3);
          ctx.fillStyle = '#8ebf5c';
        }
      });

      // Draw food
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

      // Move snake
      if (dx !== 0 || dy !== 0) {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Check collision with walls
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
          setGameOver(true);
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('hideout_snake_highscore', currentScore.toString());
          }
          return;
        }

        // Check collision with self
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('hideout_snake_highscore', currentScore.toString());
          }
          return;
        }

        snake.unshift(head);

        // Check if food eaten
        if (head.x === food.x && head.y === food.y) {
          currentScore++;
          setScore(currentScore);
          food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
          };
        } else {
          snake.pop();
        }
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (dy === 0) { dx = 0; dy = -1; }
          break;
        case 'ArrowDown':
          if (dy === 0) { dx = 0; dy = 1; }
          break;
        case 'ArrowLeft':
          if (dx === 0) { dx = -1; dy = 0; }
          break;
        case 'ArrowRight':
          if (dx === 0) { dx = 1; dy = 0; }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    const gameLoop = setInterval(drawGame, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameLoop);
    };
  }, [gameOver, highScore]);

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">404 - Page Not Found</h2>
        {errorType && <p className="text-muted-foreground mb-4">Error: {errorType}</p>}
        <p className="text-muted-foreground">Play Snake while you wait!</p>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex justify-between mb-4">
          <div className="text-sm">Score: <span className="font-bold text-primary">{score}</span></div>
          <div className="text-sm">High Score: <span className="font-bold text-primary">{highScore}</span></div>
        </div>

        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border-2 border-primary/30 rounded"
        />

        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-lg font-bold mb-2">Game Over!</p>
            <Button onClick={resetGame} className="mr-2">Play Again</Button>
            {onClose && <Button variant="outline" onClick={onClose}>Go Back</Button>}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Use arrow keys to control the snake
        </p>
      </div>
    </div>
  );
};
