import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import gamesData from "@/data/games.json";

type Game = {
  name: string;
  icon: string;
  popularity: string[];
  categories: string[];
  gameLink: string;
};

const games: Game[] = gamesData;

const GamePlayer = () => {
  const [searchParams] = useSearchParams();
  const gameParam = searchParams.get("game");
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (gameParam) {
      const foundGame = games.find(
        (g) => g.name.toLowerCase().replace(/\s+/g, '-') === gameParam
      );
      setGame(foundGame || null);
    }
  }, [gameParam]);

  const handleFullscreen = () => {
    const iframe = document.getElementById("game-iframe") as HTMLIFrameElement;
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  if (!gameParam) {
    return <Navigate to="/games" replace />;
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Game Not Found</h1>
            <p className="text-muted-foreground">The game you're looking for doesn't exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-foreground">{game.name}</h1>
          
          <div className="w-full aspect-video bg-card rounded-lg overflow-hidden border border-border">
            <iframe
              id="game-iframe"
              src={game.gameLink}
              className="w-full h-full"
              title={game.name}
              allowFullScreen
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleFullscreen}
              className="gap-2"
              size="lg"
            >
              <Maximize className="w-5 h-5" />
              Fullscreen
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePlayer;
