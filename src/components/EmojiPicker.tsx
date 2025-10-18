import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Smile, Clock } from 'lucide-react';

const emojiCategories: Record<string, string[]> = {
  'Recent': [],
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹'],
  'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '💾', '💿', '📀', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏰', '⏱️']
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hideout_recent_emojis');
    if (saved) {
      try {
        setRecentEmojis(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    emojiCategories['Recent'] = recentEmojis;
  }, [recentEmojis]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Update recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 30);
    setRecentEmojis(newRecent);
    localStorage.setItem('hideout_recent_emojis', JSON.stringify(newRecent));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[10001]" side="top" align="end">
        <div className="flex flex-col h-96">
          {/* Category tabs */}
          <div className="flex gap-1 p-2 border-b border-border overflow-x-auto scrollbar-hide">
            {Object.keys(emojiCategories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs whitespace-nowrap flex items-center gap-1"
              >
                {category === 'Recent' && <Clock className="w-3 h-3" />}
                {category}
              </Button>
            ))}
          </div>

          {/* Emoji grid */}
          <ScrollArea className="flex-1 p-4">
            {selectedCategory === 'Recent' && recentEmojis.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No recent emojis yet
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-2">
                {emojiCategories[selectedCategory].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:bg-muted rounded p-1 transition-colors"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
