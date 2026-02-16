
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  History, 
  Trash2, 
  LayoutDashboard, 
  BrainCircuit, 
  Search, 
  ExternalLink,
  Loader2,
  Menu,
  X,
  Zap,
  Ghost,
  Shuffle,
  Dices,
  Command,
  Eye,
  ShieldAlert,
  Clock,
  Globe,
  Palette
} from 'lucide-react';
import { Message, Session, GroundingChunk } from './types';
import { geminiService } from './services/geminiService';
import { WELCOME_MESSAGE } from './constants';
import MarkdownRenderer from './components/MarkdownRenderer';

const QUICK_COMMANDS = [
  { label: 'Wild Mode', cmd: 'wild mode', icon: <Zap className="w-3 h-3" /> },
  { label: 'Pattern Hunt', cmd: 'pattern hunt', icon: <Eye className="w-3 h-3" /> },
  { label: 'Bias Check', cmd: 'bias check #1', icon: <ShieldAlert className="w-3 h-3" /> },
  { label: 'Future Scan', cmd: 'future-scan #1 2050', icon: <Clock className="w-3 h-3" /> },
  { label: 'World Shift', cmd: 'world: post-scarcity', icon: <Globe className="w-3 h-3" /> },
  { label: 'Mood Board', cmd: 'mood board current', icon: <Palette className="w-3 h-3" /> },
  { label: 'Casino', cmd: 'constraint casino', icon: <Dices className="w-3 h-3" /> },
];

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('brainstorm_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    localStorage.setItem('brainstorm_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, isLoading]);

  const startNewSession = (initialTopic?: string) => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: initialTopic || "New Brainstorm",
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: Date.now()
      }],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (sessions.length === 0) {
      startNewSession();
    } else if (!currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, []);

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || !currentSessionId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now()
    };

    const updatedMessages = [...(currentSession?.messages || []), userMessage];
    
    const firstUserMsg = updatedMessages.find(m => m.role === 'user');
    const newTitle = firstUserMsg ? (firstUserMsg.content.length > 30 ? firstUserMsg.content.substring(0, 30) + '...' : firstUserMsg.content) : currentSession?.title;

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages, title: newTitle || s.title, updatedAt: Date.now() } 
        : s
    ));
    setInput('');
    setIsLoading(true);

    try {
      const { text, groundingLinks } = await geminiService.generateResponse(updatedMessages);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
        groundingLinks
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: Date.now() } 
          : s
      ));
    } catch (error) {
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: "Oops! My creative gears jammed for a second. Could you try sending that again? ⚡",
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, errorMessage] } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 glass flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight">BrainstormFlow</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={() => startNewSession()}
          className="m-4 p-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl flex items-center justify-center gap-2 font-medium shadow-md shadow-indigo-900/40"
        >
          <Plus className="w-4 h-4" />
          New Brainstorm
        </button>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <History className="w-3 h-3" />
            Brainstorm History
          </div>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full text-left px-3 py-3 rounded-lg flex items-center justify-between group transition-all
                ${currentSessionId === session.id ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/50' : 'hover:bg-white/5 text-slate-400'}
              `}
            >
              <span className="truncate flex-1 pr-2">{session.title}</span>
              <Trash2 
                onClick={(e) => deleteSession(session.id, e)}
                className={`w-4 h-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity`} 
              />
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-sm italic">
              Ideas await...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
          2026 FUTURISTIC LAYER ACTIVE
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 glass flex items-center justify-between px-4 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="font-display font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
                {currentSession?.title || "Welcome"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-wide">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
               CO-CREATION SYNC
             </div>
             <LayoutDashboard className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-200" title="Visual Board View" />
          </div>
        </header>

        {/* Message Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scroll-smooth"
        >
          {currentSession?.messages.map((msg, idx) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[90%] lg:max-w-[80%] rounded-2xl p-5 lg:p-6
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'glass text-slate-200 border border-white/10'}
              `}>
                <div className="flex items-start gap-3 mb-2">
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                </div>

                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-2">
                      <Search className="w-3 h-3 text-indigo-400" />
                      Multimodal Brain-Sync
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingLinks.map((chunk, i) => chunk.web && (
                        <a 
                          key={i} 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 transition-all hover:scale-105"
                        >
                          <span className="truncate max-w-[150px]">{chunk.web.title || chunk.web.uri}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass p-5 rounded-2xl flex items-center gap-4 text-slate-400 border border-indigo-500/20 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-sm font-medium">Detecting hidden patterns...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-8 shrink-0 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Quick Commands Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-hide">
              <div className="flex items-center gap-2 shrink-0 px-2 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Command className="w-3 h-3" />
                2026
              </div>
              {QUICK_COMMANDS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.cmd)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 glass hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-slate-400 hover:text-white transition-all hover:border-indigo-500/50"
                >
                  {q.icon}
                  {q.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Throw an idea, a mood, or a futuristic command..."
                className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-6 py-5 pr-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 resize-none glass placeholder-slate-600 min-h-[64px] max-h-48 overflow-y-auto text-lg transition-all"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className={`
                  absolute right-3 bottom-3.5 p-3 rounded-xl transition-all
                  ${isLoading || !input.trim() 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 hover:scale-105 active:scale-95'}
                `}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
            
            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-black italic">
                BrainstormFlow 2.0 // Futuristic Sync Active
              </p>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
                <span className="hover:text-indigo-400 cursor-pointer flex items-center gap-1" onClick={() => handleSend("pattern hunt")}>
                  <Eye className="w-2 h-2" /> Pattern Hunter
                </span>
                <span className="hover:text-indigo-400 cursor-pointer flex items-center gap-1" onClick={() => handleSend("game on")}>
                  <Zap className="w-2 h-2" /> Sprint Mode
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .scroll-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
