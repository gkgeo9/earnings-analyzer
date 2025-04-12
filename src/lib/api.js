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
    
    // If no cache hit or forcing refresh, call API
    const response = await fetch('/api/analyze_earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, year, quarter }),
    });

    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Failed to parse server response');
    }
    
    // Check if the response is wrapped in a body property (Vercel format)
    if (response.ok && result.body && !result.error) {
      try {
        const bodyContent = typeof result.body === 'string' 
          ? JSON.parse(result.body) 
          : result.body;
          
        result = bodyContent;
      } catch (e) {
        console.error('Failed to parse response body:', e);
      }
    }
    
    // Check for errors
    if (!response.ok || result.error) {
      const errorMessage = result.error || `Request failed with status ${response.status}`;
      
      // If there's mock data available in the error response, use it
      if (result.mock_data) {
        console.warn('Using mock data due to API error:', errorMessage);
        result = { 
          ...result.mock_data, 
          warning: errorMessage,
          fromCache: false 
        };
      } else {
        throw new Error(errorMessage);
      }
    }
    
    // Check for warnings
    if (result.warning) {
      console.warn('API warning:', result.warning);
    }
    
    // Add fromCache flag
    const finalResult = { ...result, fromCache: false };
    
    // Save successful analysis to cache
    await saveToCache(ticker, year, quarter, finalResult);
    
    return finalResult;
  } catch (error) {
    console.error('API error:', error);
    throw error;
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