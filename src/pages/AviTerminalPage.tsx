// src/pages/AviTerminalPage.tsx
// AVI (Autonomous Vulnerability & Intelligence) AI Chatbot & Security Terminal

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Send,
  Sparkles,
  Shield,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Lock,
  Wifi,
  FileCode,
  Layers,
  ArrowRight,
  Code2,
  Trash2,
  Download,
  AlertTriangle,
  Radio,
  Sliders,
  ExternalLink,
  ChevronRight,
  Bot,
  User,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'offline_knowledge';
}

interface AviTerminalPageProps {
  onNavigateToView?: (viewId: string) => void;
}

export const AviTerminalPage: React.FC<AviTerminalPageProps> = ({ onNavigateToView }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-init',
        role: 'model',
        content: `### [AVI SECURITY RECONNAISSANCE INTELLIGENCE ONLINE]
**System Version:** \`AVI-v3.8-NeuralSecurity\`  
**Target Platform:** \`SentinelScope ASM & Penetration Testing Suite\`

Welcome, Operator. I am **AVI**, your autonomous vulnerability intelligence copilot and technical security researcher.

I provide technical protocol deconstructions, vulnerability mechanics, defensive architecture, and guidance on utilizing SentinelScope's security toolchains.

#### Quick Commands & Inquiries:
- \`/deauth\` : 802.11 Wireless Deauthentication protocol mechanics, frame spoofing & 802.11w PMF defense
- \`/tools\` : Complete guide to Repeater, Intruder, Crypto Lab, and Recon Pipelines
- \`/crypto\` : Cryptographic ciphers (AES-GCM, RSA, HMAC) and Steganography analysis
- \`/fuzz\` : Parameter fuzzing and API payload strategies
- Or type any technical cybersecurity question below.`,
        timestamp: new Date().toLocaleTimeString(),
        source: 'offline_knowledge',
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [engineStatus, setEngineStatus] = useState<{
    engine: string;
    hasKey: boolean;
  }>({ engine: 'Detecting...', hasKey: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/avi/status')
      .then((res) => res.json())
      .then((data) => {
        setEngineStatus({
          engine: data.engine || 'Autonomous Security Intelligence Engine',
          hasKey: data.hasKey ?? true,
        });
      })
      .catch(() => {
        setEngineStatus({
          engine: 'Autonomous Security Intelligence Engine',
          hasKey: false,
        });
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputQuery).trim();
    if (!prompt || isLoading) return;

    // Handle instant CLI commands
    if (prompt === '/clear' || prompt === 'clear') {
      setMessages([]);
      setInputQuery('');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-usr`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Map history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/avi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now()}-avi`,
        role: 'model',
        content: data.text || 'No response generated.',
        timestamp: new Date().toLocaleTimeString(),
        source: data.source,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        content: `**[!] Terminal Execution Error:** ${err?.message || 'Failed to process prompt.'}\n\nPlease check network connectivity or try a built-in command like \`/deauth\` or \`/tools\`.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTerminalLog = () => {
    const log = messages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'OPERATOR' : 'AVI'}:\n${m.content}\n----------------------------------------`)
      .join('\n\n');
    const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AVI_Terminal_Session_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render markdown helper
  const renderMarkdown = (content: string) => {
    // Simple line-based parser with code block detection
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${idx}`} className="my-2.5 rounded-lg bg-slate-950 border border-slate-800/90 overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Code2 className="w-3 h-3" />
                  Code / Protocol Frame Dump
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeBuffer.join('\n'))}
                  className="hover:text-slate-200 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="p-3 text-cyan-300 overflow-x-auto leading-relaxed whitespace-pre font-mono text-[11px]">
                {codeBuffer.join('\n')}
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBuffer = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm font-bold text-cyan-400 font-mono mt-3 mb-1.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="text-xs font-bold text-slate-200 font-mono mt-2.5 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={idx} className="text-xs text-slate-300 font-mono ml-4 list-disc my-0.5 leading-relaxed">
            {renderInlineFormatting(line.replace('- ', ''))}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={idx} className="h-1.5" />);
      } else {
        elements.push(
          <p key={idx} className="text-xs text-slate-300 font-mono my-1 leading-relaxed">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <pre key="code-end" className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto my-2">
          {codeBuffer.join('\n')}
        </pre>
      );
    }

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Bold **text** and code `text`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-slate-100 font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 text-[11px] font-mono mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 font-mono">
                  AVI SECURITY AI TERMINAL
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono uppercase font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Assistant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous Vulnerability & Intelligence Copilot • Protocol Mechanics, Wireless Deauthentication, Fuzzing & Security Tools Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">{engineStatus.engine}</span>
          </div>

          <button
            onClick={handleExportTerminalLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>

          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Terminal Screen (3 cols) */}
        <div className="lg:col-span-3 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[680px]">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 select-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono font-semibold text-slate-300 ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                avi-copilot: ~/security-copilot
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="hidden sm:inline-block text-slate-500">Session ID:</span>
              <span className="text-cyan-400">SEC-OP-{Date.now().toString(36).toUpperCase()}</span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1.5 ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      {isUser ? (
                        <>
                          <User className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-400 font-semibold">Operator</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">AVI Intelligence</span>
                          {msg.source && (
                            <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400">
                              {msg.source === 'gemini' ? 'Neural Copilot' : 'Knowledge Matrix'}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <span>• {msg.timestamp}</span>

                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="hover:text-slate-300 transition ml-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div
                    className={`max-w-[90%] rounded-xl p-4 leading-relaxed border ${
                      isUser
                        ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                        : 'bg-slate-900/90 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-cyan-400 text-xs font-mono animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>AVI is computing protocol mechanics & analyzing threat surface...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Command Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <span className="text-cyan-400 font-mono font-bold text-xs pl-2 select-none">
              avi-copilot:~$
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask AVI about Wi-Fi deauth, API fuzzing, cryptography, or platform tools..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>

        {/* Quick Commands & Tool Bridges Sidebar */}
        <div className="space-y-4">
          {/* Quick Query Prompts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Knowledge Prompts
              </span>
            </div>

            <div className="space-y-2">
              {[
                {
                  label: '📶 802.11 Deauth Protocol',
                  query: 'Explain how 802.11 Wi-Fi deauthentication attacks work at the frame level, how 4-way handshakes are captured, and how 802.11w PMF defends against it.',
                  icon: Wifi,
                },
                {
                  label: '🛠️ Using SentinelScope Tools',
                  query: 'How do I use SentinelScope tools like HTTP Repeater, Intruder, and Crypto Lab to perform a comprehensive vulnerability assessment?',
                  icon: Sliders,
                },
                {
                  label: '🔐 AES-256-GCM vs CBC',
                  query: 'What is the security difference between AES-GCM (Authenticated Encryption) and AES-CBC, and how does the Crypto Lab implement both?',
                  icon: Lock,
                },
                {
                  label: '🖼️ Steganography Detection',
                  query: 'How does LSB image steganography work, and how can Shannon entropy and bit-plane inspection reveal hidden payloads?',
                  icon: Code2,
                },
                {
                  label: '⚡ API Parameter Fuzzing',
                  query: 'What are the best strategies for HTTP Intruder fuzzing (Sniper vs ClusterBomb) when testing authentication endpoints for IDOR and SQLi?',
                  icon: Zap,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 transition group flex flex-col gap-1"
                  >
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        {item.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Platform Navigation Links */}
          {onNavigateToView && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Launch Security Toolchain
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'repeater', name: 'HTTP Repeater', icon: Terminal },
                  { id: 'intruder', name: 'HTTP Intruder', icon: Zap },
                  { id: 'crypto-stego', name: 'Crypto & Stego', icon: Lock },
                  { id: 'traffic', name: 'Live Interceptor', icon: Radio },
                  { id: 'discovery', name: 'Attack Surface', icon: Shield },
                  { id: 'graph', name: 'Risk Graph', icon: Layers },
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => onNavigateToView(tool.id)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition flex items-center gap-2 text-slate-300 hover:text-cyan-300 text-left"
                    >
                      <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-semibold truncate">{tool.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Security Protocols Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              AVI Ethics & Scope Mandate
            </div>
            <p className="text-slate-400 leading-normal">
              AVI provides authoritative technical analysis for authorized security audits, penetration testing, and defensive hardening. All findings must be conducted within verified engagement scope.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
