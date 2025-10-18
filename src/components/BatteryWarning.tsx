import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BatteryLow } from 'lucide-react';

interface BatteryWarningProps {
  isGamePage?: boolean;
}

export const BatteryWarning = ({ isGamePage = false }: BatteryWarningProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!isGamePage) return;

    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          const level = Math.round(battery.level * 100);
          setBatteryLevel(level);

          // Show warning if battery is low and not charging
          if (level <= 25 && !battery.charging) {
            const dismissed = localStorage.getItem('hideout_battery_warning_dismissed');
            if (!dismissed) {
              setShowWarning(true);
            }
          }

          // Listen for battery changes
          battery.addEventListener('levelchange', () => {
            const newLevel = Math.round(battery.level * 100);
            setBatteryLevel(newLevel);
            if (newLevel <= 25 && !battery.charging) {
              const dismissed = localStorage.getItem('hideout_battery_warning_dismissed');
              if (!dismissed) {
                setShowWarning(true);
              }
            }
          });
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    checkBattery();
  }, [isGamePage]);

  const handleOk = () => {
    setShowWarning(false);
    if (dontShowAgain) {
      localStorage.setItem('hideout_battery_warning_dismissed', 'true');
    }
  };

  if (batteryLevel === null || !isGamePage) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <BatteryLow className="w-5 h-5 text-destructive" />
            Low Battery Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Your battery is at {batteryLevel}%. Battery saver mode may decrease performance for games and browsing.
            </p>
            <p>
              For the best experience, please charge your device or disable battery saver mode.
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="dont-show" 
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label
                htmlFor="dont-show"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Don't show this again
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={handleOk}>
            OK
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};