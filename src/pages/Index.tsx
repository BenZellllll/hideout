import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { GridBackground } from "@/components/GridBackground";
import { HomeShortcuts } from "@/components/HomeShortcuts";
import { usePageTitle } from "@/hooks/use-page-title";
import { ChevronDown } from "lucide-react";
import { AnimatedBorder } from "@/components/AnimatedBorder";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchEngine = "google" | "duckduckgo" | "bing" | "yahoo" | "yandex" | "brave";

const SEARCH_ENGINES: { id: SearchEngine; name: string; icon: React.ReactNode; searchUrl: string }[] = [
  { 
    id: "google", 
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    searchUrl: "https://www.google.com/search?q="
  },
  { 
    id: "duckduckgo", 
    name: "DuckDuckGo",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <circle cx="12" cy="12" r="10" fill="#DE5833"/>
        <ellipse cx="9.5" cy="10" rx="2" ry="2.5" fill="white"/>
        <ellipse cx="14.5" cy="10" rx="2" ry="2.5" fill="white"/>
        <circle cx="9.5" cy="10.5" r="1" fill="#2D4F8E"/>
        <circle cx="14.5" cy="10.5" r="1" fill="#2D4F8E"/>
        <ellipse cx="12" cy="15" rx="3" ry="2" fill="#65BC46"/>
        <path d="M9 14.5c1.5 2 4.5 2 6 0" stroke="#65BC46" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    searchUrl: "https://duckduckgo.com/?q="
  },
  { 
    id: "bing", 
    name: "Bing",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <path fill="#008373" d="M5 3v16.5l4 2.5 8-4.5v-4l-6-2.25V3z"/>
        <path fill="#00A88E" d="M9 9.75l6 2.25v4l-6 3.5z"/>
      </svg>
    ),
    searchUrl: "https://www.bing.com/search?q="
  },
  { 
    id: "yahoo", 
    name: "Yahoo",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <circle cx="12" cy="12" r="11" fill="#6001D2"/>
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">Y!</text>
      </svg>
    ),
    searchUrl: "https://search.yahoo.com/search?p="
  },
  { 
    id: "yandex", 
    name: "Yandex",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <circle cx="12" cy="12" r="11" fill="#FF0000"/>
        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">Y</text>
      </svg>
    ),
    searchUrl: "https://yandex.com/search/?text="
  },
  { 
    id: "brave", 
    name: "Brave",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <path fill="#FB542B" d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"/>
        <path fill="#FFF" d="M12 4.5L6 7.5v5c0 4.14 2.88 8.02 6 9 3.12-.98 6-4.86 6-9v-5l-6-3z"/>
        <path fill="#FB542B" d="M12 6L8 8v4c0 2.76 1.92 5.35 4 6 2.08-.65 4-3.24 4-6V8l-4-2z"/>
      </svg>
    ),
    searchUrl: "https://search.brave.com/search?q="
  },
];

const Index = () => {
  usePageTitle('Home');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEngine, setSearchEngine] = useState<SearchEngine>("google");
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const currentEngine = SEARCH_ENGINES.find(e => e.id === searchEngine) || SEARCH_ENGINES[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (searchContainerRef.current) {
      const rect = searchContainerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to browser with search query
      const url = searchQuery.includes('.') && !searchQuery.includes(' ')
        ? (searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`)
        : `${currentEngine.searchUrl}${encodeURIComponent(searchQuery)}`;
      
      navigate('/browser', { state: { initialUrl: url } });
    }
  };
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <GridBackground />
      <Navigation />

      {/* Main Content - Centered with Side Ads */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <main className="relative text-center space-y-6 sm:space-y-8 animate-fade-in w-full max-w-3xl">
          {/* Big Hideout Text */}
          <div className="relative">
            <h1 className="text-6xl sm:text-9xl md:text-[12rem] font-bold tracking-tight">
              <span className="text-foreground">Hideout</span>
              <span className="text-primary">.</span>
            </h1>
          </div>

          {/* Search Bar with Button Inside */}
          <div 
            ref={searchContainerRef}
            className="relative search-container"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <form onSubmit={handleSearch} className="relative w-full">
            
            {/* Search Engine Dropdown on the left */}
            <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {currentEngine.icon}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-card border-border">
                  {SEARCH_ENGINES.map((engine) => (
                    <DropdownMenuItem 
                      key={engine.id}
                      onClick={() => setSearchEngine(engine.id)}
                      className={`flex items-center gap-2 cursor-pointer ${searchEngine === engine.id ? 'bg-accent' : ''}`}
                    >
                      {engine.icon}
                      <span>{engine.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Animated border line that travels around - outside wrapper to avoid blur */}
            <AnimatedBorder />
            
            <div className="relative search-input-wrapper">
              {/* Cursor-following glow effect - inside input wrapper */}
              <div 
                className="search-cursor-glow"
                style={{
                  left: mousePos.x,
                  top: mousePos.y,
                  opacity: isHovering ? 1 : 0,
                }}
              />
              
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${currentEngine.name} or type URL`}
                className="relative w-full h-12 sm:h-16 pl-14 sm:pl-16 pr-24 sm:pr-32 text-lg sm:text-2xl bg-background/30 backdrop-blur-md border border-border/30 transition-colors rounded-2xl z-10 placeholder:text-muted-foreground/70 placeholder:text-base placeholder:sm:text-xl"
              />
            </div>
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:h-12 px-4 sm:px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm sm:text-base z-20"
            >
              Search
            </button>
            </form>
          </div>

          {/* Shortcuts */}
          <HomeShortcuts />
        </main>
      </div>

    </div>
  );
};

export default Index;
