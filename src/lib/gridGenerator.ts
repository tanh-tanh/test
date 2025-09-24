// A simple crossword grid generator.
// This is a basic implementation and might not find the most optimal layout.

type WordEntry = {
    word: string;
    wordIndex: number; // For across words, this is the index in the original across word array. For the keyword, it's -1.
    direction: 'across' | 'down';
    x: number; // top-left x-coordinate
    y: number; // top-left y-coordinate
    number: number;
};

type Layout = {
    width: number;
    height: number;
    grid: (string | null)[][];
    entries: WordEntry[];
};


/**
 * Generates a crossword puzzle grid layout.
 * @param keyword The main word, to be placed vertically (down).
 * @param acrossWords An array of words to be placed horizontally (across), intersecting the keyword.
 * @returns A Layout object or null if a valid layout cannot be generated.
 */
export function generateGrid(keyword: string, acrossWords: string[]): Layout | null {
    if (!keyword || acrossWords.length === 0) {
        return null;
    }

    const keywordChars = keyword.split('');
    const availableIntersections = new Map<string, number[]>(); // char -> array of indices in keyword

    keywordChars.forEach((char, index) => {
        if (!availableIntersections.has(char)) {
            availableIntersections.set(char, []);
        }
        availableIntersections.get(char)!.push(index);
    });

    const placedEntries: WordEntry[] = [];
    const unplacedWords = [...acrossWords.map((word, index) => ({ word, index }))];

    // Place keyword first
    const keywordEntry: Omit<WordEntry, 'number'> = {
        word: keyword,
        wordIndex: -1, // Special index for keyword
        direction: 'down',
        x: 0,
        y: 0,
    };
    placedEntries.push(keywordEntry as WordEntry); // Number will be assigned later

    // Attempt to place all across words
    for (const wordObj of unplacedWords) {
        let placed = false;
        // Find best intersection point
        for (let i = 0; i < wordObj.word.length; i++) {
            const charToMatch = wordObj.word[i];
            if (availableIntersections.has(charToMatch)) {
                 const keywordIndices = availableIntersections.get(charToMatch)!;
                 for (const keywordIndex of keywordIndices) {

                    const newEntry: Omit<WordEntry, 'number'> = {
                        word: wordObj.word,
                        wordIndex: wordObj.index,
                        direction: 'across',
                        x: keywordEntry.x - i,
                        y: keywordEntry.y + keywordIndex,
                    };

                    if (canPlaceWord(newEntry, placedEntries)) {
                        placedEntries.push(newEntry as WordEntry);
                        placed = true;
                        break;
                    }
                 }
            }
            if (placed) break;
        }
        if (!placed) {
            // console.error(`Failed to place word: ${wordObj.word}`);
            return null; // Cannot generate grid if a word can't be placed
        }
    }

    return createLayoutFromEntries(placedEntries);
}

function canPlaceWord(newEntry: Omit<WordEntry, 'number'>, placedEntries: WordEntry[]): boolean {
    // Check for collisions with other words
    for (const p of placedEntries) {
        if (p.direction === 'across' && newEntry.direction === 'across') { // Check against other across words
            // Check for parallel overlap in the same row
            if (newEntry.y === p.y) {
                 if (newEntry.x < p.x + p.word.length && newEntry.x + newEntry.word.length > p.x) {
                     return false; // horizontal overlap
                 }
            }
        }
    }

    // Also check if the new word would lie on top of a non-intersecting part of the keyword
     const keyword = placedEntries.find(e => e.direction === 'down')!;
     for(let i = 0; i < newEntry.word.length; i++) {
         const newX = newEntry.x + i;
         const newY = newEntry.y;

         // Is this cell part of the keyword?
         if(newX === keyword.x && newY >= keyword.y && newY < keyword.y + keyword.word.length) {
            // It is. Do the characters match?
            if(newEntry.word[i] !== keyword.word[newY - keyword.y]) {
                return false; // Conflict!
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
        let needsNumber = true;
        for (const entry of sortedWordEntries) {
            numberedEntries.push({ ...entry, number: clueCounter });
        }
        if(needsNumber) {
           clueCounter++;
        }
    }


    // Re-sort the final entries to have the keyword (down clue) first, then across clues
    const finalSortedEntries = numberedEntries.sort((a, b) => {
        if (a.direction === 'down') return -1;
        if (b.direction === 'down') return 1;
        // Prioritize the keyword's across clue if it exists
        if (a.word === b.word && a.direction === 'across' && b.direction === 'down') return -1;
        if (a.word === b.word && a.direction === 'down' && b.direction === 'across') return 1;

        return a.number - b.number;
    });
    
    // De-duplicate clues that share the same start position, number, and word.
    const uniqueEntries: WordEntry[] = [];
    const seen = new Set<string>();
    
    finalSortedEntries.forEach(entry => {
        // A unique clue is identified by its number and direction.
        const key = `${entry.number}-${entry.direction}`;
        if (!seen.has(key)) {
            uniqueEntries.push(entry);
            seen.add(key);
        } else {
             // Handle the special case where an across word is the same as the keyword
             // and they start at the same point. We want to keep both.
             const keywordEntry = finalSortedEntries.find(e => e.direction === 'down');
             if(keywordEntry && entry.word === keywordEntry.word && entry.direction === 'across' && !uniqueEntries.find(e => e.id === entry.id)) {
                 uniqueEntries.push(entry);
             }
        }
    });


    // Ensure the main keyword (down) is always first.
    uniqueEntries.sort((a, b) => {
        if (a.direction === 'down') return -1;
        if (b.direction === 'down') return 1;
        return a.number - b.number;
    });


    return {
        width,
        height,
        grid,
        entries: uniqueEntries,
    };
}
