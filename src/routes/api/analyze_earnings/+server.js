import { json } from '@sveltejs/kit';

// Mock data for development purposes with enhanced structure
const mockAnalysis = {
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