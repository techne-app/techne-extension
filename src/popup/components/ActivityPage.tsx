import React from 'react';
import { ThreadHistory } from './ThreadHistory';

export const ActivityPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Activity</h2>
        <p className="text-sm text-gray-600 mt-1">
          Tags and threads you've interacted with
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <ThreadHistory />
      </div>
    </div>
  );
};