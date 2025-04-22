// Updated Vercel serverless function for analyzing earnings calls
import { GoogleGenAI } from "@google/genai";

// Mock data as fallback
const MOCK_ANALYSIS = {
  "executive_analysis": {
    "overall_tone": "positive",
    "confidence_level": "high",
    "hedging_language": ["While macroeconomic uncertainties may persist into next quarter...", "Our expansion plans could be affected by regulatory changes..."],
    "strong_claims": ["We delivered record revenue of $2.7B, up 18% year-over-year", "Our customer acquisition cost decreased 12% while retention improved to 94%"],
    "key_messages": ["North American revenue grew 22% to $1.4B", "Cloud services division expanded margins by 320 basis points", "R&D investments increased 15% focusing on AI capabilities"]
  },
  "qa_analysis": {
    "most_evasive_questions": [
      {
        "question": "Can you break down the components of the 250 basis point margin pressure in the hardware division?",
        "analyst": "Jane Smith, Morgan Stanley",
        "directness": "somewhat evasive",
        "evasion_tactics": ["Redirected to overall company margins: 'Looking at the bigger picture, total company margins improved...'", "Referenced temporary factors without specifics: 'Several one-time factors affected this segment'"]
      }
    ],
    "notable_insights": ["Planning $500M expansion in Southeast Asian markets beginning Q3", "New enterprise security product launching in August with 3 major clients already committed"]
  },
  "financial_metrics": {
    "highlighted_metrics": ["18% YoY revenue growth", "94% customer retention rate", "32% gross margin in cloud services"],
    "downplayed_metrics": ["Hardware division revenue decline of 3%", "R&D as percentage of revenue increased from 14% to 16%"],
    "new_metrics": ["Introduced 'AI-enabled customer ratio' at 37%, expected to reach 50% by year-end"]
  },
  "competitive_positioning": {
    "mentioned_competitors": ["Referenced Competitor X's recent market exit: 'As others retreat from this space, we're doubling down'", "Compared cloud security features favorably to Competitor Y's offering"],
    "market_dynamics": ["Enterprise shift to hybrid cloud accelerating, with 65% of new customers choosing this option", "Supply chain constraints easing with component lead times down 30%"],
    "competitive_advantages": ["Proprietary AI platform generating 22% of recommendations, outperforming industry average of 15%", "Patent portfolio expanded by 47 new grants"]
  },
  "forward_looking_statements": ["Projecting Q3 revenue between $2.8-2.9B, representing 15-20% YoY growth", "Expect to add 7-9 new enterprise clients in the financial services vertical"],
  "red_flags": ["Hardware margins compressed 250 basis points YoY, the third consecutive quarterly decline", "Customer acquisition costs in European market increased 18% with lower conversion rates"],
  "change_analysis": ["Stopped providing specific guidance on hardware division after three quarters of declining performance", "Shifted emphasis from geographic expansion to product development compared to previous calls"],
  "overall_assessment": "Strong overall performance led by cloud services and North American growth, though hardware division challenges persist and European expansion is proving more costly than anticipated. Management appears confident in AI strategy but less forthcoming about hardware roadmap."
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
  
  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'X-Api-Key': API_NINJAS_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Ninjas error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
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
  
  // Create analysis prompt with emphasis on returning valid JSON
  const prompt = `You are a senior financial analyst with extensive experience analyzing ${ticker}'s industry and competitors. You're examining ${ticker}'s earnings call transcript from ${transcriptData.date || 'recent date'}.

Analyze this transcript thoroughly and provide detailed, specific insights based on actual content from the transcript, not generic observations. Focus on:

1. Executive language patterns, tone, and confidence during prepared remarks
2. Specific claims made about performance, with exact metrics and numbers
3. How executives handle challenging questions from analysts
4. Financial metrics they emphasize or avoid discussing
5. Competitive landscape and market positioning
6. Forward-looking statements and guidance
7. Changes in messaging compared to previous communications

Here's the transcript:
${JSON.stringify(transcriptData)}

I need your response to be a valid, well-formed JSON object with the following structure:

{
  "executive_analysis": {
    "overall_tone": "very negative/negative/neutral/positive/very positive", 
    "confidence_level": "very low/low/moderate/high/very high",
    "hedging_language": ["EXACT QUOTES of uncertain or cautious language with brief context"],
    "strong_claims": ["EXACT QUOTES of definitive statements with brief context"],
    "key_messages": ["Primary points emphasized with SPECIFIC metrics or examples"]
  },
  "qa_analysis": {
    "most_evasive_questions": [
      {
        "question": "EXACT QUOTE of the challenging question",
        "analyst": "Analyst name and firm",
        "directness": "CHOOSE ONE: very evasive (completely avoided answering), somewhat evasive (answered different question than asked), neutral (partial answer), somewhat direct (mostly answered), very direct (fully answered)",
        "evasion_tactics": ["SPECIFIC tactics with EXACT QUOTED phrases from response"]
      }
    ],
    "notable_insights": ["Specific revelations from Q&A with EXACT QUOTES and implications"]
  },
  "financial_metrics": {
    "highlighted_metrics": ["SPECIFIC metrics with EXACT numbers management emphasized"],
    "downplayed_metrics": ["SPECIFIC metrics with EXACT numbers that received minimal discussion"],
    "new_metrics": ["Any new KPIs or measures introduced with EXACT definition provided"]
  },
  "competitive_positioning": {
    "mentioned_competitors": ["Companies EXPLICITLY named with EXACT QUOTES and context"],
    "market_dynamics": ["SPECIFIC industry trends discussed with EXACT QUOTES"],
    "competitive_advantages": ["SPECIFIC advantages claimed with EXACT QUOTES and evidence"]
  },
  "forward_looking_statements": ["EXACT QUOTES of projections with SPECIFIC numbers and timeframes"],
  "red_flags": ["Concerning elements with EXACT QUOTES and historical context"],
  "change_analysis": ["Notable shifts in messaging from previous quarters with EXACT comparisons"],
  "overall_assessment": "Detailed assessment including strongest and weakest points backed by SPECIFIC evidence"
}

IMPORTANTLY:
1. Your entire response must be ONLY this JSON object with NO other text before or after
2. Every JSON field must be properly formatted with quotation marks around keys and string values
3. All arrays must use square brackets with comma-separated items
4. Ensure all quotes, commas, and braces are properly matched
5. The JSON must be syntactically valid with no errors`;
  
  try {
    // Generate content with Gemini
    // Using systemInstruction to emphasize JSON validity 
    const model = genAI.models.get("gemini-2.5-flash-preview-04-17");
    const response = await model.chat.sendMessage(prompt, {
      systemInstruction: "You are a financial analysis AI that outputs only valid, properly formatted JSON. All responses must be valid JSON objects with no other text or formatting."
    });
    
    // Get the raw text response
    const text = response.text();
    
    console.log("Raw Gemini response (first 100 chars):", text.substring(0, 100));
    
    // Try multiple approaches to extract valid JSON
    try {
      // First approach: Check for markdown code blocks (most common issue)
      const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) {
        try {
          console.log("Found markdown code block, attempting to parse JSON from inside it");
          const jsonStr = markdownMatch[1].trim();
          return JSON.parse(jsonStr);
        } catch (markdownError) {
          console.log("Markdown extraction failed:", markdownError.message);
        }
      }
      
      // Second approach: Direct parsing (if no markdown wrapper)
      try {
        return JSON.parse(text);
      } catch (directError) {
        console.log("Direct parsing failed, trying alternative methods:", directError.message);
      }
      
      // Third approach: Extract JSON using regex pattern
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log("Attempting to extract JSON with regex");
          const jsonStr = jsonMatch[0];
          return JSON.parse(jsonStr);
        } catch (regexError) {
          console.log("Regex extraction failed:", regexError.message);
        }
      }
      
      // Fourth approach: Try to fix common JSON issues
      try {
        // Replace single quotes with double quotes
        let fixedText = text.replace(/'/g, '"')
          // Fix common issues with trailing commas
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          // Remove any non-JSON text before the first { and after the last }
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '');
        
        if (fixedText.trim().startsWith('{') && fixedText.trim().endsWith('}')) {
          return JSON.parse(fixedText);
        }
      } catch (fixError) {
        console.log("JSON fixing failed:", fixError.message);
      }
      
      // Fifth approach: More aggressive cleaning
      try {
        // Find content between first { and last }
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const potentialJson = match[0];
          // Try to parse with more lenient JSON parser or fix common issues
          const cleanJson = potentialJson
            .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
            .replace(/:\s*'([^']*)'/g, ': "$1"')  // Replace single quotes with double quotes
            .replace(/,(\s*[\]}])/g, '$1');  // Remove trailing commas
            
          return JSON.parse(cleanJson);
        }
      } catch (cleanError) {
        console.log("Aggressive JSON cleaning failed:", cleanError.message);
      }
      
      // Log the failure and fall back to mock data
      console.error("All JSON extraction methods failed. Response received:", text.substring(0, 500) + "...");
      throw new Error('Could not extract valid JSON from the Gemini response');
    } catch (error) {
      console.error("JSON parsing completely failed:", error);
      throw error;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
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
      try {
        result = await analyzeTranscript(ticker, transcriptData);
        
        // Add metadata
        result.ticker = ticker;
        result.year = year;
        result.quarter = quarter;
        result.date = transcriptData.date;
      } catch (analysisError) {
        console.error('Gemini analysis error:', analysisError);
        
        // Return mock data with warning if analysis fails
        result = {
          ...MOCK_ANALYSIS,
          ticker,
          year,
          quarter,
          date: transcriptData.date,
          warning: `Analysis error: ${analysisError.message}. Using mock data.`
        };
      }
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
      mock_data: {
        ...MOCK_ANALYSIS,
        ticker: req.body?.ticker || 'UNKNOWN',
        year: req.body?.year || new Date().getFullYear(),
        quarter: req.body?.quarter || 1
      }
    });
  }
}