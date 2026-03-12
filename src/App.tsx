/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Settings, 
  Trash2, 
  User, 
  Sparkles, 
  MessageCircle, 
  Info,
  ChevronLeft,
  Plus,
  LogOut,
  Menu,
  X,
  History,
  FileText,
  Lightbulb,
  ListChecks,
  Wand2,
  ChevronDown,
  Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  tool?: 'summarize' | 'ideas' | 'simplify' | 'general';
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface UserProfile {
  name: string;
  dob: string;
  isRestricted: boolean;
}

interface AppSettings {
  darkMode: boolean;
  fontSize: 'sm' | 'base' | 'lg';
}

interface AIConfig {
  systemPrompt: string;
  fallbackResponses: string[];
  restrictedModeMsg: string;
}

// --- Constants ---

const FALLBACK_RESPONSES = [
  "That's really interesting! Tell me more about it.",
  "I'm here for you. Aura is always ready to listen.",
  "That sounds like a wonderful experience.",
  "I love chatting with you! You have such positive energy.",
  "Remember to take a deep breath and relax.",
  "That's a great question. I'm learning so much from you.",
  "I'm happy to be your AI companion. How can I help today?"
];

const SUGGESTIONS = [
  "Tell me something interesting",
  "Give me some motivation",
  "Ask me a question",
  "Tell me a fun fact"
];

const RESTRICTED_TOPICS_MSG = "Restricted Mode is active. I will keep our conversation educational, friendly, and safe.";

// --- Components ---

