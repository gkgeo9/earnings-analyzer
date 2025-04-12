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
    
    // Try modern API route first
    try {
      console.log('Trying modern API route...');
      
      // Use the modern Next.js App Router API route
      const response = await fetch('/api/analyze_earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, year, quarter }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API route success:', data);
        
        // Add metadata if needed
        const analysisResult = {
          ...data,
          ticker,
          year, 
          quarter,
          fromCache: false
        };
        
        // Save to cache
        await saveToCache(ticker, year, quarter, analysisResult);
        return analysisResult;
      } else {
        throw new Error(`API route failed with status ${response.status}`);
      }
    } catch (apiError) {
      console.error('API route error:', apiError);
      // Fall back to mock data
    }
    
    // If we got here, all API attempts failed, return mock data
    console.warn('All API attempts failed, using client-side mock data');
    
    const mockResult = {
      executive_analysis: {
        overall_tone: "neutral",
        confidence_level: "moderate",
        key_messages: ["This is mock data generated on the client"]
      },
      qa_analysis: {
        notable_insights: ["API endpoints failed"]
      },
      red_flags: ["Unable to connect to API"],
      overall_assessment: "API endpoints failed. This is client-generated mock data.",
      ticker,
      year,
      quarter,
      fromCache: false,
      warning: "Using client-side mock data (API endpoint failed)"
    };
    
    return mockResult;
  } catch (error) {
    console.error('API error:', error);
    
    // Return mock data as last resort
    const mockResult = {
      executive_analysis: {
        overall_tone: "neutral",
        confidence_level: "moderate",
        key_messages: ["This is mock data due to API failures"]
      },
      qa_analysis: {
        notable_insights: ["All API endpoints failed"]
      },
      red_flags: ["API system errors occurred"],
      overall_assessment: "All API endpoints failed. This is generated mock data.",
      ticker,
      year,
      quarter,
      fromCache: false,
      error: error.message,
      warning: "Using client-side mock data (all endpoints failed)"
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