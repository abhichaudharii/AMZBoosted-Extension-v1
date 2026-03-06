import React from 'react';

// Helper for safe logo loading
const getLogoUrl = () => {
  try {
    return chrome.runtime.getURL('icon/128.png');
  } catch (e) {
    return '/icon/128.png';
  }
};

interface LoadingScreenProps {
  text?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  text = "Verifying user session..." 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
    <div className="space-y-8 w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95 duration-700">
      
      {/* 1. Animated Logo Section */}
      <div className="flex justify-center mb-6">
        <div className="relative group cursor-default">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse group-hover:bg-primary/30 transition-all duration-1000" />
          <div className="relative h-24 w-24 flex items-center justify-center rounded-3xl bg-background/40 backdrop-blur-2xl border border-white/10 shadow-2xl p-5 ring-1 ring-white/20">
            <img 
              src={getLogoUrl()} 
              alt="AMZBoosted Logo" 
              className="h-full w-full object-contain drop-shadow-md animate-[pulse_3s_ease-in-out_infinite]" 
            />
          </div>
        </div>
      </div>

      {/* 2. Typography */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          AMZBoosted
        </h1>
        <p className="text-sm font-medium text-muted-foreground/80">
          Premium Amazon Seller Tools
        </p>
      </div>

      {/* 3. Loading Indicators */}
      <div className="space-y-4 pt-4">
        {/* Bouncing Dots */}
        <div className="flex justify-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"></div>
        </div>

        {/* Dynamic Status Text */}
        <p className="text-xs text-muted-foreground/60 font-mono animate-pulse">
          {text}
        </p>
      </div>

    </div>
  </div>
);

export default LoadingScreen;