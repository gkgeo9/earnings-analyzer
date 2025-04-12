import { json } from '@sveltejs/kit';

// Mock data for development purposes
const mockAnalysis = {
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
 * SvelteKit API endpoint for development environment
 */
export async function POST({ request }) {
  try {
    const { ticker, year, quarter } = await request.json();
    
    console.log(`Dev mode: Analyzing ${ticker} Q${quarter} ${year}`);
    
    // In development, return mock data with a slight delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a modified version of the mock data that includes the requested information
    return json({
      ...mockAnalysis,
      ticker,
      year,
      quarter,
      message: "This is mock data from the SvelteKit development endpoint"
    });
  } catch (error) {
    console.error('Error in development endpoint:', error);
    return json({ 
      error: 'Failed to analyze earnings call',
      message: error.message
    }, { status: 500 });
  }
}