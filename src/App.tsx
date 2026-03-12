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
  MessageSquare,
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
  Eraser,
  Heart,
  Github,
  Twitter,
  Mail,
  Shield,
  Zap,
  Smile,
  Globe,
  Lock
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

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`glass rounded-aura p-6 ${className}`}>
    {children}
  </div>
);

const Footer = () => (
  <footer className="py-12 px-6 border-t border-white/10 glass-dark">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-aura-primary" />
          <span className="font-display font-black text-xl tracking-tighter">AURA</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your ultimate AI companion for friendly conversations, fun utilities, and intelligent insights.
        </p>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-white">About</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li><a href="#" className="hover:text-aura-primary transition-colors">Our Mission</a></li>
          <li><a href="#" className="hover:text-aura-primary transition-colors">Creator: Nihal</a></li>
          <li><a href="#" className="hover:text-aura-primary transition-colors">Technology</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-white">Legal</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li><a href="#" className="hover:text-aura-primary transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-aura-primary transition-colors">Terms of Service</a></li>
          <li><a href="#" className="hover:text-aura-primary transition-colors">Cookie Policy</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-white">Contact</h4>
        <div className="flex gap-4">
          <a href="#" className="p-2 glass rounded-full hover:bg-aura-primary transition-all"><Github className="w-4 h-4" /></a>
          <a href="#" className="p-2 glass rounded-full hover:bg-aura-primary transition-all"><Twitter className="w-4 h-4" /></a>
          <a href="#" className="p-2 glass rounded-full hover:bg-aura-primary transition-all"><Mail className="w-4 h-4" /></a>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-slate-500 text-xs">
      <p>&copy; 2026 AURA AI. All rights reserved. Built with <Heart className="w-3 h-3 inline text-red-500" /> by Nihal.</p>
    </div>
  </footer>
);

