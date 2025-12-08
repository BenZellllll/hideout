import { useEffect, useRef } from 'react';

type AdConfig = {
  multiTagBanner: string;
  socialBar: string;
};

const AD_CONFIGS: Record<string, AdConfig> = {
  'www.usehideout.xyz': {
    multiTagBanner: '//cooperative-reveal.com/bPXMV.s/dAGalc0ZYOWXcN/Eeumm9/u/ZUUZl_k/PgTLY/3/MAj/IY3xMJDXAVtNNcjCcJyZMTjZcfwVMSQW',
    socialBar: '//eventabsorbedrichard.com/10/09/af/1009af6830a75cb3a01abfe7e90d6a5d.js',
  },
  'usehideout.xyz': {
    multiTagBanner: '//cooperative-reveal.com/bPXMV.s/dAGalc0ZYOWXcN/Eeumm9/u/ZUUZl_k/PgTLY/3/MAj/IY3xMJDXAVtNNcjCcJyZMTjZcfwVMSQW',
    socialBar: '//eventabsorbedrichard.com/10/09/af/1009af6830a75cb3a01abfe7e90d6a5d.js',
  },
  'hideout-now.lovable.app': {
    multiTagBanner: '//cooperative-reveal.com/bYX.VHsKdqG/lO0gYsWBct/ReZma9KuOZDU/lhk/PZTCYo3SMvjpIW2-O/TVYat/NPjYcgyLMBjEYN5_N/wN',
    socialBar: '//eventabsorbedrichard.com/81/be/08/81be08761cb56f661f055429c4a52f35.js',
  },
};

const getAdConfig = (): AdConfig | null => {
  const hostname = window.location.hostname;
  
  // Check for exact match first
  if (AD_CONFIGS[hostname]) {
    return AD_CONFIGS[hostname];
  }
  
  // Check for lovable preview/project domains - use hideout-now config for testing
  if (hostname.includes('lovable.app') || hostname.includes('lovableproject.com')) {
    return AD_CONFIGS['hideout-now.lovable.app'];
  }
  
  return null;
};

// Sticky bottom MultiTag Banner component (300x250)
export const StickyBottomBanner = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getAdConfig();

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Create and load the MultiTag banner script
    const script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.src = config.multiTagBanner;
    // @ts-ignore
    script.settings = {};
    container.appendChild(script);
  }, [config]);

  if (!config) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto" ref={containerRef} />
    </div>
  );
};

// Global social bar loader
export const GlobalAdsLoader = () => {
  const config = getAdConfig();

  useEffect(() => {
    if (!config) return;

    // Load social bar
    const socialBarScript = document.createElement('script');
    socialBarScript.async = true;
    socialBarScript.setAttribute('data-cfasync', 'false');
    socialBarScript.src = config.socialBar;
    document.body.appendChild(socialBarScript);

    return () => {
      if (socialBarScript.parentNode) {
        socialBarScript.parentNode.removeChild(socialBarScript);
      }
    };
  }, [config]);

  return null;
};

// Check if ads should be shown
export const shouldShowAds = (): boolean => {
  return getAdConfig() !== null;
};
