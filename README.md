# Nutrition Assistant 🥦🍎

Nutrition Assistant is a medical-grade, production-ready full-stack web application developed using the MERN Stack (**MongoDB**, **Express**, **React**, **Node**), styled with high-fidelity utility classes (**Tailwind CSS**), and driven by **Google Gemini 3.5 Flash AI** intelligence.

The application calculates Basal Metabolic Rates (BMR) and daily energy targets via clinical Mifflin-St Jeor metabolic equations, then constructs personalized nutrition roadmaps detailing meal timings, macro partitions, clean foods, and step targets.

---

## 🌟 Key Features

1. **Precision Somatic Profiling & BMR Calculations**:
   - Computes Basal Metabolic Rate dynamically based on gender, height, weight, age, and physical activity multipliers.
2. **Deterministic & AI-Powered Nutrition Synthesis**:
   - Integrates Google Gemini AI (`gemini-2.5` or modern fallback engines) to design meal items, specific clock schedules, and active step limits.
   - Includes a deterministic fallback matrix to guarantee operations even if the API credentials are unset.
3. **Smart AI Counsel Chatbot**:
   - Conversational dietitian counselor ("NutriBot") embedded directly on the user dashboard.
4. **Dual-Adapter Storage Engine**:
   - Intelligently connects to a live MongoDB Atlas database if `MONGODB_URI` is provided.
   - Gracefully falls back to a robust file-based local JSON database (`data/localdb.json`) for instant sandbox evaluation.
5. **Role-Based Command Dashboard**:
   - **Administrators**: Complete system oversight, auditing, and control panels to delete accounts and wipe historical plan logs.
   - **Users**: High-fidelity dashboard displaying real-time BMI dials, activity gauges, plan calendars, and interactive meal builders.
6. **Robust JWT Verification Gateways**:
   - Full-stack state management securing server routes and client transitions.

---

## 📂 Project Architecture

The backend adheres strictly to the **MVC (Model-View-Controller)** separation of concerns:

```
├── /server.ts                      # Central HTTP entry point & Vite asset proxy middleware
├── /server/
│   ├── /controllers/               # MVC Controllers (handling HTTP endpoints & business logic)
│   │   ├── userController.ts       # Registration, login, profile updates, and admin management
│   │   ├── suggestionController.ts # Generating, querying, and purging nutrition plans
│   │   └── chatController.ts       # Conversational chatbot proxy handler
│   ├── /db/
│   │   ├── config.ts               # Database connection state manager (Atlas check)
│   │   └── localDb.ts              # Local JSON database adapter
│   ├── /middlewares/
│   │   └── authMiddleware.ts       # JWT token verification & role check gates
│   ├── /models/
│   │   ├── User.ts                 # Mongoose User profiling schema
│   │   └── Suggestion.ts           # Mongoose Nutrition Plan suggestions schema
│   └── /utils/
│       └── suggestNutrition.ts     # Mifflin-St Jeor engine & Gemini AI prompt engineers
```

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the root directory:

```env
# Server details
PORT=3000

# Security secrets
JWT_SECRET="YourSecretSignatureKey"

# MongoDB Credentials (if left empty, the app automatically launches on Local JSON Storage)
MONGODB_URI="mongodb+srv://..."

# Gemini API Credentials (injected automatically in AI Studio workspace)
GEMINI_API_KEY="YourGoogleGeminiApiKey"
```

---

## 🚀 Commands

- **Development Mode**:
  ```bash
  npm run dev
  ```
- **Production Build & Bundling**:
  ```bash
  npm run build
  ```
- **Launch Compiled Application**:
  ```bash
  npm run start
  ```

---

## 🧪 Postman API Testing Collection

Import this raw JSON schema into Postman to instantly test all REST endpoints:

```json
{
  "info": {
    "name": "Nutrition Assistant API",
    "description": "Postman Collection to test MVC controllers, JWT validation, and admin features.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "User Auth",
      "item": [
        {
          "name": "Register User Profile",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Sowjanya Mulamuri\",\n  \"email\": \"mulamurisowjanya31@gmail.com\",\n  \"password\": \"sowjanya123\",\n  \"age\": 26,\n  \"gender\": \"Female\",\n  \"height\": 164,\n  \"weight\": 62,\n  \"activityLevel\": \"Moderately Active\"\n}"
            },
            "url": { "raw": "http://localhost:3000/api/users/register" }
          }
        },
        {
          "name": "Login User Account",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"mulamurisowjanya31@gmail.com\",\n  \"password\": \"sowjanya123\"\n}"
            },
            "url": { "raw": "http://localhost:3000/api/users/login" }
          }
        }
      ]
    },
    {
      "name": "Nutrition Calculations",
      "item": [
        {
          "name": "Calculate & Create AI Plan",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer <YOUR_JWT_TOKEN>" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"age\": 26,\n  \"height\": 164,\n  \"weight\": 62,\n  \"activityLevel\": \"Moderately Active\",\n  \"weightGoal\": \"Weight Loss\"\n}"
            },
            "url": { "raw": "http://localhost:3000/api/suggestions/create" }
          }
        },
        {
          "name": "Get User Plan History",
          "request": {
            "method": "GET",
            "header": [
              { "key": "Authorization", "value": "Bearer <YOUR_JWT_TOKEN>" }
            ],
            "url": { "raw": "http://localhost:3000/api/suggestions/user/<USER_ID>" }
          }
        },
        {
          "name": "Get Plan Details By ID",
          "request": {
            "method": "GET",
            "header": [
              { "key": "Authorization", "value": "Bearer <YOUR_JWT_TOKEN>" }
            ],
            "url": { "raw": "http://localhost:3000/api/suggestions/<PLAN_ID>" }
          }
        }
      ]
    },
    {
      "name": "Diet Counselor Chatbot",
      "item": [
        {
          "name": "Ask Counselor NutriBot",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer <YOUR_JWT_TOKEN>" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"message\": \"What is a good protein source for vegans?\",\n  \"history\": []\n}"
            },
            "url": { "raw": "http://localhost:3000/api/chat" }
          }
        }
      ]
    },
    {
      "name": "Administrative Controls",
      "item": [
        {
          "name": "Get All Users Directory",
          "request": {
            "method": "GET",
            "header": [
              { "key": "Authorization", "value": "Bearer <ADMIN_JWT_TOKEN>" }
            ],
            "url": { "raw": "http://localhost:3000/api/users/all" }
          }
        },
        {
          "name": "Delete User Account",
          "request": {
            "method": "DELETE",
            "header": [
              { "key": "Authorization", "value": "Bearer <ADMIN_JWT_TOKEN>" }
            ],
            "url": { "raw": "http://localhost:3000/api/users/<USER_ID>" }
          }
        }
      ]
    }
  ]
}
```
