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
import { UserProvider } from '@/lib/contexts/UserContext';

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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <UserProvider>
                <TooltipProvider>
                    <HashRouter>
                        <AppRoutes />
                    </HashRouter>
                </TooltipProvider>
            </UserProvider>
        </ThemeProvider>
    );
};
