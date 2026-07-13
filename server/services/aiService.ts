import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { SuggestionModel } from '../models/Suggestion';
import { MealModel } from '../models/Meal';
import { localDb } from '../db/localDb';
import { isMongoConnected } from '../db/config';

dotenv.config();

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

// Helper to compile user context into a robust prompt segment
async function getUserContext(userId: string): Promise<string> {
  try {
    let user: any = null;
    let latestSuggestion: any = null;
    let todayMeals: any[] = [];

    if (isMongoConnected) {
      user = await UserModel.findById(userId);
      if (user) {
        latestSuggestion = await SuggestionModel.findOne({ userId }).sort({ date: -1 });
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        todayMeals = await MealModel.find({ userId, date: { $gte: startOfDay } });
      }
    } else {
      user = localDb.findUserById(userId);
      if (user) {
        const suggestions = localDb.findSuggestionsByUserId(userId);
        if (suggestions.length > 0) {
          latestSuggestion = suggestions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        }
        const todayStr = new Date().toDateString();
        todayMeals = localDb.findMealsByUserId(userId).filter(m => new Date(m.date).toDateString() === todayStr);
      }
    }

    if (!user) return 'User context is not available.';

    // Calculate BMI
    const heightM = user.height / 100;
    const bmi = (user.weight / (heightM * heightM)).toFixed(1);
    
    // Get goals & current stats
    const goal = latestSuggestion?.weightGain || 'Maintain Weight';
    const calTarget = latestSuggestion?.calorieIntake || 'Calculating...';
    const proteinTarget = latestSuggestion?.proteinNeeds || 'Calculating...';
    const carbsTarget = latestSuggestion?.carbohydrateNeeds || 'Calculating...';

    const loggedCal = todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
    const loggedProtein = todayMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
    const loggedCarbs = todayMeals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
    const loggedFat = todayMeals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0);

    return `
=== USER PROFILE & METABOLIC STATS ===
- Name: ${user.name}
- Age: ${user.age} years old
- Gender: ${user.gender}
- Height: ${user.height} cm
- Weight: ${user.weight} kg
- BMI: ${bmi}
- Physical Activity Level: ${user.activityLevel}
- Nutrition Goal: ${goal}
- Target Daily Caloric Limit: ${calTarget} kcal
- Target Protein: ${proteinTarget}g
- Target Carbohydrates: ${carbsTarget}g

=== TODAY'S LOGGED FOOD INTAKE ===
- Logged Calories: ${loggedCal} kcal
- Logged Protein: ${loggedProtein}g
- Logged Carbs: ${loggedCarbs}g
- Logged Fats: ${loggedFat}g
- Logged Meals Count: ${todayMeals.length}
${todayMeals.map((m, idx) => `  * Meal ${idx + 1}: [${m.mealName}] ${m.description} (${m.calories} kcal, P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`).join('\n')}
======================================
`;
  } catch (error) {
    console.error('Error compiling user context:', error);
    return 'Error compiling user context.';
  }
}

export async function getChatResponse(userId: string, message: string, history: any[]): Promise<string> {
  const userContext = await getUserContext(userId);

  const systemInstruction = `You are "NutriBot", an elite clinical nutritionist, empathetic health coach, and personal trainer.
You have secure access to the patient's biological metrics, diet goals, and real-time food journal.
Your task is to provide supportive, medically sound, highly personalized, and direct nutritional and lifestyle advice.

Rules:
1. Ground your advice in the user's metabolic profile provided in the prompt context. Reference their stats (e.g. weight, height, goal, logged meals) where relevant to show true custom tailoring!
2. Answer all nutrition, food alternatives, calories, exercise, and diet-related queries in clear natural language.
3. If they ask about unhealthy foods, suggest nutritious, delicious alternatives.
4. When explaining nutrients (like proteins, fats, carbs, vitamins), explain their exact physiological functions.
5. Provide actionable advice for water intake (typically 3-4L for active goals) and tailored exercise plans.
6. Format your responses with rich, highly readable markdown: use bold headers, crisp bullet points, and highlight key metrics.
7. Always sound encouraging, scientific, and professional.
8. If the user asks about completely unrelated non-health topics, politely steer them back to their nutritional wellness.
`;

  if (ai) {
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    try {
      // Create a chat session with full system instruction and user details preloaded
      const chat = ai.chats.create({
        model: 'gemini-3.5-flash',
        config: {
          systemInstruction: `${systemInstruction}\n\nHere is the active user's metabolic context:\n${userContext}`,
        },
        history: formattedHistory,
      });

      const result = await chat.sendMessage({ message });
      return result.text || 'I could not generate an advice response. Please try again.';
    } catch (error) {
      console.error('Gemini chat error, reverting to secondary model...', error);
      try {
        const chat = ai.chats.create({
          model: 'gemini-3.1-flash-lite',
          config: {
            systemInstruction: `${systemInstruction}\n\nHere is the active user's metabolic context:\n${userContext}`,
          },
          history: formattedHistory,
        });
        const result = await chat.sendMessage({ message });
        return result.text || 'I could not generate a response. Please try again.';
      } catch (fallbackError) {
        console.error('Gemini fallback chat error, falling back to offline demo response:', fallbackError);
        return getDemoResponse(message, userContext);
      }
    }
  }

  // Simulated fallback response in case GEMINI_API_KEY is not set
  return getDemoResponse(message, userContext);
}

