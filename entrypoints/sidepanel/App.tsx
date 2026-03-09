import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { ToolsHome } from './screens/ToolsHome';
import { LoginScreen } from './screens/LoginScreen';
import { QuickUse } from './screens/QuickUse';
import { type Tool } from './lib/tools';
import { useUser } from '@/lib/hooks/useUserData';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { secureStorage } from '@/lib/storage/secure-storage';
import { GlobalUserProvider } from '@/lib/contexts/UserContext';

const AppRoutes: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useUser();
    const [selectedTool, setSelectedTool] = useState<Tool | undefined>(undefined);

    const { tools, loading: toolsLoading } = useRemoteTools();

    useEffect(() => {
        if (!loading) {
            if (!user && location.pathname !== '/login') {
                navigate('/login');
            } else if (user && location.pathname === '/login') {
                navigate('/');
            }
        }
    }, [user, loading, navigate, location.pathname]);

    // Handle Quick Run Requests from Dashboard
    useEffect(() => {
        const checkQuickRun = async () => {
            if (toolsLoading || tools.length === 0) return;

            try {
                const { quickRunRequest } = await secureStorage.get('quickRunRequest');
                
                if (quickRunRequest && quickRunRequest.toolId) {
                    // Check if request is recent (e.g. within 10 seconds) to avoid stale jumps
                    // or just clear it immediately. We'll verify it exists.
                    const tool = tools.find(t => t.id === quickRunRequest.toolId);
                    
                    if (tool) {
                        console.log('[SidePanel] Found quick run request for:', tool.name);
                        setSelectedTool(tool);
                        navigate('/quick-use');
                        
                        // Clear request
                        await secureStorage.remove('quickRunRequest');
                    }
                }
            } catch (error) {
                console.error('[SidePanel] Failed to check quick run:', error);
            }
        };

        checkQuickRun();
    }, [tools, toolsLoading, navigate]);

    const handleSelectTool = (tool: Tool) => {
        setSelectedTool(tool);
        navigate('/quick-use');
    };

    const handleBack = () => {
        setSelectedTool(undefined);
        navigate('/');
    };

    const handleOpenDashboard = () => {
        const url = chrome.runtime.getURL('dashboard.html');
        chrome.tabs.create({ url });
    };

    const handleExtractedAsins = () => {
        navigate('/extracted');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B]">
                <div className="relative mb-8 group">
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse" />
                    
                    <img 
                        src="/amzboosted_logo.png" 
                        alt="AMZBoosted" 
                        className="w-16 h-16 relative z-10 object-contain drop-shadow-2xl animate-in zoom-in-50 duration-500"
                    />
                </div>
                
                <div className="relative">
                    <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-[#FF914D] w-1/2 rounded-full animate-progress" />
                    </div>
                </div>
                
                <p className="mt-4 text-xs font-medium text-gray-400 tracking-widest uppercase animate-pulse">
                    Initializing Intelligence
                </p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-background text-foreground">
            <Routes>
                <Route 
                    path="/" 
                    element={
                        <ToolsHome 
                            onSelectTool={handleSelectTool} 
                            onOpenDashboard={handleOpenDashboard}
                            onViewAsins={handleExtractedAsins}
                        />
                    } 
                />
                <Route path="/login" element={<LoginScreen />} />
                <Route 
                    path="/quick-use" 
                    element={
                        selectedTool ? (
                            <QuickUse 
                                tool={selectedTool} 
                                onBack={handleBack} 
                                onOpenDashboard={handleOpenDashboard}
                            />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster richColors position="top-center" />
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <ThemeProvider>
            <GlobalUserProvider>
                <TooltipProvider>
                    <HashRouter>
                        <AppRoutes />
                    </HashRouter>
                </TooltipProvider>
            </GlobalUserProvider>
        </ThemeProvider>
    );
};
