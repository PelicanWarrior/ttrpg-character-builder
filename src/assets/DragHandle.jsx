import React from 'react';

export function DragHandle() {
  return (
    <span className="cursor-move px-2 text-gray-400 hover:text-gray-600" title="Drag to reorder">
      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
        <circle cx="4" cy="4" r="1.5" fill="currentColor" />
        <circle cx="4" cy="8" r="1.5" fill="currentColor" />
        <circle cx="4" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="4" r="1.5" fill="currentColor" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}
