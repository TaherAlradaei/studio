'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing scheduling recommendations based on historical booking data.
 *
 * - analyzeBookingPatterns - Analyzes booking data and provides scheduling recommendations.
 * - AnalyzeBookingPatternsInput - The input type for the analyzeBookingPatterns function.
 * - AnalyzeBookingPatternsOutput - The return type for the analyzeBookingPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBookingPatternsInputSchema = z.object({
  bookingData: z.string().describe('Historical booking data in JSON format.'),
});
export type AnalyzeBookingPatternsInput = z.infer<
  typeof AnalyzeBookingPatternsInputSchema
>;

const AnalyzeBookingPatternsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'Scheduling recommendations to minimize idle time and maximize field usage.'
    ),
});
export type AnalyzeBookingPatternsOutput = z.infer<
  typeof AnalyzeBookingPatternsOutputSchema
>;

export async function analyzeBookingPatterns(
  input: AnalyzeBookingPatternsInput
): Promise<AnalyzeBookingPatternsOutput> {
  return analyzeBookingPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBookingPatternsPrompt',
  input: {schema: AnalyzeBookingPatternsInputSchema},
  output: {schema: AnalyzeBookingPatternsOutputSchema},
  prompt: `You are a facility scheduling expert. Analyze the following booking data and provide recommendations to minimize idle time and maximize field usage.

Booking Data:
{{bookingData}}

Provide clear, actionable recommendations.`,
});

const analyzeBookingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeBookingPatternsFlow',
    inputSchema: AnalyzeBookingPatternsInputSchema,
    outputSchema: AnalyzeBookingPatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