const Splash = () => (
  <div className="fixed inset-0 z-[100] bg-aura-bg flex flex-col items-center justify-center">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      <div className="w-24 h-24 bg-aura-primary rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.5)]">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-aura-primary rounded-3xl -z-10"
      />
    </motion.div>
    <motion.h1
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 text-4xl font-display font-black tracking-tighter text-white"
    >
      AURA
    </motion.h1>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-2 text-aura-primary font-bold tracking-widest text-xs uppercase"
    >
      Ultimate AI Companion
    </motion.p>
  </div>
);

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-aura-gradient overflow-x-hidden">
    {/* Hero Section */}
    <section className="relative pt-32 pb-20 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-aura-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-aura-secondary/20 rounded-full blur-[120px]" />
      </div>
      
      <div className="max-w-7xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-aura-primary text-sm font-bold"
        >
          <Sparkles className="w-4 h-4" />
          <span>The Future of AI Companionship</span>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white leading-tight"
        >
          AURA – Your Ultimate <br />
          <span className="text-gradient">AI Companion</span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium"
        >
          One AI. Unlimited possibilities. Experience the most friendly, 
          intelligent, and supportive digital partner ever built.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-8"
        >
          <button
            onClick={onStart}
            className="px-10 py-5 bg-aura-primary hover:bg-aura-primary/90 text-white rounded-full font-display font-black text-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
          >
            Start Chatting <Send className="w-6 h-6" />
          </button>
        </motion.div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Smile className="w-8 h-8 text-aura-primary" />}
          title="Friendly Personality"
          description="Aura is designed to be empathetic, funny, and supportive. A true digital friend."
        />
        <FeatureCard 
          icon={<Zap className="w-8 h-8 text-aura-secondary" />}
          title="Lightning Fast"
          description="Powered by advanced AI for instant, intelligent responses to any query."
        />
        <FeatureCard 
          icon={<Lock className="w-8 h-8 text-aura-accent" />}
          title="Private & Secure"
          description="Your conversations are yours alone. We prioritize your privacy and data security."
        />
      </div>
    </section>

    <Footer />
  </div>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className="glass p-8 rounded-aura space-y-4 hover:border-aura-primary/50 transition-all"
  >
    <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-display font-black text-white">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

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
  const [view, setView] = useState<'landing' | 'login' | 'dashboard'>('landing');
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
      setView('dashboard');
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

    // Admin check
    if (name.toLowerCase() === 'nihal') {
      const newUser = { name: 'Nihal (Admin)', dob, isRestricted: false };
      setUser(newUser);
      setIsLoggedIn(true);
      setView('dashboard');
      localStorage.setItem('aura_user', JSON.stringify(newUser));
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      alert("Aura is designed for users 13 and older. Please check back when you're older!");
      return;
    }

    const newUser = { name, dob, isRestricted: false };
    setUser(newUser);
    setIsLoggedIn(true);
    setView('dashboard');
    localStorage.setItem('aura_user', JSON.stringify(newUser));

    // Create initial session if none exist
    if (sessions.length === 0) {
      const initialSession: ChatSession = {
        id: Date.now().toString(),
        title: 'Welcome Chat',
        messages: [{
          id: (Date.now() + 1).toString(),
          text: `Hello ${name}! I'm Aura. I was created by Nihal to be your intelligent and supportive AI companion. How can I help you today?`,
          sender: 'ai',
          timestamp: Date.now()
        }],
        updatedAt: Date.now()
      };
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
    }
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
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_sessions');
    setUser(null);
    setIsLoggedIn(false);
    setSessions([]);
    setActiveSessionId(null);
    setView('landing');
  };

  const LoginView = () => (
    <div className="min-h-screen bg-aura-gradient flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass p-10 rounded-aura space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-aura-primary to-aura-secondary" />
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-aura-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg glow-aura">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight">Welcome to AURA</h2>
          <p className="text-slate-400 font-medium">Please enter your details to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Your Name</label>
            <input 
              name="name"
              type="text" 
              required
              placeholder="Enter your name"
              className="w-full px-6 py-4 glass rounded-2xl text-white outline-none focus:ring-2 focus:ring-aura-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Date of Birth</label>
            <input 
              name="dob"
              type="date" 
              required
              className="w-full px-6 py-4 glass rounded-2xl text-white outline-none focus:ring-2 focus:ring-aura-primary transition-all [color-scheme:dark]"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-aura-primary hover:bg-aura-primary/90 text-white rounded-2xl font-display font-black text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-95"
          >
            Enter Dashboard
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Secure & Private AI Companion
          </p>
        </div>
      </motion.div>
    </div>
  );

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // --- Render ---

  if (isStarting) return <Splash />;

  if (view === 'landing') {
    return (
      <AnimatePresence>
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LandingPage onStart={() => setView(isLoggedIn ? 'dashboard' : 'login')} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (view === 'login') {
    return (
      <AnimatePresence>
        <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <LoginView />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className={`min-h-screen flex bg-aura-bg transition-colors ${settings.fontSize === 'sm' ? 'text-sm' : settings.fontSize === 'lg' ? 'text-lg' : 'text-base'}`}>
      
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
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 md:hidden"
            />
            
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-80 glass border-r border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-aura-primary rounded-xl flex items-center justify-center shadow-lg glow-aura">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-xl font-display font-black text-white tracking-tight">AURA</h1>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 md:hidden"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <button 
                  onClick={createNewSession}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-aura-primary hover:bg-aura-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 mb-6"
                >
                  <Plus className="w-5 h-5" />
                  New Conversation
                </button>

                {/* AI Tools Section */}
                <div className="px-2 space-y-1 mb-6">
                  <p className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Utilities</p>
                  <div className="grid grid-cols-1 gap-1">
                    <button 
                      onClick={() => createToolSession('summarize')}
                      disabled={isTyping}
                      className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold">Summarize</span>
                    </button>
                    <button 
                      onClick={() => createToolSession('ideas')}
                      disabled={isTyping}
                      className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold">Ideas</span>
                    </button>
                    <button 
                      onClick={() => createToolSession('simplify')}
                      disabled={isTyping}
                      className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold">Simplify</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Recent Chats</p>
                  {sessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        if (window.innerWidth < 768) setShowSidebar(false);
                      }}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                        activeSessionId === session.id 
                          ? 'bg-white/10 text-white border border-white/10' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate text-sm font-medium">
                        {session.title || 'New Conversation'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-white/10 space-y-2">
                <button 
                  onClick={() => { setShowSettings(true); setShowSidebar(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all font-medium"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.aside>
        </>
      )}
    </AnimatePresence>

      <aside className="hidden md:flex w-80 glass border-r border-white/10 flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-aura-primary rounded-xl flex items-center justify-center shadow-lg glow-aura">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-display font-black text-white tracking-tight">AURA</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center gap-3 px-4 py-4 bg-aura-primary hover:bg-aura-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 mb-2"
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </button>

          {/* AI Tools Section */}
          <div className="px-2 space-y-1">
            <p className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Utilities</p>
            <div className="grid grid-cols-1 gap-1">
              <button 
                onClick={() => createToolSession('summarize')}
                disabled={isTyping}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold">Summarize</span>
              </button>
              <button 
                onClick={() => createToolSession('ideas')}
                disabled={isTyping}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold">Ideas</span>
              </button>
              <button 
                onClick={() => createToolSession('simplify')}
                disabled={isTyping}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">Simplify</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Recent Chats</p>
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                  activeSessionId === session.id 
                    ? 'bg-white/10 text-white border border-white/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm font-medium">
                  {session.title || 'New Conversation'}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all font-medium"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 hover:bg-white/10 rounded-xl text-slate-400"
            >
              {showSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-aura-primary rounded-xl flex items-center justify-center shadow-lg glow-aura md:hidden">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-black text-white tracking-tight leading-none">AURA</h1>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">AI Companion</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSessionId && (
              <div className="flex items-center gap-1 glass rounded-xl p-1">
                <button 
                  onClick={clearCurrentChat}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                  title="Clear Chat"
                >
                  <Eraser className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteSession(activeSessionId)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                  title="Delete Chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white font-black hover:bg-white/10 transition-all"
            >
              {user?.name[0].toUpperCase()}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar"
          >
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 glass rounded-3xl flex items-center justify-center mb-8 glow-aura"
                  >
                    <Sparkles className="w-12 h-12 text-aura-primary" />
                  </motion.div>
                  <h2 className="text-3xl font-display font-black text-white mb-3 tracking-tight">How can I help you?</h2>
                  <p className="text-slate-400 max-w-sm font-medium">
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
                        <div className={`w-10 h-10 rounded-xl glass flex-shrink-0 flex items-center justify-center mt-1 shadow-lg ${
                          msg.sender === 'user' 
                            ? 'bg-aura-primary/20 text-aura-primary' 
                            : isSummarize ? 'bg-blue-500/20 text-blue-400'
                            : isIdeas ? 'bg-amber-500/20 text-amber-400'
                            : isSimplify ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-aura-secondary/20 text-aura-secondary'
                        }`}>
                          {msg.sender === 'user' ? <User className="w-5 h-5" /> 
                            : isSummarize ? <FileText className="w-5 h-5" />
                            : isIdeas ? <Lightbulb className="w-5 h-5" />
                            : isSimplify ? <Zap className="w-5 h-5" />
                            : <Sparkles className="w-5 h-5" />}
                        </div>
                        <div className={`p-5 rounded-2xl shadow-xl leading-relaxed border relative glass ${
                          msg.sender === 'user' 
                            ? `bg-aura-primary/10 border-aura-primary/30 text-white rounded-tr-none` 
                            : 'bg-white/5 border-white/10 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.sender === 'ai' && msg.tool !== 'general' && (
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {msg.tool === 'summarize' ? 'Summary AI' : msg.tool === 'ideas' ? 'Ideas AI' : 'Simplify AI'}
                              </span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                          <div className="flex items-center justify-between mt-3 gap-4">
                            <span className={`text-[10px] text-slate-500 font-black uppercase tracking-widest`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button 
                              onClick={() => activeSessionId && deleteMessage(activeSessionId, msg.id)}
                              className="opacity-0 group-hover/msg:opacity-100 transition-all p-1 text-slate-500 hover:text-red-400"
                              title="Delete message"
                            >
                              <Trash2 className="w-4 h-4" />
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
                    <div className="w-10 h-10 rounded-xl glass bg-aura-secondary/20 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-5 h-5 text-aura-secondary" />
                    </div>
                    <div className="glass p-5 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-aura-secondary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-aura-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-aura-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
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
          <div className="p-4 md:p-6 relative z-10">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Suggestions */}
              {messages.length === 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {SUGGESTIONS.map(s => (
                    <button 
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="whitespace-nowrap px-4 py-2 glass border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-lg"
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
                  className="w-full px-6 py-5 pr-16 rounded-3xl border border-white/10 glass text-white placeholder-slate-500 focus:ring-2 focus:ring-aura-primary outline-none transition-all resize-none shadow-2xl font-medium"
                />
                <button 
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2.5 bottom-2.5 p-3.5 bg-aura-primary disabled:bg-slate-800 text-white rounded-2xl shadow-xl glow-aura transition-all transform active:scale-95 hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-widest">
                Aura can make mistakes. Check important info.
              </p>
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md glass rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
              >
                <div className="p-10 text-center">
                  <div className="w-28 h-28 rounded-[2rem] bg-aura-primary flex items-center justify-center text-white text-5xl font-black mx-auto mb-8 shadow-2xl glow-aura">
                    {user?.name[0].toUpperCase()}
                  </div>
                  <h2 className="text-3xl font-display font-black text-white mb-2">{user?.name}</h2>
                  <p className="text-slate-400 mb-10 font-medium">Aura AI Member</p>
                  
                  <div className="space-y-6 text-left">
                    <div className="p-6 glass bg-white/5 rounded-3xl border border-white/10">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Credits & Security</h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        Aura is an intelligent AI companion fully designed and created by <span className="font-bold text-aura-primary">Nihal</span>. 
                        Every feature was crafted to provide a safe and helpful digital partner.
                      </p>
                      <div className="mt-6 p-4 bg-aura-primary/10 rounded-2xl border border-aura-primary/20">
                        <p className="text-[10px] font-black text-aura-primary uppercase tracking-widest mb-1">Security Note</p>
                        <p className="text-[11px] text-slate-300 leading-tight">
                          Your data is stored locally on your device and is never shared with third parties.
                        </p>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Developer</p>
                          <p className="text-sm font-bold text-white">Nihal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Version</p>
                          <p className="text-sm font-bold text-white">Aura v2.1.0</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-3 p-5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-3xl font-bold transition-all border border-red-500/20"
                    >
                      <LogOut className="w-5 h-5" /> Logout & Clear Data
                    </button>
                  </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-center">
                  <button onClick={() => setShowProfile(false)} className="text-sm font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">Close</button>
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
              className="fixed right-0 top-0 bottom-0 w-80 glass border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-black text-white flex items-center gap-3 text-sm uppercase tracking-widest">
                  <Settings className="w-5 h-5 text-aura-primary" /> Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                <section>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Appearance</h3>
                  <div className="flex items-center justify-between p-5 glass bg-white/5 rounded-3xl border border-white/10">
                    <span className="text-sm font-bold text-slate-200">Dark Mode</span>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                      className={`w-14 h-7 rounded-full transition-all relative ${settings.darkMode ? 'bg-aura-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-lg ${settings.darkMode ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Font Size</h3>
                  <div className="flex gap-2">
                    {(['sm', 'base', 'lg'] as const).map(size => (
                      <button 
                        key={size}
                        onClick={() => setSettings(s => ({ ...s, fontSize: size }))}
                        className={`flex-1 py-4 rounded-2xl border text-xs font-black transition-all ${
                          settings.fontSize === size 
                            ? 'bg-aura-primary border-aura-primary text-white shadow-lg glow-aura' 
                            : 'glass border-white/10 text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="pt-10 border-t border-white/10">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center">
                    Aura AI v2.1.0<br/>Created by Nihal
                  </p>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
