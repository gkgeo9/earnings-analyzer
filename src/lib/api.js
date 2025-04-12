import { getFromCache, saveToCache, getAvailableAnalyses } from './cacheService';

// Analyze earnings call (with caching)
export async function analyzeEarningsCall(ticker, year, quarter, forceRefresh = false) {
  try {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedAnalysis = await getFromCache(ticker, year, quarter);
      if (cachedAnalysis) {
        return { ...cachedAnalysis, fromCache: true };
      }
    }
    
    // Try using the simple fetch approach first
    try {
      const response = await fetch('/api/analyze_earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, year, quarter }),
      });
      
      // If response is ok, try to parse it
      if (response.ok) {
        const data = await response.json();
        
        // Handle Vercel serverless response format if needed
        const result = data.body ? 
          (typeof data.body === 'string' ? JSON.parse(data.body) : data.body) : 
          data;
          
        // Add metadata
        const analysisResult = {
          ...result,
          ticker,
          year, 
          quarter,
          fromCache: false
        };
        
        // Save to cache
        await saveToCache(ticker, year, quarter, analysisResult);
        
        return analysisResult;
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      // Continue to fallback
    }
    
    // Fallback to the SvelteKit endpoint if serverless fails
    console.log('Falling back to SvelteKit endpoint');
    const fallbackResponse = await fetch('/api/analyze_earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, year, quarter }),
    });
    
    const fallbackData = await fallbackResponse.json();
    
    // Add metadata
    const fallbackResult = {
      ...fallbackData,
      ticker,
      year,
      quarter,
      fromCache: false,
      warning: "Using fallback endpoint"
    };
    
    // Save to cache
    await saveToCache(ticker, year, quarter, fallbackResult);
    
    return fallbackResult;
  } catch (error) {
    console.error('API error:', error);
    
    // Return mock data on error
    const mockResult = {
      executive_analysis: {
        overall_tone: "neutral",
        confidence_level: "moderate",
        key_messages: ["This is mock data due to an API error"]
      },
      qa_analysis: {
        notable_insights: ["Error occurred in API call"]
      },
      red_flags: ["API error occurred"],
      overall_assessment: "API error occurred. This is mock data.",
      ticker,
      year,
      quarter,
      fromCache: false,
      error: error.message,
      warning: "Using mock data due to API error"
    };
    
    return mockResult;
  }
}

// Get available quarters for a ticker
export async function getAvailableQuarters(ticker) {
  if (!ticker || ticker.length < 2) return [];
  
  try {
    // Get analyses from cache
    const analyses = await getAvailableAnalyses(ticker);
    
    // Convert to years with quarters
    const yearsMap = new Map();
    analyses.forEach(analysis => {
      if (!yearsMap.has(analysis.year)) {
        yearsMap.set(analysis.year, new Set());
      }
      yearsMap.get(analysis.year).add(analysis.quarter);
    });
    
    // Format result
    const result = [];
    yearsMap.forEach((quarters, year) => {
      result.push({
        year,
        quarters: Array.from(quarters).sort((a, b) => a - b)
      });
    });
    
    // Sort by year (newest first)
    result.sort((a, b) => b.year - a.year);
    
    return result;
  } catch (error) {
    console.error('Error fetching quarters:', error);
    return [];
  }
}