import { useState, useEffect } from 'react';

export type Theme = {
  id: string;
  name: string;
  themePath: string;
};

export type ThemesData = {
  site: string;
  "main-theme": string;
  themes: Theme[];
};

const THEMES_URL = 'https://hideout-network.github.io/hideout-assets/themes/themes.json';
const SETTINGS_KEY = 'hideout_settings';
const THEME_SCRIPT_ID = 'hideout-theme';

// Synchronously get saved theme ID from localStorage
const getSavedThemeId = (): string | null => {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.selectedTheme || null;
    }
  } catch (e) {
    console.error('Failed to read saved theme:', e);
  }
  return null;
};

// Save theme ID to localStorage
const saveThemeId = (themeId: string) => {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    const parsed = settings ? JSON.parse(settings) : {};
    parsed.selectedTheme = themeId;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
};

// Remove old theme script and effects
const cleanupOldTheme = () => {
  const oldScript = document.getElementById(THEME_SCRIPT_ID);
  if (oldScript) oldScript.remove();
  
  const halloweenEffects = document.getElementById('halloween-pumpkins');
  if (halloweenEffects) halloweenEffects.remove();
  
  const themeEffects = document.getElementById('theme-effects');
  if (themeEffects) themeEffects.remove();
};

// Apply theme by loading its script
const applyTheme = (themesData: ThemesData, themeId: string) => {
  const theme = themesData.themes.find(t => t.id === themeId);
  if (!theme) {
    console.warn(`Theme ${themeId} not found`);
    return;
  }

  cleanupOldTheme();

  const script = document.createElement('script');
  script.id = THEME_SCRIPT_ID;
  script.src = `${themesData.site}${theme.themePath}`;
  script.async = false; // Load synchronously to prevent flashing
  document.head.appendChild(script);
};

export const useThemeSystem = () => {
  const [themesData, setThemesData] = useState<ThemesData | null>(null);
  const [currentThemeId, setCurrentThemeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme system
  useEffect(() => {
    let isMounted = true;

    const initializeThemes = async () => {
      try {
        // Fetch themes data
        const response = await fetch(THEMES_URL);
        if (!response.ok) throw new Error('Failed to fetch themes');
        
        const data: ThemesData = await response.json();
        
        if (!isMounted) return;

        // Deduplicate themes by ID
        const uniqueThemes = data.themes.reduce((acc, theme) => {
          if (!acc.find(t => t.id === theme.id)) {
            acc.push(theme);
          }
          return acc;
        }, [] as Theme[]);
        
        data.themes = uniqueThemes;
        setThemesData(data);

        // Determine which theme to use
        let themeToApply = getSavedThemeId();
        
        // If no saved theme or saved theme doesn't exist, use default
        if (!themeToApply || !data.themes.find(t => t.id === themeToApply)) {
          themeToApply = data['main-theme'];
          saveThemeId(themeToApply);
        }

        // Apply the theme
        applyTheme(data, themeToApply);
        setCurrentThemeId(themeToApply);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize themes:', error);
        setIsLoading(false);
      }
    };

    initializeThemes();

    return () => {
      isMounted = false;
    };
  }, []);

  // Change theme function
  const changeTheme = (themeId: string) => {
    if (!themesData) return;

    const theme = themesData.themes.find(t => t.id === themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    applyTheme(themesData, themeId);
    saveThemeId(themeId);
    setCurrentThemeId(themeId);
  };

  return {
    themesData,
    currentThemeId,
    isLoading,
    changeTheme,
  };
};
