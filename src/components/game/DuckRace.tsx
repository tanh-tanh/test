
'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import type { LuckyWheelReward } from '@/lib/puzzle';
import { cn } from '@/lib/utils';

// A simple SVG duck icon
const DuckIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-12 h-12 transform -scale-x-100">
    <path d="M21.99 10.99C21.99 8.01 19.98 6 17.5 6C16.98 6 16.5 6.09 16.05 6.25C15.2 4.44 13.34 3 11 3C8.24 3 6 5.24 6 8C6 8.35 6.04 8.68 6.11 9H4C3.45 9 3 9.45 3 10V11C3 11.55 3.45 12 4 12H5.08C5.54 15.15 7.43 17.59 10 18.72V21H8V23H14V21H12V18.72C15.06 17.84 17.26 15.4 17.84 12H19C19.55 12 20 11.55 20 11V10C20 9.45 19.55 9 19 9H17.92C18.99 8.16 19.75 7.9 20.5 8C21.5 8.15 21.99 9.15 21.99 10.99Z" />
  </svg>
);

const DUCK_COLORS = ['#FFD700', '#FF69B4', '#00BFFF', '#ADFF2F', '#FF4500', '#9370DB'];

interface DuckRaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewards: LuckyWheelReward[];
  spins: number;
  setSpins: (spins: number | ((prevSpins: number) => number)) => void;
}

interface DuckState {
  id: number;
  reward: LuckyWheelReward;
  position: number;
  color: string;
}

export default function DuckRace({ open, onOpenChange, rewards, spins, setSpins }: DuckRaceProps) {
  const [raceState, setRaceState] = useState<'idle' | 'racing' | 'finished'>('idle');
  const [ducks, setDucks] = useState<DuckState[]>([]);
  const [winner, setWinner] = useState<DuckState | null>(null);
  
  const raceInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize ducks when rewards change
    setDucks(rewards.map((reward, index) => ({
      id: index,
      reward,
      position: 0,
      color: DUCK_COLORS[index % DUCK_COLORS.length],
    })));
  }, [rewards]);
  
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setTimeout(() => {
        setRaceState('idle');
        setWinner(null);
        setDucks(d => d.map(duck => ({ ...duck, position: 0 })));
        if (raceInterval.current) {
          clearInterval(raceInterval.current);
          raceInterval.current = null;
        }
      }, 300);
    }
  }, [open]);

  
  const startRace = () => {
    if (raceState !== 'idle' || spins <= 0) return;
    
    setWinner(null);
    setSpins(s => s - 1);
    setRaceState('racing');

    raceInterval.current = setInterval(() => {
      let raceFinished = false;
      let winningDuck: DuckState | null = null;

      setDucks(currentDucks => {
        const newDucks = currentDucks.map(duck => {
          if (raceFinished) return duck;

          const newPosition = duck.position + Math.random() * 5;
          if (newPosition >= 100) {
            raceFinished = true;
            winningDuck = { ...duck, position: 100 };
            return winningDuck;
          }
          return { ...duck, position: newPosition };
        });

        if (raceFinished && winningDuck) {
          if (raceInterval.current) clearInterval(raceInterval.current);
          setWinner(winningDuck);
          setRaceState('finished');
          
          if (winningDuck.reward.text.toLowerCase().includes('thêm lượt')) {
              setSpins(s => s + 1);
          }
        }
        
        return newDucks;
      });

    }, 100);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }
  
  const handleNextRace = () => {
      setRaceState('idle');
      setWinner(null);
      setDucks(d => d.map(duck => ({ ...duck, position: 0 })));
  }

  const getButtonProps = () => {
      if (raceState === 'racing') {
          return {
              text: 'Đang đua...',
              action: () => {},
              disabled: true,
          }
      }
      if (raceState === 'finished') {
          if (spins > 0) {
              return {
                  text: `Đua tiếp (${spins} lượt)`,
                  action: handleNextRace,
                  disabled: false,
              }
          }
          return {
              text: 'Tuyệt vời!',
              action: handleClose,
              disabled: false,
          }
      }

      if (spins > 0) {
          return {
              text: `Bắt đầu cuộc đua! (${spins} lượt)`,
              action: startRace,
              disabled: false,
          }
      }

      return {
          text: 'Hết lượt đua',
          action: handleClose,
          disabled: false
      }
  }

  const buttonProps = getButtonProps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-accent shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold text-primary">🦆 Đua Vịt May Mắn! 🦆</DialogTitle>
           {raceState === 'idle' && (
            <DialogDescription className="text-center">
                Bạn còn {spins} lượt đua. Chú vịt nào về nhất sẽ quyết định phần thưởng!
            </DialogDescription>
           )}
        </DialogHeader>
        
        <div className="relative p-4 my-4 space-y-2 border-y-2 border-dashed border-blue-300 bg-blue-50/50 overflow-hidden">
            {ducks.map((duck) => (
                <div key={duck.id} className="w-full flex items-center">
                   <div 
                     className="relative transition-all duration-100 ease-linear"
                     style={{ left: `${duck.position}%` }}
                   >
                     <DuckIcon color={duck.color} />
                     <span className="absolute -bottom-2 w-max left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 bg-white/70 px-1 rounded">
                         {duck.reward.text}
                     </span>
                   </div>
                </div>
            ))}
             <div className="absolute right-4 top-0 bottom-0 flex items-center">
                 <div className="h-full w-4 bg-gradient-to-r from-transparent to-green-400"></div>
                <Trophy className="w-10 h-10 text-yellow-500 z-10" />
            </div>
        </div>

        {raceState === 'finished' && winner && (
            <div className="text-center space-y-2 animate-in fade-in zoom-in-95">
                <p className="text-lg font-semibold">Chúc mừng! Phần thưởng của bạn là:</p>
                <div className="inline-flex items-center gap-2 p-3 bg-accent/20 rounded-lg">
                    <span className="text-xl font-bold text-accent-foreground">{winner.reward.text}</span>
                </div>
            </div>
        )}
        
        <Button 
            onClick={buttonProps.action} 
            disabled={buttonProps.disabled}
            className="w-full mt-4"
            size="lg"
        >
            {buttonProps.text}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

    