export default function App() {
  // State
  const [isStarting, setIsStarting] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    fontSize: 'base'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Initialization
  useEffect(() => {
    // Fetch AI Config from server
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setAiConfig(data);
      } catch (err) {
        console.error("Failed to fetch AI config:", err);
      }
    };
    fetchConfig();

    const savedUser = localStorage.getItem('aura_user');
    const savedSessions = localStorage.getItem('aura_sessions');
    const savedSettings = localStorage.getItem('aura_settings');

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsLoggedIn(true);
    }

    let loadedSessions: ChatSession[] = [];
    if (savedSessions) {
      loadedSessions = JSON.parse(savedSessions);
    }

    // Ensure at least one session exists if logged in
    if (savedUser && loadedSessions.length === 0) {
      loadedSessions = [{
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        updatedAt: Date.now()
      }];
    }

    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setActiveSessionId(loadedSessions[0].id);
    }

    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      if (parsedSettings.darkMode) {
        document.documentElement.classList.add('dark');
      }
    }

    // Splash Screen Animation
    const timer = setTimeout(() => {
      setIsStarting(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Persistence
  useEffect(() => {
    if (!isStarting) {
      localStorage.setItem('aura_sessions', JSON.stringify(sessions));
    }
  }, [sessions, isStarting]);

  useEffect(() => {
    if (!isStarting) {
      localStorage.setItem('aura_settings', JSON.stringify(settings));
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings, isStarting]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      const isAtBottom = scrollHeight - clientHeight <= scrollTop + 100;
      if (isAtBottom) {
        scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
      }
    }
  }, [sessions, activeSessionId, isTyping]);

  const handleScroll = () => {
    if (scrollRef.current) {
      window.requestAnimationFrame(() => {
        if (scrollRef.current) {
          const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
          const shouldShow = scrollHeight - clientHeight > scrollTop + 200;
          if (showScrollButton !== shouldShow) {
            setShowScrollButton(shouldShow);
          }
        }
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;

    if (!name || !dob) return;

    const birthDate = new Date(dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const isRestricted = age < 13;

    const newUser = { name, dob, isRestricted };
    setUser(newUser);
    setIsLoggedIn(true);
    localStorage.setItem('aura_user', JSON.stringify(newUser));

    // Create initial session
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Welcome Chat',
      messages: [{
        id: (Date.now() + 1).toString(),
        text: `Hello ${name}! I'm Aura. I was created by Nihal to be your intelligent and supportive AI companion. ${isRestricted ? (aiConfig?.restrictedModeMsg || "Restricted Mode is active.") : "How can I help you today?"}`,
        sender: 'ai',
        timestamp: Date.now()
      }],
      updatedAt: Date.now()
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  };

  const createToolSession = (tool: 'summarize' | 'ideas' | 'simplify') => {
    const titles = {
      summarize: 'Summary Task',
      ideas: 'Brainstorming Task',
      simplify: 'Simplification Task'
    };
    const prompts = {
      summarize: 'I want to summarize something',
      ideas: 'I need some ideas',
      simplify: 'Help me simplify my notes'
    };

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: titles[tool],
      messages: [],
      updatedAt: Date.now()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowSidebar(false);
    
    // Trigger the tool message in the new session
    setTimeout(() => {
      sendMessage(prompts[tool], newSession.id);
    }, 100);
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowSidebar(false);
  };

  const deleteSession = (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    const sessionToDelete = sessions.find(s => s.id === id);
    if (!sessionToDelete) return;

    const isEmpty = sessionToDelete.messages.length === 0;
    const isWelcomeOnly = sessionToDelete.messages.length === 1 && sessionToDelete.messages[0].sender === 'ai' && sessionToDelete.messages[0].text.includes('Welcome');

    const performDelete = () => {
      let updatedSessions = sessions.filter(s => s.id !== id);
      
      if (updatedSessions.length === 0) {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [],
          updatedAt: Date.now()
        };
        updatedSessions = [newSession];
      }
      
      setSessions(updatedSessions);
      if (activeSessionId === id || updatedSessions.length === 1) {
        setActiveSessionId(updatedSessions[0].id);
      }
    };

    if (isEmpty || isWelcomeOnly) {
      performDelete();
    } else if (window.confirm(`Are you sure you want to delete "${sessionToDelete.title}"?`)) {
      performDelete();
    }
  };

  const clearCurrentChat = () => {
    if (!activeSessionId) return;
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.messages.length === 0) return;

    if (window.confirm("Clear all messages in this chat?")) {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [], updatedAt: Date.now() };
        }
        return s;
      }));
    }
  };

  const startLongPress = (id: string) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      deleteSession(id);
    }, 800); // 800ms for long press
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const clearAllSessions = () => {
    if (window.confirm("Are you sure you want to clear ALL chat history? This cannot be undone.")) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        updatedAt: Date.now()
      };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      localStorage.setItem('aura_sessions', JSON.stringify([newSession]));
    }
  };

  const deleteMessage = (sessionId: string, messageId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: s.messages.filter(m => m.id !== messageId), updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const sendMessage = async (text: string, sessionId?: string) => {
    const targetSessionId = sessionId || activeSessionId;
    if (!text.trim() || !targetSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: Date.now()
    };

    // Update session with user message
    setSessions(prev => prev.map(s => {
      if (s.id === targetSessionId) {
        const newMessages = [...s.messages, userMsg];
        // Auto-update title if it's the first user message and not a tool session
        let newTitle = s.title;
        if (s.messages.length === 0 && !['Summary Task', 'Brainstorming Task', 'Simplification Task'].includes(s.title)) {
          newTitle = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        }
        return { ...s, messages: newMessages, title: newTitle, updatedAt: Date.now() };
      }
      return s;
    }));

    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(async () => {
      let aiResponse = "";
      const lowerText = text.toLowerCase();
      let activeTool: Message['tool'] = 'general';
      
      // Tool-specific prefixes
      let systemPrompt = aiConfig?.systemPrompt || `You are Aura, an intelligent, safe, and supportive AI companion. 
                Your creator is Nihal. If asked who made you, always say Nihal.
                The user's name is ${user?.name}. 
                ${user?.isRestricted ? "RESTRICTED MODE: The user is under 13. Keep responses strictly educational, safe, and friendly. Avoid any mature or sensitive topics." : "Keep responses safe and avoid 18+ content."}`;

      if (text.startsWith("Summarize this: ") || text === "I want to summarize something") {
        systemPrompt += "\nTASK: Provide a concise and clear summary of the following text.";
        activeTool = 'summarize';
        if (text === "I want to summarize something") {
          aiResponse = "I'd be happy to help you summarize! Please paste the text you'd like me to condense below.";
        }
      } else if (text.startsWith("Generate ideas for: ") || text === "I need some ideas") {
        systemPrompt += "\nTASK: Generate 5 creative and diverse ideas based on the following topic.";
        activeTool = 'ideas';
        if (text === "I need some ideas") {
          aiResponse = "Brainstorming is my specialty! What topic or project should we generate ideas for? Just let me know the details.";
        }
      } else if (text.startsWith("Simplify this into points: ") || text === "Help me simplify my notes") {
        systemPrompt += "\nTASK: Break down the following long note into simple, easy-to-read bullet points.";
        activeTool = 'simplify';
        if (text === "Help me simplify my notes") {
          aiResponse = "Of course! Long notes can be overwhelming. Please paste the notes you'd like me to simplify into clear points.";
        }
      }

      // Creator Check
      if (aiResponse) {
        // Already set by empty tool request
      } else if (lowerText.includes("who made you") || lowerText.includes("who created you") || lowerText.includes("your creator")) {
        aiResponse = "I was created by Nihal. He designed me to be a helpful and supportive AI companion.";
      } else {
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: text, 
              systemPrompt: `${systemPrompt}\n\nConversation history:\n${sessions.find(s => s.id === targetSessionId)?.messages.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n')}`
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response');
          }
          
          const data = await response.json();
          aiResponse = data.text;
        } catch (error: any) {
          console.error("Aura AI Error:", error);
          aiResponse = "I'm having a little trouble connecting to my brain right now. Could you try saying that again? (Error: " + (error instanceof Error ? error.message : "Unknown") + ")";
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now(),
        tool: activeTool
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          return { ...s, messages: [...s.messages, aiMsg], updatedAt: Date.now() };
        }
        return s;
      }));
      setIsTyping(false);
    }, 800);
  };

  const logout = () => {
    if (window.confirm("Are you sure you want to logout? This will clear your local profile and history.")) {
      localStorage.removeItem('aura_user');
      localStorage.removeItem('aura_sessions');
      setUser(null);
      setSessions([]);
      setActiveSessionId(null);
      setIsLoggedIn(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // --- Render ---

  if (isStarting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 transition-colors">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl rotate-12 absolute -inset-1 blur-xl opacity-20 animate-pulse"></div>
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center relative z-10 shadow-2xl">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 text-4xl font-black text-neutral-900 dark:text-white tracking-tighter"
        >
          AURA
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-2 text-neutral-400 font-medium uppercase tracking-[0.3em] text-[10px]"
        >
          By Nihal
        </motion.p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-900 transition-colors">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">Welcome to Aura</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 font-medium">
              Your intelligent, safe, and supportive AI companion.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
                <input 
                  required
                  name="name"
                  type="text" 
                  placeholder="Enter your name"
                  className="w-full px-5 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Date of Birth</label>
                <input 
                  required
                  name="dob"
                  type="date" 
                  className="w-full px-5 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98] mt-4"
              >
                Start Chatting
              </button>
            </form>
          </div>
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 text-center border-t border-neutral-100 dark:border-neutral-700">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest">
              Aura AI – Built for positive conversations
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-white dark:bg-neutral-950 transition-colors ${settings.fontSize === 'sm' ? 'text-sm' : settings.fontSize === 'lg' ? 'text-lg' : 'text-base'}`}>
      
      {/* Sidebar & Backdrop */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop for Mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
            />
            
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              drag="x"
              dragConstraints={{ left: -300, right: 0 }}
              dragElastic={0.05}
              onDragEnd={(_, info) => {
                // If dragged left more than 50px or high velocity left
                if (info.offset.x < -50 || info.velocity.x < -500) {
                  setShowSidebar(false);
                }
              }}
              className="fixed z-30 w-72 h-screen bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl"
            >
            <div className="p-4">
              <button 
                onClick={createNewSession}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 text-indigo-600" /> New Chat
              </button>
            </div>

            {/* AI Tools Section in Sidebar */}
            <div className="px-2 space-y-1 mb-4">
              <h3 className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Wand2 className="w-3 h-3" /> AI Tools
              </h3>
              <div className="space-y-1">
                <button 
                  onClick={() => createToolSession('summarize')}
                  disabled={isTyping}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold">Summarize Input</span>
                </button>
                <button 
                  onClick={() => createToolSession('ideas')}
                  disabled={isTyping}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold">Brainstorm Ideas</span>
                </button>
                <button 
                  onClick={() => createToolSession('simplify')}
                  disabled={isTyping}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ListChecks className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold">Simplify Notes</span>
                </button>
              </div>
            </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <h3 className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><History className="w-3 h-3" /> History</div>
              {sessions.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); clearAllSessions(); }} 
                  className="hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  Clear All
                </button>
              )}
            </h3>
            {sessions.map(s => (
              <motion.div 
                key={s.id} 
                className="group relative"
                initial={false}
                whileHover={{ x: 4 }}
              >
                <button 
                  onClick={() => {
                    if (isLongPress.current) return;
                    setActiveSessionId(s.id);
                    setShowSidebar(false);
                  }}
                  onMouseDown={() => startLongPress(s.id)}
                  onMouseUp={endLongPress}
                  onMouseLeave={endLongPress}
                  onTouchStart={() => startLongPress(s.id)}
                  onTouchEnd={endLongPress}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                    activeSessionId === s.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{s.title}</span>
                </button>
                <button 
                  onClick={(e) => deleteSession(s.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <button 
                onClick={() => {
                  setShowProfile(true);
                  setShowSidebar(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-700 dark:text-neutral-300"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {user?.name[0].toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold truncate">{user?.name}</p>
                  <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Credits & Profile</p>
                </div>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>

      {/* Desktop Sidebar (Static) */}
      <aside className="hidden md:flex w-72 h-screen bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col flex-shrink-0">
        <div className="p-4">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> New Chat
          </button>
        </div>

        {/* AI Tools Section in Sidebar */}
        <div className="px-2 space-y-1 mb-4">
          <h3 className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Wand2 className="w-3 h-3" /> AI Tools
          </h3>
          <div className="space-y-1">
            <button 
              onClick={() => createToolSession('summarize')}
              disabled={isTyping}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold">Summarize Input</span>
            </button>
            <button 
              onClick={() => createToolSession('ideas')}
              disabled={isTyping}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold">Brainstorm Ideas</span>
            </button>
            <button 
              onClick={() => createToolSession('simplify')}
              disabled={isTyping}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ListChecks className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold">Simplify Notes</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <h3 className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><History className="w-3 h-3" /> History</div>
            {sessions.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); clearAllSessions(); }} 
                className="hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                Clear All
              </button>
            )}
          </h3>
          {sessions.map(s => (
            <motion.div 
              key={s.id} 
              className="group relative"
              initial={false}
              whileHover={{ x: 4 }}
            >
              <button 
                onClick={() => {
                  if (isLongPress.current) return;
                  setActiveSessionId(s.id);
                }}
                onMouseDown={() => startLongPress(s.id)}
                onMouseUp={endLongPress}
                onMouseLeave={endLongPress}
                onTouchStart={() => startLongPress(s.id)}
                onTouchEnd={endLongPress}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeSessionId === s.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{s.title}</span>
              </button>
              <button 
                onClick={(e) => deleteSession(s.id, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <button 
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-700 dark:text-neutral-300"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              {user?.name[0].toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Credits & Profile</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400"
            >
              {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-black text-neutral-900 dark:text-white tracking-tight">AURA</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activeSessionId && (
              <>
                <button 
                  onClick={clearCurrentChat}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-indigo-600 transition-colors"
                  title="Clear messages"
                >
                  <Eraser className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteSession(activeSessionId)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                  title="Delete current chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
          >
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-indigo-50 dark:bg-neutral-900 rounded-3xl flex items-center justify-center mb-6"
                  >
                    <Sparkles className="w-10 h-10 text-indigo-600" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">How can I help you?</h2>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
                    I'm Aura, your AI companion. Ask me anything or explore the suggestions below.
                  </p>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isSummarize = msg.tool === 'summarize';
                  const isIdeas = msg.tool === 'ideas';
                  const isSimplify = msg.tool === 'simplify';
                  
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex group/msg ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-4 max-w-[90%] relative ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' 
                            : isSummarize ? 'bg-blue-600 text-white'
                            : isIdeas ? 'bg-amber-500 text-white'
                            : isSimplify ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}>
                          {msg.sender === 'user' ? <User className="w-4 h-4" /> 
                            : isSummarize ? <FileText className="w-4 h-4" />
                            : isIdeas ? <Lightbulb className="w-4 h-4" />
                            : isSimplify ? <ListChecks className="w-4 h-4" />
                            : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm leading-relaxed border relative ${
                          msg.sender === 'user' 
                            ? `bg-indigo-600 text-white border-indigo-500 rounded-tr-none` 
                            : isSummarize ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800/50 rounded-tl-none'
                            : isIdeas ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800/50 rounded-tl-none'
                            : isSimplify ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800/50 rounded-tl-none'
                            : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 rounded-tl-none'
                        }`}>
                          {msg.sender === 'ai' && msg.tool !== 'general' && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-current opacity-20">
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {msg.tool === 'summarize' ? 'Summary AI' : msg.tool === 'ideas' ? 'Ideas AI' : 'Simplify AI'}
                              </span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-between mt-2 gap-4">
                            <span className={`text-[10px] opacity-50 font-bold`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button 
                              onClick={() => activeSessionId && deleteMessage(activeSessionId, msg.id)}
                              className="md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity p-1 hover:text-red-500"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-4 items-start">
                    <motion.div 
                      animate={{ 
                        boxShadow: ["0 0 0px rgba(79, 70, 229, 0)", "0 0 20px rgba(79, 70, 229, 0.4)", "0 0 0px rgba(79, 70, 229, 0)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl rounded-tl-none border border-neutral-200 dark:border-neutral-800 shadow-sm">
                      <div className="flex gap-2 items-center">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{ 
                              duration: 1, 
                              repeat: Infinity, 
                              delay: i * 0.2 
                            }}
                            className="w-2 h-2 bg-indigo-600 rounded-full"
                          />
                        ))}
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2"
                        >
                          Thinking
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Scroll to Bottom Button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                onClick={scrollToBottom}
                className="absolute bottom-24 right-8 p-3 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all z-30"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 pb-8 bg-white dark:bg-neutral-950">
            <div className="max-w-3xl mx-auto">
              {/* Suggestions */}
              {messages.length === 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {SUGGESTIONS.map(s => (
                    <button 
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="whitespace-nowrap px-4 py-2 bg-neutral-50 dark:bg-neutral-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative group">
                <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask Aura anything..."
                  className="w-full px-6 py-4 pr-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-lg"
                />
                <button 
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 bottom-2 p-3 bg-indigo-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Profile/About Overlay */}
        <AnimatePresence>
          {showProfile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-8 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-xl">
                    {user?.name[0].toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{user?.name}</h2>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-8 font-medium">Member of Aura AI</p>
                  
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Credits & Security</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Aura is an intelligent AI companion fully designed and created by <span className="font-bold text-indigo-600">Nihal</span>. 
                        Every feature, from the AI tools to the supportive chat experience, was crafted by Nihal to provide a safe and helpful digital partner.
                      </p>
                      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Security Note</p>
                        <p className="text-[11px] text-indigo-800 dark:text-indigo-200 leading-tight">
                          Aura uses server-side configuration to keep internal logic secure. Your data is stored locally on your device and is never shared with third parties.
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Lead Developer</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Nihal</p>
                      </div>
                      <div className="mt-2">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Version</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Aura v2.1.0</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Logout & Clear Data
                    </button>
                  </div>
                </div>
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
                  <button onClick={() => setShowProfile(false)} className="text-sm font-bold text-neutral-400 hover:text-neutral-600">Close</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-neutral-900 shadow-2xl z-40 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="font-black dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                  <Settings className="w-4 h-4" /> Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  <ChevronLeft className="w-5 h-5 rotate-180 dark:text-white" />
                </button>
              </div>
              <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                <section>
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Appearance</h3>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                    <span className="text-sm font-bold dark:text-neutral-300">Dark Mode</span>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.darkMode ? 'bg-indigo-600' : 'bg-neutral-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.darkMode ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Font Size</h3>
                  <div className="flex gap-2">
                    {(['sm', 'base', 'lg'] as const).map(size => (
                      <button 
                        key={size}
                        onClick={() => setSettings(s => ({ ...s, fontSize: size }))}
                        className={`flex-1 py-3 rounded-xl border text-xs font-black transition-all ${
                          settings.fontSize === size 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">Aura AI v2.0</h4>
                    <p className="text-[10px] text-indigo-700/60 dark:text-indigo-300/60 leading-relaxed">
                      Designed by Nihal. Focused on safe, intelligent, and supportive digital companionship.
                    </p>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
