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

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  
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
      // Check if the starting cell is within bounds
      if (layout[row] && layout[row][col] && layout[row][col].number === null) {
        layout[row][col].number = clue.number;
      }
      
      for (let i = 0; i < clue.answer.length; i++) {
        // Bounds check for every cell in the word
        if (row < gridSize.rows && col < gridSize.cols && layout[row] && layout[row][col]) {
            layout[row][col].isBlack = false;
            if (clue.direction === 'across') {
              layout[row][col].clues.across = clue.id;
              col++;
            } else {
              layout[row][col].clues.down = clue.id;
              row++;
            }
        } else {
            // If we're out of bounds, stop processing this clue
            break;
        }
      }
    });
    return layout;
  }, [gridSize, clues]);

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
      focusOnClue(newClue);
    }
  };

  const focusOnClue = (clue: Clue) => {
    if (inputRefs.current[clue.row] && inputRefs.current[clue.row][clue.col]) {
      inputRefs.current[clue.row][clue.col]?.focus();
      inputRefs.current[clue.row][clue.col]?.select();
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    const value = e.target.value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value.slice(0, 1);
    setGrid(newGrid);

    if (value && activeClue) {
      let nextRow = row;
      let nextCol = col;
      if (activeClue.direction === 'across') {
        nextCol++;
      } else {
        nextRow++;
      }
      
      while(nextRow < gridSize.rows && nextCol < gridSize.cols && gridLayout[nextRow][nextCol].isBlack) {
        if (activeClue.direction === 'across') {
          nextCol++;
        } else {
          nextRow++;
        }
      }

      if (nextRow < gridSize.rows && nextCol < gridSize.cols) {
        inputRefs.current[nextRow]?.[nextCol]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (e.key === 'Backspace' && !grid[row][col]) {
      let prevRow = row;
      let prevCol = col;
      if (activeClue?.direction === 'across') {
        prevCol--;
      } else {
        prevRow--;
      }
      if (prevRow >= 0 && prevCol >= 0) {
        inputRefs.current[prevRow]?.[prevCol]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextClue = clues.find(c => c.id === gridLayout[row][col].clues.down);
      if (nextClue) setActiveClue(nextClue);
      for(let r = row - 1; r >= 0; r--) if(!gridLayout[r][col].isBlack) { inputRefs.current[r]?.[col]?.focus(); break; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextClue = clues.find(c => c.id === gridLayout[row][col].clues.down);
      if (nextClue) setActiveClue(nextClue);
      for(let r = row + 1; r < gridSize.rows; r++) if(!gridLayout[r][col].isBlack) { inputRefs.current[r]?.[col]?.focus(); break; }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextClue = clues.find(c => c.id === gridLayout[row][col].clues.across);
      if (nextClue) setActiveClue(nextClue);
      for(let c = col - 1; c >= 0; c--) if(!gridLayout[row][c].isBlack) { inputRefs.current[row]?.[c]?.focus(); break; }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextClue = clues.find(c => c.id === gridLayout[row][col].clues.across);
      if (nextClue) setActiveClue(nextClue);
      for(let c = col + 1; c < gridSize.cols; c++) if(!gridLayout[row][c].isBlack) { inputRefs.current[row]?.[c]?.focus(); break; }
    }
  }

  const checkCurrentClue = () => {
    if (!activeClue) return;
    let { row, col } = activeClue;
    let userAnswer = '';
    for (let i = 0; i < activeClue.answer.length; i++) {
      userAnswer += grid[row][col] || ' ';
      if (activeClue.direction === 'across') col++;
      else row++;
    }
    
    startTransition(async () => {
      const result = await checkAnswerAction({
        puzzleId,
        questionId: activeClue.id,
        userAnswer,
        correctAnswer: activeClue.answer
      });
      
      const { isCorrect, message } = result.data;
      if (isCorrect) {
        setSolvedClues(prev => ({...prev, [activeClue.id]: true}));
        
        if (activeClue.direction === 'down') {
          // Keyword guessed correctly!
          toast({ title: 'Từ khóa chính xác!', description: 'Bạn nhận được 2 lượt quay may mắn!', variant: 'default' });
          setSpins(spins => spins + 2);
          setWheelOpen(true);
        } else {
          // Regular clue guessed correctly
          toast({ title: 'Chính xác!', description: 'Bạn thật xuất sắc!', variant: 'default' });
        }
        
        // Fill in the correct answer on the grid
        let { row, col } = activeClue;
        const newGrid = grid.map(r => [...r]);
        for (let i = 0; i < activeClue.answer.length; i++) {
          newGrid[row][col] = activeClue.answer[i];
          if (activeClue.direction === 'across') col++;
          else row++;
        }
        setGrid(newGrid);

      } else {
        toast({ title: 'Chưa đúng!', description: message || 'Hãy thử lại nhé.', variant: 'destructive' });
      }
    });
  }
  
  const handleWheelClose = (spinCount: number) => {
    setSpins(spinCount);
    if(spinCount === 0) {
      setWheelOpen(false);
    }
  }

  const isClueActive = (clueId: string) => activeClue?.id === clueId;
  const isCellInActiveClue = (row: number, col: number) => {
    if (!activeClue) return false;
    const { row: startRow, col: startCol, direction, answer } = activeClue;
    if (direction === 'across') {
      return row === startRow && col >= startCol && col < startCol + answer.length;
    } else {
      return col === startCol && row >= startRow && row < startRow + answer.length;
    }
  }

  const downClue = useMemo(() => clues.find(c => c.direction === 'down'), [clues]);
  const acrossClues = useMemo(() => clues.filter(c => c.direction === 'across'), [clues]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col items-center">
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
                    "relative flex items-center justify-center border border-stone-500",
                    isSolved ? 'bg-primary/20' : 'bg-card',
                    isInActive && !isSolved && 'bg-accent/30',
                  )}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                >
                  {cell.number && (
                    <span className="absolute top-0 left-0.5 text-[0.6rem] text-muted-foreground font-sans">{cell.number}</span>
                  )}
                  <Input
                    ref={el => {
                      if (!inputRefs.current[rIdx]) inputRefs.current[rIdx] = [];
                      inputRefs.current[rIdx][cIdx] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={grid[rIdx][cIdx] || ''}
                    onChange={(e) => handleInputChange(e, rIdx, cIdx)}
                    onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                    className={cn(
                      "cell-input",
                      isSolved ? 'text-primary/90' : 'text-foreground',
                    )}
                    readOnly={isSolved}
                    aria-label={`cell ${rIdx}, ${cIdx}`}
                  />
                </div>
              );
            })
          )}
        </div>
        {activeClue && !solvedClues[activeClue.id] && (
          <div className="mt-6 w-full max-w-md text-center">
            <p className="font-semibold text-lg">{activeClue.number}. {activeClue.direction === 'across' ? 'Ngang' : 'Dọc'}</p>
            <p className="text-muted-foreground mb-4">{activeClue.question ? activeClue.question : "Dùng các chữ cái hàng ngang để đoán từ khóa."}</p>
            <Button onClick={checkCurrentClue} disabled={isPending}>
              {isPending ? 'Đang kiểm tra...' : 'Kiểm tra đáp án'}
            </Button>
          </div>
        )}
         {isWheelOpen && (
             <LuckyWheel 
                open={isWheelOpen} 
                onOpenChange={(isOpen) => !isOpen && handleWheelClose(0)}
                rewards={rewards ?? samplePuzzle.rewards!}
                spins={spins}
                onSpinsChange={handleWheelClose}
            />
         )}
      </div>

      <div className="space-y-6">
        {downClue && (
          <div>
            <h3 className="font-bold text-xl text-primary mb-2 flex items-center gap-2"><Trophy className="text-yellow-500"/> Hàng dọc (Từ khóa)</h3>
            <div
                className={cn("p-2 rounded-md cursor-pointer flex items-center gap-2", isClueActive(downClue.id) && "bg-accent/50 font-bold", solvedClues[downClue.id] && "line-through text-muted-foreground")}
                onClick={() => { setActiveClue(downClue); focusOnClue(downClue); }}
              >
                <HelpCircle className="w-4 h-4 text-muted-foreground"/> 
                <span>Đoán từ khóa ẩn</span>
            </div>
          </div>
        )}
        <div>
          <h3 className="font-bold text-xl text-primary mb-2">Hàng ngang</h3>
          <ul className="space-y-1">
            {acrossClues.map(clue => (
              <li key={clue.id}
                className={cn("p-2 rounded-md cursor-pointer", isClueActive(clue.id) && "bg-accent/50", solvedClues[clue.id] && "line-through text-muted-foreground")}
                onClick={() => { setActiveClue(clue); focusOnClue(clue); }}
              >
                <strong>{clue.number}.</strong> {clue.question}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
