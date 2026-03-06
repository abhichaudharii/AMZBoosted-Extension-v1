
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
import { Label } from '@/components/ui/label';
import { Hash, CheckCircle2, Loader2, HelpCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiClient } from '@/lib/api/client';

import confetti from 'canvas-confetti';

interface DiscordConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: { webhookUrl: string }) => Promise<void>;
}

export const DiscordConnectModal: React.FC<DiscordConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleTest = async () => {
    if (!webhookUrl) return;
    
    setIsTesting(true);
    setTestSuccess(false);

    try {
        const { success, error } = await apiClient.verifyIntegrationConnection('discord', { webhook_url: webhookUrl });

        if (!success) {
            throw new Error(error || "Verification failed");
        }

        setIsTesting(false);
        setTestSuccess(true);
        toast.success('Connection Verified!', {
            description: 'We sent a test message to your Discord.',
        });
    } catch (e: any) {
        setIsTesting(false);
        toast.error('Verification Failed', {
            description: e.message || 'Could not verify webhook.'
        });
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
        await onConnect({ webhookUrl });
        setStep(2); // Success step

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
    if (step === 2) {
        setStep(1);
        setWebhookUrl('');
        setTestSuccess(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-500" />
            Connect Discord
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Send alerts and reports to a Discord channel via Webhook.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Instructions Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline bg-white/5 px-3 rounded-lg text-gray-300 hover:text-white">
                    <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        How to get a Webhook URL
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 text-sm text-gray-400 space-y-2">
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                        <li>Open Discord and go to your server settings.</li>
                        <li>Navigate to <strong>Integrations</strong> {'>'} <strong>Webhooks</strong>.</li>
                        <li>Click <strong>New Webhook</strong>.</li>
                        <li>Select a channel and copy the <strong>Webhook URL</strong>.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Webhook Input */}
              <div className="space-y-3">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                    <Input
                        placeholder="https://discord.com/api/webhooks/..."
                        value={webhookUrl}
                        onChange={(e) => {
                            setWebhookUrl(e.target.value);
                            setTestSuccess(false); 
                        }}
                        className="font-mono text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                </div>
              </div>

               {/* Test Section */}
               <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                    <div className="text-sm text-gray-400">
                        Verify connection before saving
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleTest}
                        disabled={!webhookUrl || isTesting}
                        className={testSuccess ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300"}
                    >
                        {isTesting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                        ) : testSuccess ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500 mr-2" />
                        ) : (
                        <Hash className="w-3 h-3 mr-2" />
                        )}
                        {isTesting ? 'Verifying...' : testSuccess ? 'Verified' : 'Verify URL'}
                    </Button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Connected Successfully!</h3>
                <p className="text-gray-400 mt-2 max-w-[300px] mx-auto">
                  Your Discord channel is now linked. Alerts will be sent to the configured channel.
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
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300"
            >
              {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!testSuccess && <Lock className="w-3 h-3 mr-2 opacity-70" />}
              Connect Discord
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleClose} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
