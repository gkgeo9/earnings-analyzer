// Vercel serverless function for analyzing earnings calls
import { GoogleGenAI } from "@google/genai";

// Mock data as fallback
const MOCK_ANALYSIS = {
  "executive_analysis": {
    "overall_tone": "positive",
    "confidence_level": "high",
    "hedging_language": ["may", "could", "potentially"],
    "strong_claims": ["We delivered record revenue", "Our strategy is working"],
    "key_messages": ["Strong revenue growth", "Expanding market share", "Continued innovation"]
  },
  "qa_analysis": {
    "most_evasive_questions": [
      {
        "question": "Can you provide more details on the margin pressure?",
        "analyst": "John Smith",
        "directness": "somewhat indirect",
        "evasion_tactics": ["Focusing on growth instead", "Changing topic"]
      }
    ],
    "notable_insights": ["Planning expansion in Asia", "New product launch in Q3"]
  },
  "forward_looking_statements": ["Expect continued growth next quarter", "Planning to increase R&D investment"],
  "red_flags": ["Slight margin compression", "Increasing competition in core markets"],
  "overall_assessment": "Overall strong performance with some challenges on the horizon."
};

/**
 * Get transcript from API Ninjas
 * @param {string} ticker - Stock ticker symbol
 * @param {number} year - Year of earnings call
 * @param {number} quarter - Quarter of earnings call
 * @returns {Promise<Object>} - Transcript data
 */
async function getTranscript(ticker, year, quarter) {
  const API_NINJAS_KEY = process.env.API_NINJAS_KEY;
  
  if (!API_NINJAS_KEY) {
    throw new Error('API Ninjas key is not configured');
  }
  
  const url = 'https://api.api-ninjas.com/v1/earningstranscript';
  const params = new URLSearchParams({
    ticker: ticker,
    year: year,
    quarter: quarter
  });
  
  const response = await fetch(`${url}?${params}`, {
    headers: {
      'X-Api-Key': API_NINJAS_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Ninjas error: ${response.status} - ${await response.text()}`);
  }
  
  return await response.json();
}

/**
 * Analyze transcript using Google's Generative AI
 * @param {string} ticker - Stock ticker symbol
 * @param {Object} transcriptData - Transcript data from API Ninjas
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeTranscript(ticker, transcriptData) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key is not configured');
  }
  
  // Initialize the Google GenAI client
  const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  // Create analysis prompt
  const prompt = `
  You are an expert financial analyst examining an earnings call transcript for ${ticker} from ${transcriptData.date || 'recent date'}.

  Analyze this transcript carefully and provide insights in JSON format:

  ${JSON.stringify(transcriptData)}

  Please provide your analysis in this JSON format:
  {
    "executive_analysis": {
      "overall_tone": "very negative/negative/neutral/positive/very positive",
      "confidence_level": "very low/low/moderate/high/very high",
      "hedging_language": ["examples of hedging phrases"],
      "strong_claims": ["examples of confident claims"],
      "key_messages": ["main points emphasized"]
    },
    "qa_analysis": {
      "most_evasive_questions": [
        {
          "question": "text of question",
          "analyst": "analyst name",
          "directness": "very indirect/somewhat indirect/neutral/somewhat direct/very direct",
          "evasion_tactics": ["tactics used"]
        }
      ],
      "notable_insights": ["important insights from Q&A"]
    },
    "forward_looking_statements": ["significant projections or guidance"],
    "red_flags": ["concerning elements"],
    "overall_assessment": "brief assessment of the call"
  }

  Return ONLY valid JSON with NO explanation or preamble.
  `;
  
  // Generate content with Gemini
  const response = await genAI.models.generateContent({
    model: "gemini-pro",
    contents: prompt,
  });
  
  const text = response.text;
  
  // Extract JSON from response
  try {
    // First try direct JSON parsing
    return JSON.parse(text);
  } catch (e) {
    // If there's anything surrounding the JSON, extract it
    const jsonMatch = text.match(/({[\s\S]*})/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Could not extract valid JSON from the Gemini response');
    }
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Get parameters from request body
    const { ticker, year, quarter } = req.body;
    
    // Validate parameters
    if (!ticker || !year || !quarter) {
      return res.status(400).json({ 
        error: 'Missing required parameters: ticker, year, quarter' 
      });
    }
    
    let result;
    
    try {
      // Get transcript from API Ninjas
      console.log(`Getting transcript for ${ticker} Q${quarter} ${year}`);
      const transcriptData = await getTranscript(ticker, year, quarter);
      
      // Analyze transcript with Google Gemini
      console.log('Analyzing transcript with Gemini');
      result = await analyzeTranscript(ticker, transcriptData);
      
      // Add metadata
      result.ticker = ticker;
      result.year = year;
      result.quarter = quarter;
      result.date = transcriptData.date;
      
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Return mock data with warning if API call fails
      result = {
        ...MOCK_ANALYSIS,
        ticker,
        year,
        quarter,
        warning: `API error: ${apiError.message}. Using mock data.`
      };
    }
    
    // Return the analysis
    return res.status(200).json(result);
  } catch (error) {
    console.error('Server error:', error);
    
    return res.status(500).json({
      error: `Server error: ${error.message}`,
      mock_data: MOCK_ANALYSIS
    });
  }
}