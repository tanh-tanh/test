// A simple crossword grid generator.
// This is a basic implementation and might not find the most optimal layout.

type WordEntry = {
    word: string;
    wordIndex: number;
    direction: 'across' | 'down';
    x: number;
    y: number;
    number: number;
};

type Intersection = {
    x: number;
    y: number;
};

type Layout = {
    width: number;
    height: number;
    grid: (string | null)[][];
    entries: WordEntry[];
};

export function generateGridFromClues(words: string[]): Layout | null {
    if (words.length < 2) return null;

    const sortedWords = words.map((word, index) => ({ word, index })).sort((a, b) => b.word.length - a.word.length);
    
    // Designate the longest word as the main 'down' keyword if possible, otherwise first is 'across'
    const hasPotentialDown = sortedWords.length > 1;
    
    const firstWord = sortedWords[0];
    const secondWord = sortedWords.length > 1 ? sortedWords[1] : null;

    const placedWords: WordEntry[] = [];
    
    // Try to place the first word 'down' and second word 'across' intersecting it
    let successfullyPlacedInitialPair = false;
    if (secondWord) {
        for (let i = 0; i < firstWord.word.length; i++) {
            for (let j = 0; j < secondWord.word.length; j++) {
                if (firstWord.word[i] === secondWord.word[j]) {
                    // Place first word (down)
                    placedWords.push({
                        word: firstWord.word,
                        wordIndex: firstWord.index,
                        direction: 'down',
                        x: j,
                        y: 0,
                        number: 0 // temp
                    });
                     // Place second word (across)
                    placedWords.push({
                        word: secondWord.word,
                        wordIndex: secondWord.index,
                        direction: 'across',
                        x: 0,
                        y: i,
                        number: 0 // temp
                    });
                    successfullyPlacedInitialPair = true;
                    break;
                }
            }
            if (successfullyPlacedInitialPair) break;
        }
    }

    if (!successfullyPlacedInitialPair) {
        // Fallback to original placement logic if intersection fails
        placedWords.push({ 
            word: firstWord.word, 
            wordIndex: firstWord.index,
            direction: 'across', 
            x: 0, 
            y: 0,
            number: 1,
        });
    }

    const wordsToPlace = sortedWords.slice(successfullyPlacedInitialPair ? 2 : 1);

    // Place remaining words
    for (const currentWord of wordsToPlace) {
        let placed = false;
        
        // Try to intersect with already placed words
        for (let j = 0; j < placedWords.length; j++) {
            const placedEntry = placedWords[j];
            for (let k = 0; k < currentWord.word.length; k++) {
                const charToMatch = currentWord.word[k];
                for (let l = 0; l < placedEntry.word.length; l++) {
                    if (placedEntry.word[l] === charToMatch) {
                        const newDirection = placedEntry.direction === 'across' ? 'down' : 'across';
                        let newX, newY;

                        if (newDirection === 'down') {
                           newX = placedEntry.x + l;
                           newY = placedEntry.y - k;
                        } else {
                           newX = placedEntry.x - k;
                           newY = placedEntry.y + l;
                        }
                        
                        const newEntry: Omit<WordEntry, 'number'> = { 
                            word: currentWord.word, 
                            wordIndex: currentWord.index,
                            direction: newDirection, 
                            x: newX, 
                            y: newY 
                        };

                        if (canPlaceWord(newEntry, placedWords)) {
                            placedWords.push({ ...newEntry, number: 0 }); // number will be assigned later
                            placed = true;
                            break;
                        }
                    }
                }
                if (placed) break;
            }
            if (placed) break;
        }

        if (!placed) {
            // Could not place the word, generation failed for this set of words
            return null; 
        }
    }
    
    return createLayoutFromEntries(placedWords);
}

function canPlaceWord(newEntry: Omit<WordEntry, 'number'>, placedWords: WordEntry[]): boolean {
    let { x, y } = newEntry;

    for (let i = 0; i < newEntry.word.length; i++) {
        const currentX = newEntry.direction === 'across' ? x + i : x;
        const currentY = newEntry.direction === 'down' ? y + i : y;

        for (const p of placedWords) {
            let pX = p.x;
            let pY = p.y;
            for (let j = 0; j < p.word.length; j++) {
                const placedX = p.direction === 'across' ? pX + j : pX;
                const placedY = p.direction === 'down' ? pY + j : pY;

                // If cells are the same
                if (placedX === currentX && placedY === currentY) {
                    if (p.word[j] !== newEntry.word[i]) return false; // Words don't match at intersection
                    if (p.direction === newEntry.direction) return false; // Parallel overlap
                }
                
                // Check for adjacent parallel words
                if (newEntry.direction === 'across' && p.direction === 'across') {
                   if (Math.abs(currentY - placedY) === 1 && currentX >= placedX && currentX < placedX + p.word.length) {
                       return false;
                   }
                }
                 if (newEntry.direction === 'down' && p.direction === 'down') {
                   if (Math.abs(currentX - placedX) === 1 && currentY >= placedY && currentY < placedY + p.word.length) {
                       return false;
                   }
                }
            }
        }
    }
    return true;
}


function createLayoutFromEntries(entries: Omit<WordEntry, 'number'>[]): Layout {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    entries.forEach(entry => {
        minX = Math.min(minX, entry.x);
        minY = Math.min(minY, entry.y);
        if (entry.direction === 'across') {
            maxX = Math.max(maxX, entry.x + entry.word.length - 1);
            maxY = Math.max(maxY, entry.y);
        } else {
            maxX = Math.max(maxX, entry.x);
            maxY = Math.max(maxY, entry.y + entry.word.length - 1);
        }
    });

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
    
    const numberedEntries: WordEntry[] = [];
    const startPositions = new Map<string, WordEntry[]>();

    // Normalize coordinates and populate grid
    entries.forEach(entry => {
        const normalizedEntry = { ...entry, x: entry.x - minX, y: entry.y - minY };
        
        let { x, y } = normalizedEntry;
        const key = `${x},${y}`;
        if (!startPositions.has(key)) {
            startPositions.set(key, []);
        }
        startPositions.get(key)!.push(normalizedEntry as WordEntry);

        for (let i = 0; i < normalizedEntry.word.length; i++) {
            grid[y][x] = normalizedEntry.word[i];
            if (normalizedEntry.direction === 'across') x++;
            else y++;
        }
    });

    // Assign clue numbers
    let clueCounter = 1;
    const sortedStarts = [...startPositions.entries()].sort(([keyA], [keyB]) => {
        const [xA, yA] = keyA.split(',').map(Number);
        const [xB, yB] = keyB.split(',').map(Number);
        if (yA !== yB) return yA - yB;
        return xA - xB;
    });

    for(const [, wordEntries] of sortedStarts) {
        // Sort by direction to have 'across' first if they share a start point
        const sortedWordEntries = wordEntries.sort((a,b) => a.direction.localeCompare(b.direction));
        for (const entry of sortedWordEntries) {
            numberedEntries.push({ ...entry, number: clueCounter });
        }
        clueCounter++;
    }


    return {
        width,
        height,
        grid,
        entries: numberedEntries.sort((a,b) => a.wordIndex - b.wordIndex), // Sort back to original word order
    };
}
