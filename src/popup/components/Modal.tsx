import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-hidden"
        style={{ 
          backgroundColor: 'var(--dark-bg)',
          fontFamily: 'var(--font-sans)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--hn-border)' }}
        >
          <h2 
            className="text-lg font-semibold"
            style={{ 
              color: 'var(--text-primary)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--letter-spacing-tight)'
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--dark-card)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div 
          className="p-0 overflow-y-auto h-[calc(80vh-4rem)]"
          style={{ 
            backgroundColor: 'var(--dark-bg)',
            color: 'var(--text-primary)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};