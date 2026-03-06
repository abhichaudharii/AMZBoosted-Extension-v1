
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, CheckCircle2, Loader2, ExternalLink, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

import confetti from 'canvas-confetti';

interface TelegramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: { chatId: string }) => Promise<void>;
}

export const TelegramConnectModal: React.FC<TelegramConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [chatId, setChatId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleTest = async () => {
    if (!chatId) return;
    
    setIsTesting(true);
    setTestSuccess(false);

    try {
        const { success, error } = await apiClient.verifyIntegrationConnection('telegram', { chat_id: chatId });
        
        if (!success) {
             throw new Error(error || "Verification failed");
        }

        setIsTesting(false);
        setTestSuccess(true);
        toast.success('Connection Verified!', {
            description: 'We sent a test message to your Telegram.',
        });
    } catch (e: any) {
        setIsTesting(false);
        toast.error('Verification Failed', {
            description: e.message || 'Could not verify connection.'
        });
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
        await onConnect({ chatId });
        setStep(3); // Success step
        
        // Trigger confetti
        confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
        });
    } catch (error) {
    } finally {
        setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (step !== 3) {
      setStep(1);
      setChatId('');
      setTestSuccess(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            Connect Telegram
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Receive instant notifications and reports directly in Telegram.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Step 1: Start Bot */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">Start the AMZBoosted Bot</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Open Telegram and message our bot to get started.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white" asChild>
                    <a href="https://t.me/AMZBoostedBot" target="_blank" rel="noopener noreferrer">
                      Open Bot <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Step 2: Enter Chat ID */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">Enter your Chat ID</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      The bot will reply with your Chat ID. Paste it below.
                    </p>
                  </div>
                </div>
                <div className="pl-11">
                  <Input
                    placeholder="e.g. 123456789"
                    value={chatId}
                    onChange={(e) => {
                        setChatId(e.target.value);
                        setTestSuccess(false); 
                    }}
                    className="font-mono bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Step 3: Test Connection */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">Verify Connection</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      We need to verify we can reach you before saving.
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleTest}
                    disabled={!chatId || isTesting || testSuccess}
                    className={testSuccess ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : ""}
                  >
                    {isTesting ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    ) : testSuccess ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500 mr-2" />
                    ) : (
                      <Send className="w-3 h-3 mr-2" />
                    )}
                    {isTesting ? 'Verifying...' : testSuccess ? 'Verified' : 'Test Send'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Connected Successfully!</h3>
                <p className="text-gray-400 mt-2 max-w-[300px] mx-auto">
                  Your Telegram account is now linked. You will receive notifications for your tasks.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 && (
            <Button 
              onClick={handleConnect} 
              disabled={!testSuccess || isConnecting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300"
            >
              {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!testSuccess && <Lock className="w-3 h-3 mr-2 opacity-70" />}
              Connect Telegram
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleClose} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
