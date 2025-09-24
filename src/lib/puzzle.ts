export type Clue = {
  id: string;
  number: number;
  question: string; // Empty for the keyword (down clue)
  answer: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
};

export type LuckyWheelReward = {
  text: string;
};

export type PuzzleData = {
  id: string;
  title: string;
  clues: Clue[];
  gridSize: { rows: number; cols: number };
  solutionGrid: (string | null)[][];
  rewards?: LuckyWheelReward[];
};

export const samplePuzzle: PuzzleData = {
  id: 'van-hoa-viet',
  title: 'Văn Hoá Việt Nam',
  gridSize: { rows: 5, cols: 5 },
  clues: [
     { id: '1d', number: 1, question: '', answer: 'AODAI', direction: 'down', row: 0, col: 2 },
     { id: '1a', number: 1, question: 'Trang phục truyền thống', answer: 'AODAI', direction: 'across', row: 2, col: 0 },
     { id: '2a', number: 2, question: 'Quốc hoa của Việt Nam', answer: 'SEN', direction: 'across', row: 0, col: 2 },
     { id: '3a', number: 3, question: 'Món ăn nước nổi tiếng', answer: 'PHO', direction: 'across', row: 4, col: 2 },
  ],
  rewards: [
    { text: '100 Điểm' },
    { text: 'Thêm Lượt' },
    { text: 'Nhân Đôi Điểm' },
    { text: 'Gợi Ý Miễn Phí' },
    { text: '50 Điểm' },
    { text: 'Mất lượt' },
  ],
  solutionGrid: [
    [null, null, 'A', null, null],
    [null, null, 'O', null, null],
    ['A', 'O', 'D', 'A', 'I'],
    [null, null, 'A', null, null],
    [null, null, 'I', null, null],
  ],
};
