// src/ai/flows/generate-puzzle-clues.ts
'use server';
/**
 * @fileOverview Generates Vietnamese clues for given answers to a crossword puzzle.
 *
 * - generatePuzzleClues - A function that generates Vietnamese clues for the answers.
 * - GeneratePuzzleCluesInput - The input type for the generatePuzzleClues function.
 * - GeneratePuzzleCluesOutput - The return type for the generatePuzzleClues function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePuzzleCluesInputSchema = z.object({
  answers: z.array(z.string()).describe('An array of answers in Vietnamese for the crossword puzzle.'),
});
export type GeneratePuzzleCluesInput = z.infer<typeof GeneratePuzzleCluesInputSchema>;

const GeneratePuzzleCluesOutputSchema = z.object({
  clues: z.array(z.string()).describe('An array of clues in Vietnamese for the crossword puzzle answers.'),
});
export type GeneratePuzzleCluesOutput = z.infer<typeof GeneratePuzzleCluesOutputSchema>;

export async function generatePuzzleClues(input: GeneratePuzzleCluesInput): Promise<GeneratePuzzleCluesOutput> {
  return generatePuzzleCluesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePuzzleCluesPrompt',
  input: {schema: GeneratePuzzleCluesInputSchema},
  output: {schema: GeneratePuzzleCluesOutputSchema},
  prompt: `You are a crossword puzzle creator specializing in Vietnamese puzzles.
  Your task is to generate clues for the given answers in Vietnamese.
  The clues should be appropriate for the Vietnamese language and culture.

  Answers:
  {{#each answers}}
  - {{{this}}}
  {{/each}}

  Generate clues for each answer:
  `, // Fixed: Added a final newline character for better formatting
});

const generatePuzzleCluesFlow = ai.defineFlow(
  {
    name: 'generatePuzzleCluesFlow',
    inputSchema: GeneratePuzzleCluesInputSchema,
    outputSchema: GeneratePuzzleCluesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
