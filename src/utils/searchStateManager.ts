// Search state management for popup persistence

export interface SearchState {
  query: string;
  results: any[];
  timestamp: number;
  tab: string;
}

export interface StoredSearchState {
  lastSearch?: SearchState;
}

const SEARCH_STATE_KEY = 'lastSearch';
const STATE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Store search state in chrome.storage.local
 */
export const storeSearchState = async (
  query: string, 
  results: any[], 
  tab: string = 'search'
): Promise<void> => {
  try {
    // Check if chrome.storage is available
    if (!chrome?.storage?.local) {
      return;
    }

    const searchState: SearchState = {
      query,
      results,
      timestamp: Date.now(),
      tab
    };

    await chrome.storage.local.set({
      [SEARCH_STATE_KEY]: searchState
    });
  } catch (error) {
    console.error('Error storing search state:', error);
  }
};

/**
 * Restore search state from chrome.storage.local
 */
export const restoreSearchState = async (): Promise<SearchState | null> => {
  try {
    // Check if chrome.storage is available
    if (!chrome?.storage?.local) {
      console.warn('Chrome storage API not available');
      return null;
    }

    const result = await chrome.storage.local.get([SEARCH_STATE_KEY]);
    const searchState = result[SEARCH_STATE_KEY] as SearchState | undefined;
    
    if (!searchState) {
      return null;
    }

    // Check if state is expired (older than 30 minutes)
    if (Date.now() - searchState.timestamp > STATE_EXPIRY_TIME) {
      await clearSearchState();
      return null;
    }

    return searchState;
  } catch (error) {
    console.error('Error restoring search state:', error);
    return null;
  }
};

/**
 * Clear stored search state
 */
export const clearSearchState = async (): Promise<void> => {
  try {
    // Check if chrome.storage is available
    if (!chrome?.storage?.local) {
      return;
    }

    await chrome.storage.local.remove([SEARCH_STATE_KEY]);
  } catch (error) {
    console.error('Error clearing search state:', error);
  }
};

/**
 * Get age of stored search state in minutes
 */
export const getSearchStateAge = (searchState: SearchState): number => {
  return Math.floor((Date.now() - searchState.timestamp) / (1000 * 60));
};

/**
 * Format search state age for display
 */
export const formatSearchStateAge = (searchState: SearchState): string => {
  const ageInMinutes = getSearchStateAge(searchState);
  
  if (ageInMinutes < 1) {
    return 'just now';
  } else if (ageInMinutes === 1) {
    return '1 minute ago';
  } else if (ageInMinutes < 60) {
    return `${ageInMinutes} minutes ago`;
  } else {
    const ageInHours = Math.floor(ageInMinutes / 60);
    if (ageInHours === 1) {
      return '1 hour ago';
    } else {
      return `${ageInHours} hours ago`;
    }
  }
};