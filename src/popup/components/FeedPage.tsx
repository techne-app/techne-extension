import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { ThreadCard } from "./ThreadCard";

// Use the proper ThreadCardData type to match the shared components
interface ThreadCardData {
  id: number;
  cumulative_karma: number;
  comment_count: number;
  theme: string;
  category: string;
  story_id: number;
  story_title: string;
  story_url: string;
  anchor: string;
  summary: string;
  updated_at: string;
}

interface FeedPageProps {
  feedId: string;
  title: string;
  description: string;
  initialThreads?: ThreadCardData[];
  hoursBack?: number;
  numCards?: number;
  sortBy?: 'karma' | 'karma_density' | 'engagement';
  excludeCategories?: string[];
  includeCategories?: string[];
  keywordFilter?: string[];
  onRefresh?: () => void;
  className?: string;
}

// API configuration
const API_BASE_URL = 'https://techne-pipeline-func-prod.azurewebsites.net/api';

const DEFAULT_EXCLUDED_CATEGORIES = [
  'General Discussion',
  'Discussion', // Backend fallback category
];

// Fetch function copied from shared components
const fetchThreadCards = async (
  hoursBack?: number,
  numCards?: number,
  sortBy?: 'karma' | 'karma_density' | 'engagement',
  excludeCategories?: string[],
  densityMinCommentConstant: number = 10,
  offset?: number,
  includeCategories?: string[],
  keywordFilter?: string[]
): Promise<ThreadCardData[]> => {
  try {
    const requestBody: { 
      hours_back?: number; 
      num_cards?: number;
      sort_by?: 'karma' | 'karma_density' | 'engagement';
      exclude_categories?: string[];
      include_categories?: string[];
      keyword_filter?: string[];
      density_min_comment_constant?: number;
      offset?: number;
    } = { 
      density_min_comment_constant: densityMinCommentConstant
    };

    // Only include hours_back if specified
    if (hoursBack !== undefined) {
      requestBody.hours_back = hoursBack;
    }

    // Include filtering takes precedence over exclude filtering
    if (includeCategories && includeCategories.length > 0) {
      requestBody.include_categories = includeCategories;
    } else {
      requestBody.exclude_categories = excludeCategories || DEFAULT_EXCLUDED_CATEGORIES;
    }
    
    // Add keyword filtering if provided
    if (keywordFilter && keywordFilter.length > 0) {
      requestBody.keyword_filter = keywordFilter;
    }
    
    if (numCards !== undefined) {
      requestBody.num_cards = numCards;
    }
    if (sortBy !== undefined) {
      requestBody.sort_by = sortBy;
    }
    if (offset !== undefined) {
      requestBody.offset = offset;
    }

    const response = await fetch(`${API_BASE_URL}/thread-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching thread cards:', error);
    throw error;
  }
};

export const FeedPage: React.FC<FeedPageProps> = ({ 
  feedId,
  title,
  description,
  initialThreads = [],
  hoursBack = 24,
  numCards = 20,
  sortBy = 'karma_density',
  excludeCategories,
  includeCategories,
  keywordFilter,
  onRefresh,
  className = ""
}) => {
  const [isClient, setIsClient] = useState(false);
  const [threads, setThreads] = useState<ThreadCardData[]>(initialThreads);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple refresh functionality
  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const freshThreads = await fetchThreadCards(
        hoursBack,
        numCards,
        sortBy,
        excludeCategories,
        10, // densityMinCommentConstant
        undefined, // offset
        includeCategories,
        keywordFilter
      );
      setThreads(freshThreads);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh feed');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Hydration-safe client detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-load if no initial threads provided
  useEffect(() => {
    if (isClient && initialThreads.length === 0) {
      refresh();
    }
  }, [isClient]);

  return (
    <div className={`min-h-full ${className}`}>
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="text-center space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="text-white/70 mt-2 text-sm sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Thread List - Debug version with explicit styles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {error && (
            <div className="bg-red-500/20 text-red-200 p-4 rounded-lg border border-red-500/30">
              Error: {error}
            </div>
          )}
          
          {isClient && threads.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {threads.map((thread, index) => (
                <div
                  key={thread.id}
                  style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-out ${Math.min(index * 0.05, 1)}s forwards`
                  }}
                >
                  <ThreadCard {...thread} minHeight="440px" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-white/70">
                {refreshing ? 'Loading threads...' : 'No threads available at the moment'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};