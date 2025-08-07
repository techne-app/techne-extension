import React from 'react';

interface MemoryCardProps {
  title: string;
  subtitle?: string;
  timestamp: string;
  isActive?: boolean;
  onPrimaryAction?: () => void;
  onDelete?: () => void;
  primaryActionLabel?: string;
  href?: string;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  title,
  subtitle,
  timestamp,
  isActive = false,
  onPrimaryAction,
  onDelete,
  primaryActionLabel = 'Open',
  href
}) => {
  return (
    <div
      className="group relative p-3 rounded-lg transition-colors"
      style={{
        backgroundColor: 'var(--dark-card)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isActive ? 'var(--hn-blue)' : 'var(--hn-border)',
        boxShadow: isActive ? '0 0 0 2px rgba(0, 102, 204, 0.2)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--dark-bg)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--dark-card)';
        }
      }}
    >
      <div className="flex flex-col h-full">
        {/* Main content area */}
        <div className="flex-1">
          <div 
            className="font-medium truncate"
            style={{ 
              color: 'var(--text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {title}
          </div>
          
          {subtitle && (
            <div 
              className="text-sm truncate mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </div>
          )}
          
          <div 
            className="text-sm mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {timestamp}
          </div>
        </div>
        
        {/* Bottom actions area */}
        <div className="flex items-center justify-between mt-3">
          <div>
            {(onPrimaryAction || href) && (
              href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--hn-blue)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0052a3'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hn-blue)'}
                >
                  {primaryActionLabel}
                </a>
              ) : (
                <button
                  onClick={onPrimaryAction}
                  className="text-sm transition-colors"
                  style={{ color: 'var(--hn-blue)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0052a3'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hn-blue)'}
                >
                  {primaryActionLabel}
                </button>
              )
            )}
          </div>
          
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                title="Delete"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hn-border)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};