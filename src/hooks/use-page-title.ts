import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    const baseTitle = 'Hideout';
    const fullTitle = title ? `${baseTitle} - ${title}` : baseTitle;
    
    // Set title
    document.title = fullTitle;
    
    // Optional: Add title animation
    let interval: NodeJS.Timeout;
    const originalTitle = fullTitle;
    
    // Simple animation that cycles through a few variations
    const animationStates = [
      originalTitle,
      `✨ ${originalTitle}`,
      originalTitle,
      `🎮 ${originalTitle}`,
    ];
    
    let currentIndex = 0;
    interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % animationStates.length;
      document.title = animationStates[currentIndex];
    }, 3000);
    
    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, [title]);
};