// Special helper to handle automated suggestions on specific features like weekly meal planning, healthy alternatives, etc.
export async function getSpecializedFeature(userId: string, feature: string): Promise<string> {
  const userContext = await getUserContext(userId);
  let prompt = '';

  switch (feature) {
    case 'weekly_meal_plan':
      prompt = 'Generate a detailed weekly meal plan (Monday through Sunday) showing optimal meal partitions (Breakfast, Lunch, Dinner, Snacks) with estimated portion sizes and calorie/protein targets matching my goal.';
      break;
    case 'healthy_alternatives':
      prompt = 'Give me a list of 10 extremely common unhealthy foods (such as milk chocolate, deep fried fries, white bread, soda, commercial salad dressings) and provide delicious, nutrient-dense clinical healthy alternatives for each. Explain the physiological benefits.';
      break;
    case 'water_and_exercise':
      prompt = 'Prescribe a scientific hydration schedule (water intake recommendation in mL/hours) and a specific home/gym exercise routine (strength, cardio, and flexibility) tailored precisely to my age, weight, and fitness goal.';
      break;
    case 'nutrients_explained':
      prompt = 'Provide an elegant, deep educational breakdown of essential nutrients: proteins, complex carbs, essential fatty acids, and key micronutrients (Vitamins D, B12, Magnesium, Zinc). Explain their structural and metabolic roles inside the body.';
      break;
    case 'motivational_tips':
      prompt = 'Provide 5 deeply motivating scientific health tips, habit-forming guidelines, and psychological strategies to help me overcome weight fluctuations and keep consistency.';
      break;
    default:
      prompt = 'Provide general personalized diet advice based on my current logs and physical profile.';
  }

  return getChatResponse(userId, prompt, []);
}

