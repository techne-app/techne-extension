import React from 'react';
import { TagMatch } from '../../utils/searchService';
import { SearchService } from '../../utils/searchService';

interface SearchResultMessageProps {
  query: string;
  matches: TagMatch[];
  error?: string;
}

export const SearchResultMessage: React.FC<SearchResultMessageProps> = ({ 
  query, 
  matches, 
  error 
}) => {
  const handleTagClick = (match: TagMatch) => {
    // Handle analytics
    SearchService.handleTagClick(match.tag, match.type, match.anchor);
    
    // Open thread
    SearchService.openThread(match.anchor);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-2">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-700 font-medium">Search Error</span>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-gray-700 font-medium">No Results Found</span>
        </div>
        <p className="text-gray-600 text-sm">
          I couldn't find any discussions about "{query}" in the recent top stories. 
          Try a different search term or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-2">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-blue-700 font-medium">
          Found {matches.length} discussion{matches.length !== 1 ? 's' : ''} about "{query}"
        </span>
      </div>
      
      <div className="space-y-2">
        {matches.slice(0, 5).map((match, index) => (
          <div
            key={index}
            className="bg-white border border-blue-100 rounded-md p-3 hover:bg-blue-25 cursor-pointer transition-colors"
            onClick={() => handleTagClick(match)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-blue-700 font-medium hover:text-blue-800 mb-1">
                  {match.tag}
                </div>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {match.type}
                  </span>
                  <span>•</span>
                  <span>
                    Score: {match.score.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="ml-2 flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </div>
        ))}
        
        {matches.length > 5 && (
          <div className="text-center text-sm text-gray-500 mt-2">
            ... and {matches.length - 5} more result{matches.length - 5 !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Click any discussion to open it in a new tab
      </div>
    </div>
  );
};