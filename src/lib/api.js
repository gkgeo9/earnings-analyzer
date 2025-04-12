import { getFromCache, saveToCache, getAvailableAnalyses } from './cacheService';

/**
 * Analyze an earnings call
 * @param {string} ticker - Stock ticker symbol
 * @param {number} year - Year of earnings call
 * @param {number} quarter - Quarter of earnings call (1-4)
 * @param {boolean} forceRefresh - Whether to bypass cache and get fresh data
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeEarningsCall(ticker, year, quarter, forceRefresh = false) {
  try {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedAnalysis = await getFromCache(ticker, year, quarter);
      if (cachedAnalysis) {
        return { ...cachedAnalysis, fromCache: true };
      }
    }
    
    // Call the API endpoint
    const endpoint = '/api/analyze-earnings'; // Vercel serverless function path
    
    console.log(`Fetching analysis for ${ticker} Q${quarter} ${year}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, year, quarter }),
    });

    // Parse response
    const analysis = await response.json();
    
    // Check for errors in the response
    if (!response.ok) {
      if (analysis.mock_data) {
        console.warn('API error, using mock data:', analysis.error);
        return { ...analysis.mock_data, warning: analysis.error, fromCache: false };
      }
      throw new Error(analysis.error || `Failed with status ${response.status}`);
    }
    
    // Check for warnings
    if (analysis.warning) {
      console.warn('API warning:', analysis.warning);
    }
    
    // Save successful analysis to cache
    await saveToCache(ticker, year, quarter, analysis);
    
    // Return with fromCache flag set to false
    return { ...analysis, fromCache: false };
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

/**
 * Get available quarters for a given ticker
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Array>} - Array of years with available quarters
 */
export async function getAvailableQuarters(ticker) {
  try {
    // Get available analyses from cache
    const analyses = await getAvailableAnalyses(ticker);
    
    // Transform into years with quarters
    const yearsMap = new Map();
    
    analyses.forEach(analysis => {
      if (!yearsMap.has(analysis.year)) {
        yearsMap.set(analysis.year, new Set());
      }
      yearsMap.get(analysis.year).add(analysis.quarter);
    });
    
    // Convert to array format
    const result = [];
    yearsMap.forEach((quarters, year) => {
      result.push({
        year,
        quarters: Array.from(quarters).sort((a, b) => a - b)
      });
    });
    
    // Sort by year (descending)
    result.sort((a, b) => b.year - a.year);
    
    // If no cached data, return some defaults
    if (result.length === 0) {
      const currentYear = new Date().getFullYear();
      return [
        { year: currentYear, quarters: [1, 2] },
        { year: currentYear - 1, quarters: [1, 2, 3, 4] },
      ];
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching available quarters:', error);
    // Fallback to defaults
    const currentYear = new Date().getFullYear();
    return [
      { year: currentYear, quarters: [1, 2] },
      { year: currentYear - 1, quarters: [1, 2, 3, 4] },
    ];
  }
}