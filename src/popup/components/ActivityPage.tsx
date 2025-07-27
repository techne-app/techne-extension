import React from 'react';
import { ThreadHistory } from './ThreadHistory';
import { SearchArchive } from './SearchArchive';

export const ActivityPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          <div className="overflow-auto">
            <ThreadHistory />
          </div>
          <div className="overflow-auto">
            <SearchArchive />
          </div>
        </div>
      </div>
    </div>
  );
};