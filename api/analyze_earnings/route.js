// Modern Vercel API route (Next.js App Router format)

// Basic mock data
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
  
  export async function POST(request) {
    try {
      // Get parameters from request body
      const data = await request.json();
      const { ticker, year, quarter } = data;
      
      // Validate parameters
      if (!ticker || !year || !quarter) {
        return Response.json({ 
          error: 'Missing required parameters: ticker, year, quarter' 
        }, { status: 400 });
      }
      
      // For now, return mock data with the requested parameters
      const result = {
        ...MOCK_ANALYSIS,
        ticker,
        year,
        quarter,
        message: "This is mock data from the Vercel Edge Function"
      };
      
      // Return the analysis
      return Response.json(result);
    } catch (error) {
      console.error('Server error:', error);
      
      return Response.json({
        error: `Server error: ${error.message}`,
        mock_data: MOCK_ANALYSIS
      }, { status: 500 });
    }
  }