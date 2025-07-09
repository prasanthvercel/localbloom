
'use server';
/**
 * @fileOverview An AI flow to analyze a product image and find it in the marketplace.
 *
 * - analyzeProductImage - A function that identifies a product from an image, provides details, translates them, and finds matching products.
 * - AnalyzeProductImageInput - The input type for the function.
 * - AnalyzeProductImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const AnalyzeProductImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the output description.'),
  userId: z.string().uuid().describe('The ID of the user performing the scan.'),
});
export type AnalyzeProductImageInput = z.infer<
  typeof AnalyzeProductImageInputSchema
>;

const FoundProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    vendorName: z.string(),
    vendorId: z.string(),
    image: z.string().nullable(),
});

const AnalyzeProductImageOutputSchema = z.object({
  isFoodItem: z.boolean().describe('Whether the image contains a recognizable food item.'),
  productName: z.string().describe('The common name of the identified food item (e.g., "Apple", "Banana"). This should be in English.'),
  description: z
    .string()
    .describe('A helpful, engaging description of the food item including nutritional information (like calories) and tips (like when to eat it). This description MUST be in the requested language.'),
  personalizedAdvice: z.string().describe("Personalized advice on whether this food fits the user's dietary goals. This advice MUST be in the requested language."),
  foundProducts: z.array(FoundProductSchema).describe('A list of products found in the marketplace that match the identified item, ordered by price.'),
});
export type AnalyzeProductImageOutput = z.infer<
  typeof AnalyzeProductImageOutputSchema
>;

export async function analyzeProductImage(
  input: AnalyzeProductImageInput
): Promise<AnalyzeProductImageOutput> {
  return analyzeProductImageFlow(input);
}

const analysisPrompt = ai.definePrompt({
    name: 'analysisPrompt',
    input: { schema: z.object({
        photoDataUri: AnalyzeProductImageInputSchema.shape.photoDataUri,
        language: AnalyzeProductImageInputSchema.shape.language,
        wellness_goal: z.string().optional().nullable(),
        height: z.number().optional().nullable(),
        weight: z.number().optional().nullable(),
    }) },
    output: { schema: z.object({
        isFoodItem: AnalyzeProductImageOutputSchema.shape.isFoodItem,
        productName: AnalyzeProductImageOutputSchema.shape.productName,
        description: AnalyzeProductImageOutputSchema.shape.description,
        personalizedAdvice: AnalyzeProductImageOutputSchema.shape.personalizedAdvice,
    }) },
    prompt: `You are an expert nutritionist and personal wellness coach for a marketplace app. Your task is to analyze an image of a single food item and provide personalized advice.

  CONTEXT:
  - User's selected language: {{{language}}}
  - User's wellness goal: {{#if wellness_goal}}{{{wellness_goal}}}{{else}}Not specified{{/if}}
  - User's height: {{#if height}}{{{height}}} cm{{else}}Not specified{{/if}}
  - User's weight: {{#if weight}}{{{weight}}} kg{{else}}Not specified{{/if}}
  
  ANALYSIS STEPS:
  1. First, determine if the image clearly shows a food item. If not, set 'isFoodItem' to false and the other fields to empty strings.
  2. If it is a food item, identify its common name. Set 'productName' to this name in English.
  3. Write a friendly and helpful description (2-4 sentences) about the item. Include:
      - Approximate calories and key nutrients (e.g., protein, fiber).
      - A fun fact or a tip on when it's best to eat.
  4. CRITICAL: Based on the user's wellness goal, provide personalized advice.
      - If goal is "Weight Loss", analyze if the food is good for a calorie-deficit diet.
      - If goal is "Muscle Gain", analyze its protein content and suitability for post-workout.
      - If goal is "General Health", analyze its overall nutritional benefits.
      - If no goal is specified, provide general health tips about the food.
      - Keep the advice concise, encouraging, and actionable (1-3 sentences).
  5. The final 'description' and 'personalizedAdvice' fields MUST be translated into the user's requested language: {{{language}}}.

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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch profile to check/reset count and get wellness data
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('scan_count, last_scan_date, height, weight, wellness_goal')
      .eq('id', input.userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = row not found
        throw new Error('Could not retrieve user profile.');
    }

    const today = new Date();
    const lastScan = profile?.last_scan_date ? new Date(profile.last_scan_date) : null;
    let scanCount = profile?.scan_count || 0;

    // Reset count if last scan was in a previous month
    if (lastScan && (lastScan.getMonth() !== today.getMonth() || lastScan.getFullYear() !== today.getFullYear())) {
        scanCount = 0;
    }

    if (scanCount >= 3) {
        // This check is also on the client, but is a necessary safeguard.
        throw new Error('Free scan limit reached for this month.');
    }
    
    // Call the model
    const { output: analysis } = await analysisPrompt({
        photoDataUri: input.photoDataUri,
        language: input.language,
        wellness_goal: profile?.wellness_goal,
        height: profile?.height,
        weight: profile?.weight,
    });

    let foundProducts: z.infer<typeof FoundProductSchema>[] = [];
    
    // If analysis is successful (it's a food item), increment the scan count and search for products.
    if (analysis && analysis.isFoodItem && analysis.productName) {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                scan_count: scanCount + 1,
                last_scan_date: today.toISOString(),
            })
            .eq('id', input.userId);
        
        if (updateError) {
            // Log the error but don't fail the whole flow. The user got their analysis.
            console.error('Failed to update scan count:', updateError);
        }

        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*, vendors(id, name)')
            .ilike('name', `%${analysis.productName.trim()}%`)
            .order('price', { ascending: true })
            .limit(3);

        if (productsError) {
            console.error('Error searching for products:', productsError);
            // Don't fail the flow, just return an empty array
        }

        if (productsData) {
            foundProducts = productsData.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                vendorName: p.vendors?.name || 'Unknown Vendor',
                vendorId: p.vendors?.id || '',
                image: p.image || null
            }));
        }
    }

    return { ...analysis!, foundProducts };
  }
);
