import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 p-4 bg-slate-50 border border-slate-100 rounded-3xl max-w-[120px] shadow-sm shadow-slate-100/40">
      <div className="flex space-x-1 items-center justify-center py-1">
        <div className="h-2 w-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="h-2 w-2 bg-amber-500/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="h-2 w-2 bg-amber-500/60 rounded-full animate-bounce" />
      </div>
    </div>
  );
};
