'use server';

import { validateVietnameseAnswer } from '@/ai/flows/validate-vietnamese-answer';
import type { ValidateVietnameseAnswerInput } from '@/ai/flows/validate-vietnamese-answer';
import { generatePuzzleClues } from '@/ai/flows/generate-puzzle-clues';
import type { GeneratePuzzleCluesInput } from '@/ai/flows/generate-puzzle-clues';


export async function checkAnswerAction(params: ValidateVietnameseAnswerInput) {
  try {
    const result = await validateVietnameseAnswer(params);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI validation failed:", error);
    // Fallback for when AI fails: simple string comparison
    const isCorrect = params.userAnswer.trim().toLowerCase().replace(/\s+/g, '') === params.correctAnswer.trim().toLowerCase().replace(/\s+/g, '');
    return { 
      success: false, // Indicates fallback was used
      data: { 
        isCorrect, 
        message: isCorrect ? 'Đúng rồi!' : 'Câu trả lời chưa chính xác.' 
      } 
    };
  }
}

export async function generatePuzzleCluesAction(params: GeneratePuzzleCluesInput) {
  try {
    const result = await generatePuzzleClues(params);
    return { success: true, data: result };
  } catch(error) {
    console.error("AI clue generation failed:", error);
    // Fallback to return empty clues
    return {
        success: false,
        data: {
            clues: params.answers.map(() => 'Không thể tạo gợi ý.')
        }
    }
  }
}

export async function getShareableLink(puzzleId: string): Promise<string> {
    // In a real app, this would query a database. For now, we construct it directly.
    // This assumes the app is hosted at the root of a domain.
    // In development (localhost), this might need adjustment if window.location is not available on the server.
    return `/play/${puzzleId}`;
}
