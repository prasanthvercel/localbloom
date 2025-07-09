'use server';
/**
 * @fileOverview An AI flow to analyze a product image.
 *
 * - analyzeProductImage - A function that identifies a product from an image, provides details, and translates them.
 * - AnalyzeProductImageInput - The input type for the function.
 * - AnalyzeProductImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AnalyzeProductImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the output description.'),
});
export type AnalyzeProductImageInput = z.infer<
  typeof AnalyzeProductImageInputSchema
>;

export const AnalyzeProductImageOutputSchema = z.object({
  isFoodItem: z.boolean().describe('Whether the image contains a recognizable food item.'),
  productName: z.string().describe('The common name of the identified food item (e.g., "Apple", "Banana"). This should be in English.'),
  description: z
    .string()
    .describe('A helpful, engaging description of the food item including nutritional information (like calories) and tips (like when to eat it). This description MUST be in the requested language.'),
});
export type AnalyzeProductImageOutput = z.infer<
  typeof AnalyzeProductImageOutputSchema
>;

export async function analyzeProductImage(
  input: AnalyzeProductImageInput
): Promise<AnalyzeProductImageOutput> {
  return analyzeProductImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProductImagePrompt',
  input: { schema: AnalyzeProductImageInputSchema },
  output: { schema: AnalyzeProductImageOutputSchema },
  prompt: `You are a food and nutrition expert for a marketplace app. Your task is to analyze an image of a single food item.

  1.  First, determine if the image clearly shows a food item. If not, set 'isFoodItem' to false and the other fields to empty strings.
  2.  If it is a food item, identify its common name. Set 'productName' to this name in English.
  3.  Then, write a friendly and helpful description (2-4 sentences) about the item. Include:
      - Approximate calories.
      - A fun fact or a tip on when it's best to eat.
  4.  CRITICAL: Translate this entire description into the following language: {{{language}}}. The final 'description' field must be in this language.

  Image to analyze: {{media url=photoDataUri}}
  `,
});

const analyzeProductImageFlow = ai.defineFlow(
  {
    name: 'analyzeProductImageFlow',
    inputSchema: AnalyzeProductImageInputSchema,
    outputSchema: AnalyzeProductImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
