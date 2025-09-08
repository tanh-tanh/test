export type Clue = {
  id: string;
  number: number;
  question: string;
  answer: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
};

export type PuzzleData = {
  id: string;
  title: string;
  clues: Clue[];
  gridSize: { rows: number; cols: number };
  solutionGrid: (string | null)[][];
};

export const samplePuzzle: PuzzleData = {
  id: 'van-hoa-viet',
  title: 'Văn Hoá Việt Nam',
  gridSize: { rows: 5, cols: 5 },
  clues: [
    { id: '1a', number: 1, question: 'Trang phục truyền thống cho phụ nữ', answer: 'AODAI', direction: 'across', row: 1, col: 0 },
    { id: '2d', number: 2, question: 'Món bún nước nổi tiếng', answer: 'PHO', direction: 'down', row: 0, col: 2 },
    { id: '3a', number: 3, question: 'Quốc hoa của Việt Nam', answer: 'SEN', direction: 'across', row: 3, col: 1 },
    { id: '4d', number: 4, question: 'Loại nón che nắng hình chóp', answer: 'NON', direction: 'down', row: 2, col: 4 },
  ],
  solutionGrid: [
    [null, null, 'P', null, null],
    ['A', 'O', 'D', 'A', 'I'],
    [null, null, 'O', null, 'N'],
    [null, 'S', 'E', 'N', 'O'],
    [null, null, null, null, 'N'],
  ],
};
