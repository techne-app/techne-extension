import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";

// ThreadCard data interface (matching the shared component)
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

// Enhanced interface with height options
interface ThreadCardProps extends ThreadCardData {
  gradient?: string;
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

// Simple local Card component
const Card: React.FC<{ 
  className?: string; 
  style?: React.CSSProperties; 
  children: React.ReactNode 
}> = ({ className = "", style = {}, children }) => (
  <div className={className} style={style}>
    {children}
  </div>
);

// Simple local Tag component matching HN styling
const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span 
    style={{
      backgroundColor: 'var(--hn-orange)',
      color: 'var(--tag-text)',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}
  >
    {label}
  </span>
);

export const ThreadCard: React.FC<ThreadCardProps> = ({ 
  comment_count,
  theme,
  category,
  story_title,
  story_url,
  anchor,
  summary,
  updated_at,
  gradient,
  height,
  minHeight,
  maxHeight,
  className = "",
  style = {}
}) => {
  // Track comment count changes for animation
  const [previousCount, setPreviousCount] = useState(comment_count);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect comment count changes and trigger animation
  useEffect(() => {
    if (comment_count !== previousCount && previousCount !== 0) {
      const countIncreased = comment_count > previousCount;
      
      if (countIncreased) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Trigger animations
        setIsAnimating(true);
        
        // Reset animations after duration
        timeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 2000);
      }
    }
    setPreviousCount(comment_count);
  }, [comment_count, previousCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    // Ensure timestamp is treated as UTC by appending 'Z' if not present
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    const past = new Date(utcTimestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Combine height-related styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    border: '1px solid var(--card-border)',
    height,
    minHeight,
    maxHeight,
    ...style
  };

  return (
    <Card 
      className={`w-full h-full rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
        isAnimating ? 'animate-subtle-glow' : ''
      } ${className}`}
      style={cardStyle}
    >
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          {/* Header: Category and Time */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <Tag label={category} />
            <span className="text-xs" style={{ color: 'var(--meta-text)' }}>{formatTimeAgo(updated_at)}</span>
          </div>
          
          {/* Divider */}
          <div className="border-b mb-3" style={{ borderColor: 'var(--card-border)' }}></div>
          
          {/* Theme Title */}
          <div className="mb-3 text-center">
            <h2 className="text-base font-semibold leading-tight" style={{ color: 'var(--hn-orange)' }}>
              {theme}
            </h2>
          </div>

          {/* Summary */}
          <div className="flex-1 mb-4">
            <p 
              className="text-sm leading-6 line-clamp-7 text-center"
              style={{ 
                color: 'var(--card-text)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {summary}
            </p>
          </div>

          {/* Metrics Row */}
          <div className="mb-3 flex justify-center text-xs font-mono">
            <a
              href={anchor}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
              style={{ color: 'var(--link-color)' }}
            >
              <MessageCircle 
                className={`w-3 h-3 transition-all duration-500 ${
                  isAnimating ? 'animate-pulse' : ''
                }`} 
                style={{ 
                  color: isAnimating ? 'var(--hn-orange)' : 'inherit'
                }}
              />
              <span 
                className={`transition-all duration-500 ${
                  isAnimating ? 'font-medium bg-orange-50/50 px-1 rounded-sm' : ''
                }`}
                style={{
                  color: isAnimating ? 'var(--hn-orange)' : 'inherit'
                }}
              >
                Join the thread - {comment_count} comments
              </span>
            </a>
          </div>

          {/* Divider */}
          <div className="border-b mb-3" style={{ borderColor: 'var(--card-border)' }}></div>
        </div>

        {/* Source Story - Fixed to bottom with consistent spacing */}
        <div className="flex-none text-center">
          <a
            href={story_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline inline-flex items-start gap-1 leading-tight line-clamp-2"
            style={{ color: 'var(--link-color)' }}
          >
            🔗 <span className="line-clamp-2">{story_title}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--meta-text)' }} />
          </a>
        </div>
      </div>
    </Card>
  );
};