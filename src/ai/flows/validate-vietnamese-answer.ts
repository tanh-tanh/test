//Validate the player's Vietnamese answer in real-time in the Criss Cross puzzle.
'use server';

/**
 * @fileOverview Flow for validating Vietnamese answers in a Criss Cross puzzle.
 *
 * - validateVietnameseAnswer - Validates if the provided answer matches the expected solution.
 * - ValidateVietnameseAnswerInput - Input schema for the validation flow.
 * - ValidateVietnameseAnswerOutput - Output schema indicating if the answer is correct.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateVietnameseAnswerInputSchema = z.object({
  puzzleId: z.string().describe('Unique identifier for the puzzle.'),
  questionId: z.string().describe('Unique identifier for the question within the puzzle.'),
  userAnswer: z.string().describe('The Vietnamese answer provided by the user.'),
  correctAnswer: z.string().describe('The correct Vietnamese answer for the question.'),
});
export type ValidateVietnameseAnswerInput = z.infer<typeof ValidateVietnameseAnswerInputSchema>;

const ValidateVietnameseAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe('Indicates whether the user answer is correct.'),
  message: z.string().optional().describe('Feedback message to the user, if any.'),
});
export type ValidateVietnameseAnswerOutput = z.infer<typeof ValidateVietnameseAnswerOutputSchema>;

export async function validateVietnameseAnswer(
  input: ValidateVietnameseAnswerInput
): Promise<ValidateVietnameseAnswerOutput> {
  return validateVietnameseAnswerFlow(input);
}

const validateVietnameseAnswerPrompt = ai.definePrompt({
  name: 'validateVietnameseAnswerPrompt',
  input: {
    schema: ValidateVietnameseAnswerInputSchema,
  },
  output: {
    schema: ValidateVietnameseAnswerOutputSchema,
  },
  prompt: `You are a Criss Cross puzzle validator. Given a puzzle, question, and a user's answer in Vietnamese, determine if the answer is correct. Compare the userAnswer to the correctAnswer, accounting for potential minor variations in accents or spacing.

Consider the following:
- The puzzle ID is {{{puzzleId}}}.
- The question ID is {{{questionId}}}.
- The user's answer is: "{{{userAnswer}}}".
- The correct answer is: "{{{correctAnswer}}}".

Return a JSON object indicating whether the answer is correct. If the answer is incorrect, provide a helpful feedback message in Vietnamese.
`,
});

const validateVietnameseAnswerFlow = ai.defineFlow(
  {
    name: 'validateVietnameseAnswerFlow',
    inputSchema: ValidateVietnameseAnswerInputSchema,
    outputSchema: ValidateVietnameseAnswerOutputSchema,
  },
  async input => {
    const {output} = await validateVietnameseAnswerPrompt(input);
    return output!;
  }
);
