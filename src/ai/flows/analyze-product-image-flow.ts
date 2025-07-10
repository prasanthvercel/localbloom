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
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the output description.'),
  userId: z.string().uuid().optional().describe('The ID of the user performing the scan. Optional for anonymous users.'),
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

const NutritionInfoSchema = z.object({
    calories: z.number().describe('Estimated calories per serving.'),
    protein: z.number().describe('Estimated protein in grams per serving.'),
    carbs: z.number().describe('Estimated carbohydrates in grams per serving.'),
    fat: z.number().describe('Estimated fat in grams per serving.'),
});

const AnalyzeProductImageOutputSchema = z.object({
  isFoodItem: z.boolean().describe('Whether the image contains a recognizable food item.'),
  productName: z.string().describe('The common name of the identified product (e.g., "Apple", "Hand-woven Basket"). This should be in English.'),
  description: z
    .string()
    .describe('A helpful, engaging description of the product. This description MUST be in the requested language. Do not include nutritional info here.'),
  nutrition: NutritionInfoSchema.nullable().describe('Structured nutritional information for the food item. Null if not a food item.'),
  personalizedAdvice: z.string().describe("Personalized advice on whether this food fits the user's dietary goals. Null or empty if not a food item. This advice MUST be in the requested language."),
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
        health_conditions: z.string().optional().nullable(),
    }) },
    output: { schema: z.object({
        isFoodItem: AnalyzeProductImageOutputSchema.shape.isFoodItem,
        productName: AnalyzeProductImageOutputSchema.shape.productName,
        description: AnalyzeProductImageOutputSchema.shape.description,
        nutrition: AnalyzeProductImageOutputSchema.shape.nutrition,
        personalizedAdvice: AnalyzeProductImageOutputSchema.shape.personalizedAdvice,
    }) },
    prompt: `You are a product recognition expert for a marketplace app. Your task is to analyze an image of a product and provide details about it.

  CONTEXT:
  - User's selected language: {{{language}}}
  - User's wellness goal: {{#if wellness_goal}}{{{wellness_goal}}}{{else}}Not specified{{/if}}
  - User's height: {{#if height}}{{{height}}} cm{{else}}Not specified{{/if}}
  - User's weight: {{#if weight}}{{{weight}}} kg{{else}}Not specified{{/if}}
  - User's Health Conditions: {{#if health_conditions}}{{{health_conditions}}}{{else}}None specified{{/if}}
  
  ANALYSIS STEPS:
  1.  First, identify the primary product in the image. Set 'productName' to its common name in English. If you cannot identify a product, return an empty string for 'productName' and other fields.
  2.  Next, determine if the identified product is a food item. Set 'isFoodItem' to true or false.
  3.  Write a friendly and helpful description (2-4 sentences) about the product. If it is not a food item, this description MUST include the product's primary use or purpose. Do not include nutritional info in this description.
  4.  If and ONLY IF 'isFoodItem' is true, perform the following nutritional analysis:
      a. Provide structured nutritional information for a standard serving size in the 'nutrition' field.
      b. CRITICAL: If the user has provided wellness data, provide personalized dietary advice.
          - Check for health conditions. If a condition makes the food unsuitable (e.g., high sugar for diabetes), this should be the primary advice.
          - If no critical health conflicts exist, analyze based on the wellness goal (Weight Loss, Muscle Gain, etc.).
          - If no user wellness data is provided, return an empty string for 'personalizedAdvice'.
  5.  If the product is NOT a food item, 'nutrition' must be null and 'personalizedAdvice' must be an empty string.
  6.  The final 'description' and 'personalizedAdvice' fields MUST be translated into the user's requested language: {{{language}}}.

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
    
    let profile: { scan_count: number | null, last_scan_date: string | null, height: number | null, weight: number | null, wellness_goal: string | null, health_conditions: string | null } | null = null;

    // Only interact with the database if a user is logged in
    if (input.userId) {
        const { data: userProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('scan_count, last_scan_date, height, weight, wellness_goal, health_conditions')
          .eq('id', input.userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = row not found
            console.error('Could not retrieve user profile:', fetchError);
            // Don't throw, just proceed without profile data
        }
        profile = userProfile;
    }
    
    // Call the model with whatever data we have (profile can be null)
    const { output: analysis } = await analysisPrompt({
        photoDataUri: input.photoDataUri,
        language: input.language,
        wellness_goal: profile?.wellness_goal,
        height: profile?.height,
        weight: profile?.weight,
        health_conditions: profile?.health_conditions,
    });

    let foundProducts: z.infer<typeof FoundProductSchema>[] = [];
    
    // If analysis is successful and a product was identified, search for it.
    // If user is logged in, also update their scan count.
    if (analysis && analysis.productName) {
        if (input.userId && profile) {
            const today = new Date();
            const lastScan = profile.last_scan_date ? new Date(profile.last_scan_date) : null;
            let scanCount = profile.scan_count || 0;

            // Reset count if last scan was in a previous month
            if (lastScan && (lastScan.getMonth() !== today.getMonth() || lastScan.getFullYear() !== today.getFullYear())) {
                scanCount = 0;
            }

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
