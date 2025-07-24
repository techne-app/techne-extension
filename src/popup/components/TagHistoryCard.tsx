import React from 'react';

interface TagHistoryCardProps {
  tag: string;
  type: string;
  anchor: string;
  timestamp?: number;
  score?: number;
  onThreadClick?: () => void;
}

export const TagHistoryCard: React.FC<TagHistoryCardProps> = ({
  tag,
  type,
  anchor,
  timestamp,
  score,
  onThreadClick
}) => {
  // Format timestamp to locale string if it exists
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Format score as percentage if it exists
  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="border p-3 rounded">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium">{tag}</span>
          {timestamp && (
            <div className="text-sm text-gray-500">
              Visited: {formatDate(timestamp)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          {score !== undefined && (
            <span className="text-green-600 font-medium">
              {formatScore(score)} match
            </span>
          )}
          <a 
            href={anchor} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm"
            onClick={onThreadClick}
          >
            Go to thread
          </a>
        </div>
      </div>
    </div>
  );
}; 