import React from 'react';
import { createRoot } from 'react-dom/client';
import { VectorViewer } from './components/VectorViewer';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<VectorViewer />);
}