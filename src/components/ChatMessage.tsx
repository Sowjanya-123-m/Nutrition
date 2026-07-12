import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Sparkles, User } from 'lucide-react';

interface ChatMessageProps {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, timestamp }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const isAi = sender === 'ai';

  return (
    <div className={`flex w-full gap-3 ${isAi ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in`}>
      {/* Bot Avatar */}
      {isAi && (
        <div className="h-10 w-10 shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/10 border border-amber-300/30">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Message Bubble Wrapper */}
      <div className="flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1">
        <div
          className={`px-5 py-4 rounded-3xl relative group transition-all ${
            isAi
              ? 'bg-white text-slate-800 border border-slate-100 shadow-md shadow-slate-100/40 rounded-tl-none'
              : 'bg-amber-500 text-white shadow-md shadow-amber-500/15 rounded-tr-none'
          }`}
        >
          {/* Markdown Content */}
          <div className="markdown-body text-sm select-text">
            {isAi ? (
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => <h1 className="text-lg font-bold mt-3 mb-2 text-slate-900 border-b border-slate-100 pb-1 font-display" {...props} />,
                  h2: ({ ...props }) => <h2 className="text-md font-bold mt-3 mb-1.5 text-slate-800 font-display" {...props} />,
                  h3: ({ ...props }) => <h3 className="text-sm font-bold mt-2.5 mb-1 text-slate-800" {...props} />,
                  p: ({ ...props }) => <p className="leading-relaxed mb-2 text-slate-700 text-sm" {...props} />,
                  ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-slate-700 text-sm" {...props} />,
                  ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-slate-700 text-sm" {...props} />,
                  li: ({ ...props }) => <li className="mb-0.5 leading-relaxed" {...props} />,
                  strong: ({ ...props }) => <strong className="font-bold text-slate-900 bg-amber-500/5 px-1 py-0.5 rounded" {...props} />,
                  code: ({ ...props }) => <code className="bg-slate-50 px-1.5 py-0.5 rounded font-mono text-xs text-amber-600 border border-slate-100" {...props} />,
                  blockquote: ({ ...props }) => <blockquote className="border-l-4 border-amber-500 pl-3 italic text-slate-500 my-2" {...props} />,
                }}
              >
                {text}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
            )}
          </div>

          {/* Actions & Timestamp row inside bubble */}
          <div className="flex items-center justify-between gap-4 mt-3 border-t border-slate-100/10 pt-1.5">
            <span className={`text-[10px] font-mono ${isAi ? 'text-slate-400' : 'text-amber-100'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {isAi && (
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-50 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Copy response to clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Avatar */}
      {!isAi && (
        <div className="h-10 w-10 shrink-0 bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-300/20 shadow-sm">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
