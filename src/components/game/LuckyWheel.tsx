'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Star, Trophy, ArrowRight, Sparkles, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LuckyWheelReward } from '@/lib/puzzle';


const ICONS: Record<string, React.ReactNode> = {
    'Điểm': <Trophy className="w-8 h-8 text-yellow-500" />,
    'Gợi Ý': <Gift className="w-8 h-8 text-red-500" />,
    'Nhân Đôi': <Star className="w-8 h-8 text-blue-500" />,
    'Bí Ẩn': <Sparkles className="w-8 h-8 text-purple-500" />,
    'Lượt': <Rewind className="w-8 h-8 text-green-500" />,
};

const getIconForReward = (text: string) => {
    for(const key in ICONS) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            return ICONS[key];
        }
    }
    return <Star className="w-8 h-8 text-gray-500" />;
}


interface LuckyWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewards: LuckyWheelReward[];
  spins: number;
  onSpinsChange: (spins: number) => void;
}

export default function LuckyWheel({ open, onOpenChange, rewards, spins, onSpinsChange }: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDegrees, setSpinDegrees] = useState(0);
  const [finalRewardIndex, setFinalRewardIndex] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  const transitionDuration = 4000; // 4s for spinning

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setIsSpinning(false);
      setSpinDegrees(0);
      setFinalRewardIndex(null);
       if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(0deg)`;
      }
    } else {
        setFinalRewardIndex(null);
    }
  }, [open]);

  const handleSpin = () => {
    if (isSpinning || spins <= 0) return;
    
    setFinalRewardIndex(null);
    setIsSpinning(true);

    const randomExtraDegrees = Math.floor(Math.random() * 360);
    const fullSpins = 5;
    const newSpinDegrees = spinDegrees + 360 * fullSpins + randomExtraDegrees;
    
    if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${transitionDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        wheelRef.current.style.transform = `rotate(${newSpinDegrees}deg)`;
    }

    setSpinDegrees(newSpinDegrees);
    onSpinsChange(spins - 1);

    setTimeout(() => {
        setIsSpinning(false);
        const segmentDegrees = 360 / rewards.length;
        const normalizedAngle = (newSpinDegrees % 360); 
        const stoppedSegmentIndex = Math.floor((360 - normalizedAngle) / segmentDegrees) % rewards.length;
        setFinalRewardIndex(stoppedSegmentIndex);
    }, transitionDuration);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  const segmentDegrees = 360 / rewards.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-accent shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">Vòng Quay May Mắn!</DialogTitle>
          <DialogDescription className="text-center">
            Bạn có {spins} lượt quay.
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex flex-col items-center justify-center p-8">
          <ArrowRight className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 text-primary z-10 -rotate-90" />
          <div
            id="lucky-wheel"
            ref={wheelRef}
            className="relative w-80 h-80 rounded-full border-8 border-primary shadow-2xl overflow-hidden"
          >
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="absolute w-1/2 h-1/2 origin-bottom-right flex items-center justify-center"
                style={{
                  transform: `rotate(${index * segmentDegrees}deg)`,
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                  backgroundColor: index % 2 === 0 ? 'hsl(var(--background))' : 'hsl(var(--muted))'
                }}
              >
                <div 
                  className="flex flex-col items-center justify-center text-center"
                  style={{ transform: `rotate(${segmentDegrees / 2}deg) translate(-50%, -25%)`}}
                >
                  {getIconForReward(reward.text)}
                  <span className="text-xs font-semibold mt-1 px-2">{reward.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {finalRewardIndex !== null ? (
            <div className="text-center space-y-4">
                <p className="text-lg font-semibold">Chúc mừng! Bạn đã nhận được:</p>
                <div className="inline-flex items-center gap-2 p-3 bg-accent/20 rounded-lg">
                    {getIconForReward(rewards[finalRewardIndex].text)}
                    <span className="text-xl font-bold text-accent-foreground">{rewards[finalRewardIndex].text}</span>
                </div>
                {spins > 0 ? (
                     <Button onClick={handleSpin} className="w-full">Quay tiếp ({spins} lượt)</Button>
                ) : (
                    <Button onClick={handleClose} className="w-full">Tuyệt vời!</Button>
                )}
            </div>
        ) : (
             <Button 
                onClick={handleSpin} 
                disabled={isSpinning || spins === 0}
                className="w-full"
             >
                {isSpinning ? 'Đang quay...' : (spins > 0 ? `Quay Ngay! (${spins} lượt)`: 'Hết lượt quay')}
             </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
