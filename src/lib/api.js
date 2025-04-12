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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }

    const analysis = await response.json();
    
    // Save successful analysis to cache
    if (!analysis.error) {
      await saveToCache(ticker, year, quarter, analysis);
    }
    
    return { ...analysis, fromCache: false };
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