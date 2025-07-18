import React, { useState } from 'react';
import { ThreadSearch } from './ThreadSearch';
import { SearchArchive } from './SearchHistory';
import { SearchService } from '../../utils/searchService';

export const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchive, setShowArchive] = useState(true);


  // Handle new search
  const handleSearch = async (query: string, results: any[]) => {
    setSearchQuery(query);
    setSearchResults(results);
    // Keep archive visible alongside results
  };

  // Handle clearing search
  const handleClearSearch = async () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowArchive(true);
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Search</h2>
        <p className="text-sm text-gray-600 mt-1">
          Search conversation threads from top stories on Hacker News
        </p>
      </div>

      {/* Search Interface */}
      <div className="flex-shrink-0 p-4 border-b">
        <ThreadSearch 
          onSearch={handleSearch}
          onClear={handleClearSearch}
          initialQuery={searchQuery}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {searchResults.length > 0 ? (
          <div>
            {/* Search Results Section */}
            <div className="p-4 border-b">
              <div className="mb-2 text-sm text-gray-600">
                Found {searchResults.length} results for "{searchQuery}"
              </div>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // Handle result click using SearchService
                      if (result.anchor) {
                        SearchService.handleTagClick(result.tag, result.type, result.anchor);
                        SearchService.openThread(result.anchor);
                      }
                    }}
                  >
                    <div className="font-medium text-blue-600 hover:text-blue-800">
                      {result.tag}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {result.type} • Score: {result.score?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recent Searches Section */}
            <div className="p-4">
              <SearchArchive />
            </div>
          </div>
        ) : showArchive ? (
          <div className="p-4">
            <SearchArchive />
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm">No results found</div>
            <div className="text-xs mt-1">Try a different search term</div>
          </div>
        )}
      </div>
    </div>
  );
};