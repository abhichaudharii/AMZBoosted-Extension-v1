import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, AlertTriangle, CloudOff } from 'lucide-react';
import { secureStorage } from '@/lib/storage/secure-storage';
import { cn } from '@/lib/utils';

interface ConnectionState {
  status: 'online' | 'offline' | 'slow';
  lastChecked: string;
  apiAvailable: boolean;
  latency?: number;
}

export const OfflineIndicator: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'online',
    lastChecked: new Date().toISOString(),
    apiAvailable: true,
  });

  useEffect(() => {
    // Load initial state
    loadState();

    // Listen for changes
    const handleStorageChange = (changes: any) => {
      if (changes.connectionState) {
        loadState();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadState = async () => {
    const result = await secureStorage.get('connectionState');
    if (result.connectionState) {
      setConnectionState(result.connectionState);
    }
  };

  // Don't show anything if online and API is available
  if (connectionState.status === 'online' && connectionState.apiAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border text-xs font-medium backdrop-blur-md transition-all",
        connectionState.status === 'offline' || !connectionState.apiAvailable
          ? "bg-destructive/90 text-white border-red-500/50" 
          : "bg-amber-500/90 text-white border-amber-400/50"
      )}>
        {connectionState.status === 'offline' ? (
          <WifiOff className="h-3.5 w-3.5" />
        ) : !connectionState.apiAvailable ? (
          <CloudOff className="h-3.5 w-3.5" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5" />
        )}
        
        <span>
          {connectionState.status === 'offline' 
            ? "You are offline" 
            : !connectionState.apiAvailable 
              ? "API Disconnected" 
              : "Unstable Connection"}
        </span>
      </div>
    </div>
  );
};

/**
 * Compact version for TopNav
 */
export const ConnectionBadge: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'online',
    lastChecked: new Date().toISOString(),
    apiAvailable: true,
  });

  useEffect(() => {
    loadState();

    const handleStorageChange = (changes: any) => {
      if (changes.connectionState) {
        loadState();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadState = async () => {
    const result = await secureStorage.get('connectionState');
    if (result.connectionState) {
      setConnectionState(result.connectionState);
    }
  };

  if (connectionState.status === 'online' && connectionState.apiAvailable) {
    return null;
  }

  return (
    <Badge
      variant={connectionState.status === 'offline' ? 'destructive' : 'secondary'}
      className="flex items-center gap-1"
    >
      {connectionState.status === 'offline' ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : connectionState.status === 'slow' ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>Slow</span>
        </>
      ) : !connectionState.apiAvailable ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>API Down</span>
        </>
      ) : null}
    </Badge>
  );
};
