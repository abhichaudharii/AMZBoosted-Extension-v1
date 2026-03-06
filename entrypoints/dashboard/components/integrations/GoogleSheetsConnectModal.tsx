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
import { FileSpreadsheet, HardDrive, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface GoogleServicesConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: any) => void;
  mode?: 'sheets' | 'drive';
}

export const GoogleServicesConnectModal: React.FC<GoogleServicesConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  mode = 'sheets',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    // Simulate OAuth popup
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAuthenticating(false);
    
    if (mode === 'drive') {
        setStep(3); // Skip to ready state
    } else {
        setStep(2);
    }
    toast.success('Google Account authorized!');
  };

  const handleVerify = async () => {
    if (!spreadsheetUrl) return;
    
    setIsVerifying(true);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsVerifying(false);
    
    if (spreadsheetUrl.includes('google.com/spreadsheets')) {
        setStep(3);
    } else {
        toast.error('Invalid Google Sheets URL');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mode === 'sheets') {
        onConnect({ 
            spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", 
            sheetName 
        });
    } else {
        onConnect({
            authorized: true,
            timestamp: new Date().toISOString()
        });
    }
    
    setIsConnecting(false);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleClose = () => {
    onClose();
    // Reset state after transition
    setTimeout(() => {
        if (!isOpen) {
            setStep(1);
            setSpreadsheetUrl('');
            setSheetName('Sheet1');
        }
    }, 300);
  };

  const isDrive = mode === 'drive';
  const Icon = isDrive ? HardDrive : FileSpreadsheet;
  const title = isDrive ? 'Connect Google Drive' : 'Connect Google Sheets';
  const description = isDrive ? 'Securely access your Google Drive files.' : 'Export your data directly to a Google Sheet.';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-medium">Authorize Access</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        We need permission to read and write to your {isDrive ? 'Google Drive' : 'Google Sheets'}.
                    </p>
                </div>
                <Button 
                    onClick={handleAuth} 
                    disabled={isAuthenticating}
                    className="w-full max-w-xs"
                >
                    {isAuthenticating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    Sign in with Google
                </Button>
              </div>
            </div>
          )}

          {step === 2 && !isDrive && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Spreadsheet URL</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Paste the full URL of your Google Sheet"
                            value={spreadsheetUrl}
                            onChange={(e) => setSpreadsheetUrl(e.target.value)}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Open your sheet, copy the URL from the browser address bar, and paste it here.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Sheet Name (Optional)</Label>
                    <Input 
                        placeholder="e.g. Sheet1"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                    />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Ready to Connect</h3>
                <p className="text-muted-foreground mt-2 max-w-[300px] mx-auto">
                    {isDrive ? 'Google Drive Access granted.' : <span>We verified access to <strong>{sheetName}</strong>.</span>}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 2 && !isDrive && (
            <Button 
              onClick={handleVerify} 
              disabled={!spreadsheetUrl || isVerifying}
              className="w-full sm:w-auto"
            >
              {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify & Continue
            </Button>
          )}
          {step === 3 && (
            <Button 
                onClick={handleConnect} 
                className="w-full sm:w-auto"
                disabled={isConnecting}
            >
              {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Connection
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
