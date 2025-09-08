'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Star, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LuckyWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const rewards = [
  { icon: <Trophy className="w-8 h-8 text-yellow-500" />, text: '100 Điểm!', color: 'gold' },
  { icon: <Gift className="w-8 h-8 text-red-500" />, text: 'Một Gợi Ý', color: '#EF4444' },
  { icon: <Star className="w-8 h-8 text-blue-500" />, text: 'Nhân Đôi Điểm', color: '#3B82F6' },
  { icon: <Sparkles className="w-8 h-8 text-purple-500" />, text: 'Phần Thưởng Bí Ẩn', color: '#8B5CF6' },
  { icon: <Trophy className="w-8 h-8 text-yellow-500" />, text: '50 Điểm', color: 'gold' },
  { icon: <Gift className="w-8 h-8 text-red-500" />, text: 'Thêm Lượt', color: '#EF4444' },
];

export default function LuckyWheel({ open, onOpenChange }: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDegrees, setSpinDegrees] = useState(0);
  const [finalRewardIndex, setFinalRewardIndex] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);
  const transitionDuration = isSpinning ? 10000 : 0; // 10s for spinning, 0 for stop

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setIsSpinning(false);
      setSpinDegrees(0);
      setFinalRewardIndex(null);
      setCanSpin(true);
       if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(0deg)`;
      }
    }
  }, [open]);

  const handleSpin = () => {
    if (!canSpin) return;
    
    setFinalRewardIndex(null);
    setCanSpin(false);
    setIsSpinning(true);

    const initialRotation = spinDegrees;
    const fullSpins = 10;
    const newSpinDegrees = initialRotation + 360 * fullSpins;
    
    if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${transitionDuration}ms linear`;
        wheelRef.current.style.transform = `rotate(${newSpinDegrees}deg)`;
    }

    setSpinDegrees(newSpinDegrees);
  };
  
  const handleStop = () => {
    if (!isSpinning) return;

    if (wheelRef.current) {
      const computedStyle = window.getComputedStyle(wheelRef.current);
      const transform = computedStyle.transform;
      
      let currentAngle = 0;
      if (transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
      }
      
      // Freeze the wheel at its current position
      wheelRef.current.style.transition = 'none';
      wheelRef.current.style.transform = `rotate(${currentAngle}deg)`;
      setSpinDegrees(currentAngle);
      
      setIsSpinning(false);

      // Calculate the final reward
      const segmentDegrees = 360 / rewards.length;
      const normalizedAngle = (360 - (currentAngle % 360)) % 360; // Normalize angle to be positive
      const stoppedSegmentIndex = Math.floor(normalizedAngle / segmentDegrees);
      
      setFinalRewardIndex(stoppedSegmentIndex);
      setTimeout(() => setCanSpin(true), 500); // Allow to spin again after a short delay
    }
  };

  const segmentDegrees = 360 / rewards.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-accent shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">Vòng Quay May Mắn!</DialogTitle>
          <DialogDescription className="text-center">
            Bạn đã trả lời đúng! Hãy quay để nhận phần thưởng.
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
                  className="flex flex-col items-center justify-center" 
                  style={{ transform: `rotate(${segmentDegrees / 2}deg) translate(-50%, -25%)`}}
                >
                  {reward.icon}
                  <span className="text-xs font-semibold mt-1">{reward.text.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {finalRewardIndex !== null ? (
            <div className="text-center space-y-4">
                <p className="text-lg font-semibold">Chúc mừng! Bạn đã nhận được:</p>
                <div className="inline-flex items-center gap-2 p-3 bg-accent/20 rounded-lg">
                    {rewards[finalRewardIndex].icon}
                    <span className="text-xl font-bold text-accent-foreground">{rewards[finalRewardIndex].text}</span>
                </div>
                <Button onClick={() => onOpenChange(false)} className="w-full">Tuyệt vời!</Button>
            </div>
        ) : (
             <Button 
                onClick={isSpinning ? handleStop : handleSpin} 
                disabled={!canSpin && !isSpinning} 
                className="w-full"
                variant={isSpinning ? 'destructive' : 'default'}
             >
                {isSpinning ? 'Dừng Lại!' : 'Quay Ngay!'}
             </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
