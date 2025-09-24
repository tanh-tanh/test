
'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { LuckyWheelReward } from '@/lib/puzzle';

interface LuckyWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewards: LuckyWheelReward[];
  spins: number;
  setSpins: (spins: number | ((prevSpins: number) => number)) => void;
}

export default function LuckyWheel({ open, onOpenChange, rewards, spins, setSpins }: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [finalRewardIndex, setFinalRewardIndex] = useState<number | null>(null);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const segmentDegrees = 360 / rewards.length;
  const spinInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setIsSpinning(false);
        setRotation(0);
        setFinalRewardIndex(null);
        if (spinInterval.current) {
          clearInterval(spinInterval.current);
          spinInterval.current = null;
        }
         if(wheelRef.current){
           wheelRef.current.style.transition = 'none';
           wheelRef.current.style.transform = `rotate(0deg)`;
         }
      }, 300);
    }
  }, [open]);

  
  const handleStartSpin = () => {
    if (isSpinning || spins <= 0) return;
    
    setFinalRewardIndex(null);
    setSpins(spins => spins - 1);
    setIsSpinning(true);
    
    if (wheelRef.current) {
        wheelRef.current.style.transition = 'none'; // Remove transition for interval-based rotation
    }

    let currentRotation = rotation;
    spinInterval.current = setInterval(() => {
        currentRotation += 20; // Adjust speed of rotation
        if (wheelRef.current) {
            wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
        }
    }, 16);
  };
  
  const handleStopSpin = () => {
      if (!isSpinning || !spinInterval.current) return;
      
      clearInterval(spinInterval.current);
      spinInterval.current = null;
      
      const currentAngle = parseFloat(wheelRef.current?.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
      
      setIsSpinning(false);

      const winningIndex = Math.floor(
          ((360 - (currentAngle % 360) + (segmentDegrees / 2)) % 360) / segmentDegrees
      );
      
      setFinalRewardIndex(winningIndex);
      
      // Stop immediately
      const finalRotation = currentAngle;
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
        setRotation(finalRotation);
      }
      
      const reward = rewards[winningIndex];
      if (reward.text.toLowerCase().includes('thêm lượt')) {
          setSpins(spins => spins + 1);
      }
  }


  const handleClose = () => {
    onOpenChange(false);
  }

  const getButtonProps = () => {
      if (isSpinning) {
          return {
              text: 'Dừng Lại!',
              action: handleStopSpin,
              disabled: false,
          }
      }
      if (finalRewardIndex !== null) {
          if (spins > 0) {
              return {
                  text: `Quay tiếp (${spins} lượt)`,
                  action: handleStartSpin,
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
              text: `Quay Ngay! (${spins} lượt)`,
              action: handleStartSpin,
              disabled: false,
          }
      }

      return {
          text: 'Hết lượt quay',
          action: handleClose,
          disabled: false
      }
  }

  const buttonProps = getButtonProps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-accent shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">Vòng Quay May Mắn!</DialogTitle>
           {finalRewardIndex === null && !isSpinning && (
            <DialogDescription className="text-center">
                Bạn còn {spins} lượt quay.
            </DialogDescription>
           )}
        </DialogHeader>
        <div className="relative flex flex-col items-center justify-center p-8">
          <ArrowRight className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 text-primary z-10 -rotate-90" />
          <div
            id="lucky-wheel"
            ref={wheelRef}
            className="relative w-80 h-80 rounded-full border-8 border-primary shadow-2xl overflow-hidden"
            style={{ 
              transform: `rotate(${rotation}deg)`,
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
                  className="flex flex-col items-center justify-center text-center w-[120%]"
                  style={{ transform: `rotate(${segmentDegrees / 2}deg) translate(-50%, -50%) rotate(-45deg)`}}
                >
                  <span className="text-sm font-bold px-2 block">{reward.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {finalRewardIndex !== null && !isSpinning && (
            <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Chúc mừng! Bạn đã nhận được:</p>
                <div className="inline-flex items-center gap-2 p-3 bg-accent/20 rounded-lg">
                    <span className="text-xl font-bold text-accent-foreground">{rewards[finalRewardIndex].text}</span>
                </div>
            </div>
        )}
        <Button 
            onClick={buttonProps.action} 
            disabled={buttonProps.disabled}
            className="w-full mt-4"
        >
            {buttonProps.text}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
