import { useState, useEffect } from 'react';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';

export const SessionTimer = () => {
  const { isAuthenticated } = useAuth();
  const { getTimeUntilLogout, resetTimer } = useAutoLogout();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsVisible(false);
      return;
    }

    const updateTimer = () => {
      const timeUntilLogout = getTimeUntilLogout();
      setTimeLeft(timeUntilLogout);
      
      // Show timer when less than 10 minutes left
      const tenMinutes = 10 * 60 * 1000;
      setIsVisible(timeUntilLogout <= tenMinutes && timeUntilLogout > 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getTimeUntilLogout]);

  if (!isVisible) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / (30 * 60 * 1000)) * 100;
  const isWarning = timeLeft <= 5 * 60 * 1000; // 5 minutes warning

  return (
    <Card className={`fixed bottom-4 right-4 p-4 w-80 shadow-lg z-50 ${
      isWarning ? 'border-destructive bg-destructive/5' : 'border-warning bg-warning/5'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <Clock className={`h-5 w-5 ${isWarning ? 'text-destructive' : 'text-warning'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium">
            Session expires in: {formatTime(timeLeft)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isWarning ? 'You will be logged out soon!' : 'Due to inactivity'}
          </p>
        </div>
      </div>
      
      <Progress 
        value={progressPercentage} 
        className="mb-3"
        style={{
          '--progress-background': isWarning ? 'hsl(var(--destructive))' : 'hsl(var(--warning))'
        } as any}
      />
      
      <Button 
        onClick={resetTimer} 
        size="sm" 
        variant="outline"
        className="w-full"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Extend Session
      </Button>
    </Card>
  );
};