'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Star, Trophy, ArrowRight, Sparkles } from 'lucide-react';

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
  const [canStop, setCanStop] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setIsSpinning(false);
      setSpinDegrees(0);
      setFinalRewardIndex(null);
      setCanStop(false);
    }
  }, [open]);

  const handleSpin = () => {
    if (isSpinning) return;
    
    setFinalRewardIndex(null);
    setIsSpinning(true);
    setCanStop(false);
    
    // Start spinning with a long, continuous animation
    setSpinDegrees(prev => prev + 360 * 10); // Spin 10 more times
    
    // Allow user to stop after a short delay
    setTimeout(() => {
        setCanStop(true);
    }, 1000); // Can stop after 1 second
  };

  const handleStop = () => {
    if (!canStop) return;

    setCanStop(false);
    
    const wheelElement = document.getElementById('lucky-wheel');
    if (!wheelElement) return;

    const computedStyle = window.getComputedStyle(wheelElement);
    const transform = computedStyle.transform;
    const matrix = new DOMMatrixReadOnly(transform);
    const currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    
    const randomStopIndex = Math.floor(Math.random() * rewards.length);
    const segmentDegrees = 360 / rewards.length;
    
    // Calculate final angle to land on the chosen segment
    const baseRotations = Math.ceil(spinDegrees / 360) * 360 + (360 * 2); // Ensure it spins at least 2 more times
    const stopAngle = (randomStopIndex * segmentDegrees) + (segmentDegrees / 2);
    const finalAngle = baseRotations - stopAngle;

    setSpinDegrees(finalAngle);

    setTimeout(() => {
      setFinalRewardIndex(randomStopIndex);
      setIsSpinning(false);
    }, 4000); // Corresponds to the new transition duration
  }

  const segmentDegrees = 360 / rewards.length;
  const showStopButton = isSpinning && canStop;

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
            className="relative w-80 h-80 rounded-full border-8 border-primary shadow-2xl overflow-hidden"
            style={{ 
              transform: `rotate(${spinDegrees}deg)`,
              transition: isSpinning ? (canStop ? 'transform 10s linear' : 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)') : 'none',
             }}
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
                onClick={showStopButton ? handleStop : handleSpin} 
                disabled={isSpinning && !canStop} 
                className="w-full"
                variant={showStopButton ? 'destructive' : 'default'}
             >
                {isSpinning ? (canStop ? 'Dừng Lại!' : 'Đang quay...') : 'Quay Ngay!'}
             </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
