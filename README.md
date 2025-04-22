# Earnings Call Insight Engine

![Earnings Call Insight Engine](https://earnings-analyzer.vercel.app/favicon.png)

A modern web application that analyzes earnings call transcripts and provides detailed insights into company performance, executive language, competitive positioning, and more.

## 🚀 Features

- **Deep Analysis**: Examines executive tone, confidence level, and key messaging
- **Q&A Insights**: Identifies evasive answers and notable revelations from analyst questions
- **Financial Metrics**: Highlights emphasized and downplayed numbers
- **Competitive Positioning**: Extracts competitor mentions and market dynamics
- **Red Flags**: Catches potential warning signs and concerning statements
- **Forward-Looking Statements**: Collects future projections and guidance
- **Change Analysis**: Tracks shifts in messaging compared to previous quarters

## 💻 Tech Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) with [Tailwind CSS](https://tailwindcss.com/)
- **AI Analysis**: [Google Gemini API](https://ai.google.dev/) (via `@google/genai` package)
- **Data Source**: API Ninjas earnings call transcript API
- **Backend**: Vercel Serverless Functions
- **Data Persistence**: Firebase Firestore (with local storage fallback for development)

## 📋 Requirements

- Node.js 18+
- Vercel account (for deployment)
- Google API key (for Gemini AI access)
- API Ninjas key (for earnings call transcripts)
- Firebase project (optional for production data persistence)

## 🔧 Setup

### 1. Clone the repository

```bash
git clone https://github.com/gkgeo9/earnings-analyzer.git
cd earnings-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

For the Vercel serverless function, you'll need to add these environment variables in your Vercel project settings:

```
GOOGLE_API_KEY=your_google_api_key
API_NINJAS_KEY=your_api_ninjas_key
```

### 4. Run in development mode

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

### 5. Build for production

```bash
npm run build
```

## 🌐 Deployment

This project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the environment variables
3. Deploy

The `vercel.json` file is already set up to handle the serverless function with an extended timeout (60 seconds) to accommodate the AI analysis.

## 📊 How It Works

1. **User Input**: Enter a stock ticker symbol, year, and quarter
2. **Data Retrieval**: The serverless function fetches the earnings call transcript from API Ninjas
3. **AI Analysis**: Google's Gemini AI analyzes the transcript to extract insights
4. **Results**: Detailed analysis is displayed in a user-friendly interface
5. **Caching**: Results are cached in Firestore (or localStorage in development) to improve performance and reduce API costs

## 🔄 Caching System

The application includes a sophisticated caching system that:

- Stores analysis results for 30 days
- Allows users to force-refresh for updated analysis
- Displays cached analysis availability in the UI
- Works with Firebase Firestore in production
- Falls back to localStorage in development

## 📱 Responsive Design

The UI is fully responsive and works on mobile, tablet, and desktop devices with a modern glass-morphism design aesthetic.