
'use server';
/**
 * @fileOverview An AI flow to generate a personalized weekly diet plan.
 *
 * - generateDietPlan - Creates a 7-day diet plan based on user's wellness goals.
 * - GenerateDietPlanInput - The input type for the function.
 * - GenerateDietPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MealSchema = z.object({
  name: z.string().describe('The name of the dish, e.g., "Oatmeal with Berries".'),
  description: z.string().describe('A short, appealing description of the meal.'),
  calories: z.number().describe('Estimated calories for the meal.'),
  protein: z.number().describe('Estimated protein in grams.'),
  carbs: z.number().describe('Estimated carbohydrates in grams.'),
  fat: z.number().describe('Estimated fat in grams.'),
});
type Meal = z.infer<typeof MealSchema>;

const DailyPlanSchema = z.object({
  breakfast: MealSchema,
  lunch: MealSchema,
  dinner: MealSchema,
  snack: MealSchema,
  daily_totals: z.object({
      calories: z.number().describe('Total estimated calories for the day.'),
      protein: z.number().describe('Total estimated protein in grams for the day.'),
      carbs: z.number().describe('Total estimated carbohydrates in grams for the day.'),
      fat: z.number().describe('Total estimated fat in grams for the day.'),
  }),
});
type DailyPlan = z.infer<typeof DailyPlanSchema>;

const GenerateDietPlanInputSchema = z.object({
  height: z.number().describe('User height in cm.'),
  weight: z.number().describe('User weight in kg.'),
  wellness_goal: z.string().describe('User wellness goal (e.g., Weight Loss, Muscle Gain).'),
  health_conditions: z.string().optional().describe('Comma-separated list of user health conditions or allergies (e.g., "Diabetes, Lactose Intolerant").'),
  language: z.string().describe('The language for the output meal descriptions.'),
});
export type GenerateDietPlanInput = z.infer<typeof GenerateDietPlanInputSchema>;

const GenerateDietPlanOutputSchema = z.object({
  monday: DailyPlanSchema,
  tuesday: DailyPlanSchema,
  wednesday: DailyPlanSchema,
  thursday: DailyPlanSchema,
  friday: DailyPlanSchema,
  saturday: DailyPlanSchema,
  sunday: DailyPlanSchema,
});
export type GenerateDietPlanOutput = z.infer<typeof GenerateDietPlanOutputSchema>;


export async function generateDietPlan(input: GenerateDietPlanInput): Promise<GenerateDietPlanOutput> {
  return generateDietPlanFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateDietPlanPrompt',
    input: { schema: GenerateDietPlanInputSchema },
    output: { schema: GenerateDietPlanOutputSchema },
    prompt: `You are an expert nutritionist. Create a balanced, 7-day diet plan for a user based on their specific wellness profile.

    USER PROFILE:
    - Height: {{{height}}} cm
    - Weight: {{{weight}}} kg
    - Goal: {{{wellness_goal}}}
    - Health Conditions: {{#if health_conditions}}{{{health_conditions}}}{{else}}None specified{{/if}}

    INSTRUCTIONS:
    1.  Calculate an appropriate daily calorie target based on the user's profile and goal.
    2.  Create a varied and appealing meal plan for each of the 7 days (Monday to Sunday).
    3.  For each day, provide suggestions for breakfast, lunch, dinner, and one healthy snack.
    4.  For each meal, provide a name, a short description, and estimated nutritional values (calories, protein, carbs, fat).
    5.  Calculate the total daily nutritional values for each day.
    6.  Ensure the meal names and descriptions are in the requested language: {{{language}}}. The overall structure and keys of the output must remain in English.
    7.  The meals should be simple to prepare and use commonly available ingredients.
    8.  Prioritize whole foods. If the goal is 'Weight Loss', focus on nutrient-dense, lower-calorie options. If 'Muscle Gain', ensure higher protein content.
    9.  CRITICAL: Take the user's health conditions into account.
        - If 'Diabetes' is listed, prioritize low-glycemic index foods and avoid high sugar content.
        - If 'High Blood Pressure' is listed, suggest low-sodium meals.
        - If 'Lactose Intolerant' is listed, avoid dairy products or suggest lactose-free alternatives.
        - Adapt the plan for any other specified allergies or conditions.

    Generate a complete 7-day plan in the specified output format.
    `,
});

const generateDietPlanFlow = ai.defineFlow(
  {
    name: 'generateDietPlanFlow',
    inputSchema: GenerateDietPlanInputSchema,
    outputSchema: GenerateDietPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
