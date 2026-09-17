// src/components/AviFloatingTerminal.tsx
// Persistent Floating AVI AI Chatbot & Security Assistant Widget

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Wifi,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface AviFloatingTerminalProps {
  onOpenFullTerminal: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AviFloatingTerminal: React.FC<AviFloatingTerminalProps> = ({
  onOpenFullTerminal,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<
    Array<{ id: string; role: 'user' | 'model'; content: string; timestamp: string }>
  >([
    {
      id: 'init-floating',
      role: 'model',
      content:
        '**AVI Online.** Ready for protocol analysis, security questions, or platform navigation.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const prompt = (customPrompt || input).trim();
    if (!prompt || isLoading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user' as const,
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/avi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `avi-${Date.now()}`,
          role: 'model',
          content: data.text || 'No response.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `Execution error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-slate-950 font-bold font-mono text-xs shadow-2xl shadow-cyan-500/30 border border-cyan-400/40 hover:scale-105 transition-all cursor-pointer group"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-cyan-700 animate-pulse" />
        </div>
        <span className="text-slate-950 font-bold tracking-wide">Ask AVI Copilot</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <span>AVI SECURITY COPILOT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-400">AI Intelligence Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFullTerminal}
            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition"
            title="Expand to Full Terminal Page"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
            title="Minimize"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Pill Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto text-[10px]">
        <button
          onClick={() => handleSend('Explain Wi-Fi deauth frame mechanics and PMF defense')}
          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 shrink-0"
        >
          📶 Wi-Fi Deauth
        </button>
        <button
          onClick={() => handleSend('How do I use SentinelScope Repeater and Intruder?')}
          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 shrink-0"
        >
          🛠️ Platform Tools
        </button>
        <button
          onClick={() => handleSend('Explain AES-GCM encryption & LSB steganography')}
          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 shrink-0"
        >
          🔐 Crypto & Stego
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col space-y-1 ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <span className="text-[9px] text-slate-500 px-1">
              {m.role === 'user' ? 'Operator' : 'AVI'} • {m.timestamp}
            </span>
            <div
              className={`p-2.5 rounded-xl max-w-[90%] text-[11px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-200'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>AVI analyzing query...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AVI about hacking & tools..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
