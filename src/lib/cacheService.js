import { db } from './firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

const COLLECTION = 'earnings-analyses';

// Check if we're in development mode
const isDev = typeof window !== 'undefined' && 
              (window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1');

// Local storage key for development mode cache
const DEV_CACHE_KEY = 'dev_earnings_cache';

// Generate cache key from parameters
function generateCacheKey(ticker, year, quarter) {
  return `${ticker.toUpperCase()}_${year}_${quarter}`;
}

// Check if analysis exists in cache
export async function getFromCache(ticker, year, quarter) {
  const cacheKey = generateCacheKey(ticker, year, quarter);
  
  try {
    if (isDev || !db) {
      // In development or if Firebase is not initialized, use localStorage
      console.log('Using local storage cache');
      const devCache = localStorage.getItem(DEV_CACHE_KEY);
      if (devCache) {
        const cache = JSON.parse(devCache);
        if (cache[cacheKey]) {
          const data = cache[cacheKey];
          // Check if cache expired (30 days)
          const cacheTime = new Date(data.cachedAt);
          const expirationTime = 30 * 24 * 60 * 60 * 1000; // 30 days
          
          if (Date.now() - cacheTime.getTime() > expirationTime) {
            console.log('Cache expired');
            return null;
          }
          
          console.log('Cache hit');
          return data.analysis;
        }
      }
      console.log('Cache miss');
      return null;
    } else {
      // In production with Firebase initialized, use Firestore
      const docRef = doc(db, COLLECTION, cacheKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Check if cache expired (30 days)
        const data = docSnap.data();
        const cacheTime = data.cachedAt.toDate();
        const expirationTime = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (Date.now() - cacheTime.getTime() > expirationTime) {
          console.log('Cache expired');
          return null;
        }
        
        console.log('Cache hit');
        return data.analysis;
      }
      
      console.log('Cache miss');
      return null;
    }
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
}

// Save analysis to cache
export async function saveToCache(ticker, year, quarter, analysis) {
  const cacheKey = generateCacheKey(ticker, year, quarter);
  
  try {
    if (isDev || !db) {
      // In development or if Firebase is not initialized, use localStorage
      let devCache = localStorage.getItem(DEV_CACHE_KEY);
      let cache = devCache ? JSON.parse(devCache) : {};
      
      cache[cacheKey] = {
        ticker: ticker.toUpperCase(),
        year,
        quarter,
        analysis,
        cachedAt: new Date().toISOString()
      };
      
      localStorage.setItem(DEV_CACHE_KEY, JSON.stringify(cache));
      console.log('Saved to local storage cache');
    } else {
      // In production with Firebase initialized, use Firestore
      const docRef = doc(db, COLLECTION, cacheKey);
      
      await setDoc(docRef, {
        ticker: ticker.toUpperCase(),
        year,
        quarter,
        analysis,
        cachedAt: new Date()
      });
      
      console.log('Saved to Firestore cache');
    }
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Get all available analyses for a ticker
export async function getAvailableAnalyses(ticker) {
  try {
    if (isDev || !db) {
      // In development or if Firebase is not initialized, use localStorage
      const devCache = localStorage.getItem(DEV_CACHE_KEY);
      if (!devCache) return [];
      
      const cache = JSON.parse(devCache);
      const upperTicker = ticker.toUpperCase();
      const results = [];
      
      // Filter cached items for this ticker
      Object.values(cache).forEach(item => {
        if (item.ticker === upperTicker) {
          results.push({
            ticker: item.ticker,
            year: item.year,
            quarter: item.quarter,
            cachedAt: new Date(item.cachedAt)
          });
        }
      });
      
      return results;
    } else {
      // In production with Firebase initialized, use Firestore
      const analysesRef = collection(db, COLLECTION);
      const q = query(analysesRef, where('ticker', '==', ticker.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          ticker: data.ticker,
          year: data.year,
          quarter: data.quarter,
          cachedAt: data.cachedAt.toDate()
        });
      });
      
      return results;
    }
  } catch (error) {
    console.error('Error getting analyses:', error);
    return [];
  }
}