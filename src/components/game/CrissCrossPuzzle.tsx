
'use client';

import type { Clue, PuzzleData, LuckyWheelReward } from '@/lib/puzzle';
import { useState, useMemo, ChangeEvent, KeyboardEvent, useRef, useEffect, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkAnswerAction } from '@/app/actions';
import LuckyWheel from './LuckyWheel';
import { samplePuzzle } from '@/lib/puzzle';
import { Trophy, HelpCircle } from 'lucide-react';

type GridCell = {
  char: string | null;
  isBlack: boolean;
  number: number | null;
  clues: { across?: string; down?: string };
};

type UserGridState = (string | null)[][];

export default function CrissCrossPuzzle({ puzzleData }: { puzzleData: PuzzleData }) {
  const { gridSize, clues, id: puzzleId, rewards } = puzzleData;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [grid, setGrid] = useState<UserGridState>(
    Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(null))
  );
  const [solvedClues, setSolvedClues] = useState<Record<string, boolean>>({});
  const [activeClue, setActiveClue] = useState<Clue | null>(clues.find(c => c.direction === 'across') || clues[0]);
  const [isWheelOpen, setWheelOpen] = useState(false);
  const [spins, setSpins] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const answerInputRef = useRef<HTMLInputElement>(null);
  
  const gridLayout = useMemo<GridCell[][]>(() => {
    const layout: GridCell[][] = Array.from({ length: gridSize.rows }, () =>
      Array.from({ length: gridSize.cols }, () => ({
        char: null,
        isBlack: true,
        number: null,
        clues: {},
      }))
    );

    clues.forEach(clue => {
      let { row, col } = clue;
      if (row < gridSize.rows && col < gridSize.cols && layout[row][col].number === null) {
        layout[row][col].number = clue.number;
      }
      
      for (let i = 0; i < clue.answer.length; i++) {
        if (row < gridSize.rows && col < gridSize.cols) {
            if (layout[row]?.[col]) {
              layout[row][col].isBlack = false;
              if (clue.direction === 'across') {
                layout[row][col].clues.across = clue.id;
              } else {
                layout[row][col].clues.down = clue.id;
              }
            }
            if (clue.direction === 'across') {
                col++;
            } else {
                row++;
            }
        } else {
            break;
        }
      }
    });
    return layout;
  }, [gridSize, clues]);

  useEffect(() => {
    if (activeClue && !solvedClues[activeClue.id]) {
        setCurrentAnswer('');
        answerInputRef.current?.focus();
    }
  }, [activeClue, solvedClues]);


  const handleCellClick = (row: number, col: number) => {
    const cellClues = gridLayout[row][col].clues;
    if (!cellClues.across && !cellClues.down) return;
    
    let newActiveClueId: string | undefined;
    if (activeClue && (cellClues.across === activeClue.id || cellClues.down === activeClue.id) && cellClues.across && cellClues.down) {
       newActiveClueId = activeClue.direction === 'across' ? cellClues.down : cellClues.across;
    } else {
      newActiveClueId = cellClues.across || cellClues.down;
    }
    
    const newClue = clues.find(c => c.id === newActiveClueId);
    if (newClue) {
      setActiveClue(newClue);
    }
  };


  const checkCurrentClue = () => {
    if (!activeClue || !currentAnswer) return;
    
    startTransition(async () => {
      const result = await checkAnswerAction({
        puzzleId,
        questionId: activeClue.id,
        userAnswer: currentAnswer,
        correctAnswer: activeClue.answer
      });
      
      const { isCorrect, message } = result.data;
      if (isCorrect) {
        setSolvedClues(prev => ({...prev, [activeClue.id]: true}));
        
        if (activeClue.direction === 'down') {
          toast({ title: 'Từ khóa chính xác!', description: 'Bạn nhận được 2 lượt quay may mắn!', variant: 'default' });
          setSpins(spins => spins + 2);
          setWheelOpen(true);
        } else {
          toast({ title: 'Chính xác!', description: 'Bạn nhận được 1 lượt quay may mắn!', variant: 'default' });
          setSpins(spins => spins + 1);
          setWheelOpen(true);
        }
        
        let { row, col } = activeClue;
        const newGrid = grid.map(r => [...r]);
        for (let i = 0; i < activeClue.answer.length; i++) {
            if(row < gridSize.rows && col < gridSize.cols){
                newGrid[row][col] = activeClue.answer[i];
                 if (activeClue.direction === 'across') col++;
                else row++;
            }
        }
        setGrid(newGrid);
        setCurrentAnswer('');

        // Find and set the next unsolved clue
        const currentIndex = clues.findIndex(c => c.id === activeClue.id);
        const nextClue = clues.slice(currentIndex + 1).find(c => !solvedClues[c.id]) || clues.find(c => !solvedClues[c.id]);
        if(nextClue) {
            setActiveClue(nextClue);
        }

      } else {
        toast({ title: 'Chưa đúng!', description: message || 'Hãy thử lại nhé.', variant: 'destructive' });
      }
    });
  }
  
  const isCellInActiveClue = (row: number, col: number) => {
    if (!activeClue) return false;
    const { row: startRow, col: startCol, direction, answer } = activeClue;
    if (direction === 'across') {
      return row === startRow && col >= startCol && col < startCol + answer.length;
    } else {
      return col === startCol && row >= startRow && row < startRow + answer.length;
    }
  }

  const allCluesSolved = useMemo(() => {
      return clues.every(clue => solvedClues[clue.id]);
  }, [clues, solvedClues]);


  return (
    <div className="flex flex-col items-center gap-8">
      <div 
        className="grid bg-stone-800 border-4 border-stone-800 shadow-inner rounded-md overflow-hidden" 
        style={{
          gridTemplateRows: `repeat(${gridSize.rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
          aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
          maxWidth: '70vh',
          width: '100%',
        }}
      >
        {gridLayout.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            if (cell.isBlack) {
              return <div key={`${rIdx}-${cIdx}`} className="bg-stone-800" />;
            }
            const isSolved = (cell.clues.across && solvedClues[cell.clues.across]) || (cell.clues.down && solvedClues[cell.clues.down]);
            const isInActive = isCellInActiveClue(rIdx, cIdx);

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={cn(
                  "relative flex items-center justify-center border border-stone-500 text-center uppercase font-bold text-lg md:text-xl",
                  isSolved ? 'bg-primary/20 text-primary/90' : 'bg-card text-foreground',
                  isInActive && !isSolved && 'bg-accent/30',
                  "cursor-pointer"
                )}
                onClick={() => handleCellClick(rIdx, cIdx)}
              >
                {cell.number && (
                  <span className="absolute top-0 left-0.5 text-[0.6rem] text-muted-foreground font-sans">{cell.number}</span>
                )}
                {grid[rIdx][cIdx]}
              </div>
            );
          })
        )}
      </div>

      {activeClue && !allCluesSolved ? (
        <div className="mt-4 w-full max-w-lg text-center bg-card p-6 rounded-lg shadow-md border">
          <p className="font-semibold text-xl text-primary">
              {activeClue.number}. {activeClue.direction === 'across' ? 'Ngang' : 'Dọc'} ({activeClue.answer.length} chữ cái)
          </p>
          <p className="text-muted-foreground mb-4 h-12 flex items-center justify-center">
              {activeClue.question ? activeClue.question : "Dùng các chữ cái đã biết để đoán từ khóa."}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); checkCurrentClue(); }} className="flex gap-2">
            <Input
              ref={answerInputRef}
              type="text"
              placeholder="Nhập đáp án của bạn..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="text-center text-lg"
              disabled={isPending || solvedClues[activeClue.id]}
            />
            <Button type="submit" disabled={isPending || solvedClues[activeClue.id]}>
              {isPending ? 'Đang kiểm tra...' : 'Kiểm tra'}
            </Button>
          </form>
        </div>
      ) : (
         <div className="mt-4 w-full max-w-lg text-center p-6">
            <p className="text-xl font-bold text-primary">🎉 Chúc mừng! 🎉</p>
            <p className="text-muted-foreground">Bạn đã hoàn thành ô chữ này. Hãy tạo một ô chữ mới để thử thách bạn bè!</p>
         </div>
      )}

      {isWheelOpen && (
           <LuckyWheel 
              open={isWheelOpen} 
              onOpenChange={setWheelOpen}
              rewards={rewards ?? samplePuzzle.rewards!}
              spins={spins}
              setSpins={setSpins}
          />
       )}
    </div>
  );
}