function getDemoResponse(message: string, context: string): string {
  const msgLower = message.toLowerCase();
  
  let matchAdvice = '';
  if (msgLower.includes('week') || msgLower.includes('plan')) {
    matchAdvice = `
### 🗓️ Your Personalized Weekly Meal Plan [Demo Mode]

Here is a balanced weekly routine optimized for your goals:

*   **Monday & Wednesday (High Protein Emphasis)**
    *   **Breakfast**: Oats cooked in unsweetened almond milk + scoop of clean whey protein + chia seeds.
    *   **Lunch**: 150g grilled chicken breast with organic quinoa and roasted asparagus.
    *   **Snack**: 1 cup fat-free Greek yogurt with organic blueberries.
    *   **Dinner**: 160g pan-seared wild salmon + steam-cooked broccoli + sweet potato mash.
*   **Tuesday & Thursday (Complex Carbs & Satiety)**
    *   **Breakfast**: 3 egg whites scrambled with baby spinach, tomatoes, and 1 slice sprouted whole-wheat toast.
    *   **Lunch**: Large turkey breast wrap in high-fiber whole wheat tortilla with raw avocado slices.
    *   **Snack**: Handful of dry-roasted raw almonds.
    *   **Dinner**: Extra lean beef stir-fry with zucchini noodles, bell peppers, and low-sodium tamari.
*   **Friday & Saturday (Metabolic Support)**
    *   **Breakfast**: Chia seed protein pudding + fresh raspberries.
    *   **Lunch**: Macro-packed Mediterranean bowl with grilled chicken, chickpeas, feta, and extra virgin olive oil.
    *   **Dinner**: Baked white fish (cod or halibut) with a double serving of leafy green salad.
*   **Sunday (Rest & Prep)**
    *   **Breakfast**: 2 whole scrambled eggs + half avocado + sautéed mushrooms.
    *   **Lunch**: Baked turkey breast + steamed green beans.
    *   **Dinner**: Mixed vegetable curry with organic tofu.

*Hydration Target: Drink 3 to 4 liters of filtered water daily to facilitate metabolic functions!*
`;
  } else if (msgLower.includes('alternative') || msgLower.includes('unhealthy')) {
    matchAdvice = `
### 🔄 Wholesome Healthy Alternatives [Demo Mode]

Swap these common unhealthy foods for high-performance fuel:

1.  **Deep-Fried Potato Fries** ➡️ **Air-Baked Sweet Potato Wedges**
    *   *Why*: Cuts out industrial seed oils while delivering rich Beta-Carotene (Vitamin A) and complex carbohydrates that do not spike insulin rapidly.
2.  **Sugary Soda** ➡️ **Sparkling Water with Squeezed Lime & Mint**
    *   *Why*: Eliminates high-fructose corn syrup which stresses the liver, while offering crisp cellular hydration.
3.  **Milk Chocolate Bars** ➡️ **85%+ Organic Extra Dark Chocolate**
    *   *Why*: Lowers sugar load dramatically while providing heart-healthy polyphenols and magnesium.
4.  **White Sandwich Bread** ➡️ **Sprouted Grain / Sourdough Bread**
    *   *Why*: Lower glycemic index, easier on digestion due to lactobacillus fermentation, and retains natural wheat germ vitamins.
5.  **Store Salad Dressing** ➡️ **Cold-Pressed Extra Virgin Olive Oil & Lemon**
    *   *Why*: Substitutes refined soybean oils with stable monounsaturated fats that support arterial flexibility and brain health.
`;
  } else if (msgLower.includes('water') || msgLower.includes('exercise') || msgLower.includes('workout')) {
    matchAdvice = `
### 💧 Scientific Hydration & Training Prescription [Demo Mode]

#### 1. Hydration Guide
*   **Baseline target**: 3.2 Liters daily (approx. 13-14 cups).
*   **Timing schedule**: Drink 500mL immediately upon waking up to jumpstart cellular hydration. Keep a bottle on your desk and sip 250mL every hour. Limit large volumes 2 hours before sleeping.

#### 2. Exercise Protocol
*   **Resistance Routine**: 3-4 sessions per week (Upper/Lower Split or Full Body). Focus on compound movements (Squats, Roman Chair Deadlifts, Dumbbell Presses, Lat Pulldowns) to stimulate muscle protein synthesis and bone density.
*   **Cardiovascular Efficiency**: 150 minutes of Moderate-Intensity Steady State (MISS) cardio per week (e.g. brisk walking at 5.5 km/h) or 75 minutes of High-Intensity Interval Training (HIIT).
*   **Post-Meal Walk**: Walk for 10-15 minutes immediately following your largest meals. This simple act drastically reduces glucose peaks and enhances digestive motility.
`;
  } else if (msgLower.includes('nutrient') || msgLower.includes('protein') || msgLower.includes('carb') || msgLower.includes('fat')) {
    matchAdvice = `
### 🧪 Biological Breakdown of Essential Nutrients [Demo Mode]

Let's demystify your macronutrients:

*   **Proteins (Amino Acids)**: The structural bricks of human life. They rebuild muscle fibers, craft critical digestive enzymes, and support immunoglobulins. Essential sources: organic poultry, egg whites, wild-caught fish, and tempeh.
*   **Carbohydrates (Glycogen)**: The primary, high-octane fuel source for your central nervous system and muscles during exercise. Prioritize complex carbs (sweet potatoes, steel-cut oats, quinoa) which release glucose slowly, preventing energy crashes.
*   **Healthy Fats (Lipids)**: Essential for cellular membrane structural integrity, brain function (which is 60% fat), and synthesizing hormones (like testosterone and estrogen). Prioritize avocados, olive oil, and wild omega-3 fish.
`;
  } else {
    matchAdvice = `
### 👋 Hello from NutriBot! [Demo Mode]

I've carefully analyzed your biological statistics. Here is a high-yield clinical tip based on your active profile:

*   **Keep Protein Consistent**: To protect muscle tissue and optimize metabolic rate, try to distribute your protein intake evenly across 3-4 meals. Aim for at least 30g per meal.
*   **Fasting Windows**: Try to maintain a clean 12-hour fast overnight (e.g., eating from 8 AM to 8 PM) to give your gut microbiome and liver a chance to rest and recover.
*   **Non-starchy Greens**: Ensure at least 40% of your lunch and dinner plates consist of dark leafy greens. They supply folate, magnesium, and dietary nitrates which promote nitric oxide production and cellular circulation.

*(To talk to a real-time, fully operational Gemini clinical AI coach, please add a valid **GEMINI_API_KEY** in the Settings > Secrets panel).*
`;
  }

  return `
[NutriBot Demo Context Engine Connected]
Here is a customized analysis based on your profile stats:
${context}

---

${matchAdvice}
`;
}
