import React from 'react';
import { ThreadHistory } from './ThreadHistory';
import { SearchArchive } from './SearchArchive';
import { ConversationHistory } from './ConversationHistory';

interface ActivityPageProps {
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  activeConversationId,
  onSelectConversation,
  onDeleteConversation
}) => {
  return (
    <div 
      className="h-full flex flex-col"
      style={{ 
        fontFamily: 'var(--font-sans)',
        backgroundColor: 'var(--dark-bg)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-full p-4">
          <div className="overflow-auto">
            <ConversationHistory 
              activeConversationId={activeConversationId}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={onDeleteConversation}
            />
          </div>
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