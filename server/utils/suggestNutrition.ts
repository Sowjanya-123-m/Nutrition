import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google GenAI SDK (accessed server-side only)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface NutritionPlanInput {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  weightGoal: 'Weight Loss' | 'Maintain Weight' | 'Weight Gain';
}

export interface NutritionPlanOutput {
  bmi: number;
  bmiCategory: string;
  calorieIntake: number;
  proteinNeeds: number; // in grams
  carbohydrateNeeds: number; // in grams
  suggestion: string;
  foods: string[];
  timing: string;
  walk: string;
}

export async function generateNutritionPlan(input: NutritionPlanInput): Promise<NutritionPlanOutput> {
  const { name, age, gender, height, weight, activityLevel, weightGoal } = input;

  // 1. Calculate BMI
  const heightInMeters = height / 100;
  const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

  let bmiCategory = 'Normal';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 18.5 && bmi <= 24.9) bmiCategory = 'Normal';
  else if (bmi >= 25.0 && bmi <= 29.9) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese';

  // 2. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 3. Adjust BMR for Activity Level
  let activityMultiplier = 1.2;
  switch (activityLevel) {
    case 'Sedentary': activityMultiplier = 1.2; break;
    case 'Lightly Active': activityMultiplier = 1.375; break;
    case 'Moderately Active': activityMultiplier = 1.55; break;
    case 'Very Active': activityMultiplier = 1.725; break;
    case 'Extra Active': activityMultiplier = 1.9; break;
  }

  const maintenanceCalories = bmr * activityMultiplier;

  // 4. Adjust calories for weight goal
  let calorieIntake = Math.round(maintenanceCalories);
  if (weightGoal === 'Weight Loss') {
    calorieIntake = Math.round(maintenanceCalories - 500);
    // Safety check: Don't suggest calories below minimum physiological safe levels
    if (gender === 'Male') calorieIntake = Math.max(calorieIntake, 1500);
    else calorieIntake = Math.max(calorieIntake, 1200);
  } else if (weightGoal === 'Weight Gain') {
    calorieIntake = Math.round(maintenanceCalories + 450);
  }

  // 5. Calculate macronutrient targets
  // Protein: Weight Loss needs higher protein density to preserve muscle mass.
  // Weight Loss: 2.0g per kg bodyweight. Maintain: 1.5g per kg. Weight Gain: 1.8g per kg.
  let proteinMultiplier = 1.5;
  if (weightGoal === 'Weight Loss') proteinMultiplier = 2.0;
  else if (weightGoal === 'Weight Gain') proteinMultiplier = 1.8;

  const proteinNeeds = Math.round(weight * proteinMultiplier);
  
  // Carbohydrates: Around 50% of calorie intake (1g Carb = 4 calories)
  const carbohydrateNeeds = Math.round((calorieIntake * 0.50) / 4);

  // 6. Generate Foods, Timings, Walk Recommendations & Advice
  // Attempt to use Gemini API for top-tier personalization.
  if (ai) {
    try {
      const prompt = `You are an expert AI clinical nutritionist. Generate a highly personalized nutrition plan for a user with these stats:
- Name: ${name}
- Age: ${age} years old
- Gender: ${gender}
- Height: ${height} cm
- Weight: ${weight} kg
- BMI: ${bmi} (${bmiCategory})
- Activity Level: ${activityLevel}
- Weight Goal: ${weightGoal}
- Calculated Target Daily Calories: ${calorieIntake} kcal
- Calculated Protein Needs: ${proteinNeeds} grams
- Calculated Carbohydrate Needs: ${carbohydrateNeeds} grams

You must return a response in strict JSON format matching the schema exactly.
Provide rich, high-fidelity, actionable nutrition recommendations tailored specifically to their goal and metabolic profile. No generic advice. Identify 5-7 specific wholesome foods. Elaborate on meal timings (breakfast, lunch, snacks, dinner) with estimated hour marks. Prescribe a specific walking and step goal matching their physical capabilities. Write an encouraging yet scientific overall advice overview in "suggestion".`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestion: { type: Type.STRING, description: 'Overall clinical dietary suggestion text.' },
                foods: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 5 to 7 specific recommended food items with brief bulleted explanations on why they are ideal.',
                },
                timing: { type: Type.STRING, description: 'Meal scheduling structure (e.g. breakfast at 8am, lunch at 1pm, snack at 4pm, dinner at 8pm).' },
                walk: { type: Type.STRING, description: 'Specific walking or workout recommendation tailored to their activity level and weight goal.' },
              },
              required: ['suggestion', 'foods', 'timing', 'walk'],
            },
          },
        });
      } catch (firstError) {
        console.warn('⚠️ Primary model gemini-3.5-flash failed or busy. Retrying with gemini-3.1-flash-lite...', firstError);
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  suggestion: { type: Type.STRING, description: 'Overall clinical dietary suggestion text.' },
                  foods: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of 5 to 7 specific recommended food items with brief bulleted explanations on why they are ideal.',
                  },
                  timing: { type: Type.STRING, description: 'Meal scheduling structure (e.g. breakfast at 8am, lunch at 1pm, snack at 4pm, dinner at 8pm).' },
                  walk: { type: Type.STRING, description: 'Specific walking or workout recommendation tailored to their activity level and weight goal.' },
                },
                required: ['suggestion', 'foods', 'timing', 'walk'],
              },
            },
          });
        } catch (secondError) {
          console.error('❌ Fallback model gemini-3.1-flash-lite also failed. Reverting to deterministic template engine...', secondError);
          throw secondError;
        }
      }

      const parsedData = JSON.parse(response.text?.trim() || '{}');
      
      if (parsedData.suggestion && parsedData.foods && parsedData.timing && parsedData.walk) {
        return {
          bmi,
          bmiCategory,
          calorieIntake,
          proteinNeeds,
          carbohydrateNeeds,
          suggestion: parsedData.suggestion,
          foods: parsedData.foods,
          timing: parsedData.timing,
          walk: parsedData.walk,
        };
      }
    } catch (apiError) {
      console.error('⚠️ Gemini API execution error, falling back to deterministic nutrition engine:', apiError);
    }
  }

  // High-Quality Deterministic Fallback Engine
  const defaultFoodsMap: Record<string, string[]> = {
    'Weight Loss': [
      'Grilled Chicken Breast & Turkey: Lean, high-quality proteins to maximize thermic effect and preserve muscle.',
      'Broccoli, Spinach, and Kale: Leafy greens rich in volume, micronutrients, and high fiber for premium satiety.',
      'Oats & Quinoa: High-fiber complex carbohydrates for sustained glucose control.',
      'Greek Yogurt (Non-fat): Packed with casein proteins and live cultures for optimal digestive tract flora.',
      'Berries (Blueberries, Raspberries): Low calorie, high antioxidant density to combat oxidative cellular stress.',
      'Egg Whites: Low-calorie macro-dense protein source perfect for custom cooking.'
    ],
    'Maintain Weight': [
      'Brown Rice & Sweet Potatoes: Stable glucose release to fuel daily activities and sustain cellular homeostasis.',
      'Wild Salmon & Mackerel: Rich in Omega-3 fatty acids for premium cardiovascular and cognitive health.',
      'Mixed Raw Nuts & Seeds: Nutrient-dense healthy monounsaturated fats for clean hormone synthesis.',
      'Mixed Green Salad: Raw vegetables for natural antioxidant delivery and essential digestive enzymes.',
      'Avocados: High fiber, healthy fats to fuel cognitive energy and support brain performance.',
      'Chicken Thighs & Lean Beef: Balanced macronutrient protein source with rich iron content.'
    ],
    'Weight Gain': [
      'Whole Eggs & Lean Red Meat: Rich in amino acids and healthy cholesterol for clean muscle hypertrophy.',
      'Peanut Butter & Almond Butter: Calorically dense healthy fats to meet high metabolic demands.',
      'Bananas & Dried Dates: Fast-acting premium glycogen replenishment for cellular energy and heavy lifting.',
      'Whole Whole-Wheat Pasta & White Rice: Clean carbohydrates to fuel physical exercise and sustain metabolic surplus.',
      'Cottage Cheese & Whey Protein: Fast and slow-release proteins for continuous muscle rebuilding.',
      'Granola & Raw Honey: Rich in calorie-dense whole grains for rapid athletic energy release.'
    ]
  };

  const suggestionMap: Record<string, string> = {
    'Weight Loss': `Based on your physiological statistics and a BMI of ${bmi} (${bmiCategory}), you are positioned in a targeted caloric deficit (-500 kcal from maintenance). Your main focus must be on keeping dietary protein levels high (${proteinNeeds}g) to guard skeletal muscle tissue, combined with abundant dietary fiber to maintain a stable metabolic rate and full fullness levels. Avoid liquid calories and processed sugar. Drink 3.5 liters of pure water daily.`,
    'Maintain Weight': `Your metabolic parameters are well-balanced with a BMI of ${bmi} (${bmiCategory}). The primary clinical goal is maintaining healthy cellular homeostasis and muscle-fat ratios. We recommend focusing on a balanced 50% carbs, 25% protein, and 25% healthy fats split. Keep your micro and macronutrient ratios stable. Focus on whole, minimally processed ingredients.`,
    'Weight Gain': `Based on your goal to build muscle or increase weight, you are positioned in a structured caloric surplus with a target of ${calorieIntake} kcal. This will fuel lean mass development. Your diet should consist of calorie-dense, wholesome foods that supply ample carbohydrates (${carbohydrateNeeds}g) for high-intensity muscular performance, and ample proteins (${proteinNeeds}g) for accelerated muscle protein synthesis. Ensure adequate recovery sleep.`
  };

  const timingMap: Record<string, string> = {
    'Weight Loss': 'Breakfast (8:30 AM): High protein & fiber to limit morning cravings. Lunch (1:30 PM): Large volume lean green salad with grilled poultry. Afternoon Snack (4:30 PM): Non-fat Greek yogurt with blueberries. Dinner (8:00 PM): Baked fish with steam-cooked vegetables. Limit any calorie intake after 9:00 PM.',
    'Maintain Weight': 'Breakfast (8:00 AM): Oatmeal with chopped almonds and berries. Mid-Morning (11:00 AM): One apple and a scoop of protein. Lunch (1:30 PM): Grilled salmon with baked sweet potato. Afternoon Snack (4:30 PM): Handful of walnuts and banana. Dinner (8:00 PM): Turkey wrap or lean beef with brown rice and mixed salad.',
    'Weight Gain': 'Breakfast (7:30 AM): 3 whole eggs, whole-wheat toast, and banana. Mid-Morning (10:30 AM): Granola bowl with peanut butter and whole milk. Lunch (1:00 PM): Beef fried rice with broccoli and sesame oil. Afternoon Snack (4:00 PM): Calorie-dense dried fruit and mixed nuts. Pre-Workout (6:30 PM): Fruit smoothie. Dinner (8:30 PM): Baked salmon with quinoa, avocado, and spinach.'
  };

  const walkMap: Record<string, string> = {
    'Weight Loss': 'Prescription: Walk 8,000 to 10,000 steps daily (approx. 60-70 minutes). Incorporate 20 minutes of brisk walking after lunch and dinner to maximize the thermic effect of food and optimize postprandial insulin response.',
    'Maintain Weight': 'Prescription: Walk 7,000 to 8,000 steps daily (approx. 45-50 minutes). Maintain active circulation and cardiovascular efficiency. Focus on consistent joint health and light active mobility.',
    'Weight Gain': 'Prescription: Walk 4,500 to 5,000 steps daily (approx. 30 minutes). Focus energy conservation on muscle-building resistance training. Keep cardiovascular health stable with light, pleasant strolls rather than intensive fat-burning cardio.'
  };

  return {
    bmi,
    bmiCategory,
    calorieIntake,
    proteinNeeds,
    carbohydrateNeeds,
    suggestion: suggestionMap[weightGoal] || suggestionMap['Maintain Weight'],
    foods: defaultFoodsMap[weightGoal] || defaultFoodsMap['Maintain Weight'],
    timing: timingMap[weightGoal] || timingMap['Maintain Weight'],
    walk: walkMap[weightGoal] || walkMap['Maintain Weight']
  };
}
