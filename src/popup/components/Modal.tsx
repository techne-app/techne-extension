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
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-hidden modal-dialog">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b modal-header">
          <h2 className="text-lg font-semibold modal-title">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors modal-button-secondary"
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
        <div className="p-0 overflow-y-auto h-[calc(80vh-4rem)] modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};