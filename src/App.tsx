import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { 
  Send, Settings, Trash2, User, Sparkles, MessageCircle, MessageSquare, Info, ChevronLeft, Plus, LogOut, Menu, X, History, FileText, Lightbulb, ListChecks, Wand2, ChevronDown, Eraser, Heart, Github, Twitter, Mail, Shield, Zap, Smile, Globe, Lock, Clock, CheckCircle2, Calendar, BookOpen, Code2, BrainCircuit, Rocket, Download, Copy, RefreshCw, MoreVertical, Search, LayoutDashboard, Timer, CheckSquare, BarChart3, UserCircle, ShieldCheck, Cpu, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, serverTimestamp, limit, getDocs, getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { format, differenceInYears, isAfter, startOfDay } from 'date-fns';

// --- Types ---

type AIMode = 'general' | 'study' | 'coding' | 'creative' | 'motivation' | 'search' | 'grok';

interface Message {
  id: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: any;
  mode: AIMode;
  imageUrl?: string;
  sources?: { uri: string; title: string }[];
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  updatedAt: any;
  mode: AIMode;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  dateOfBirth: string;
  accountCreated: any;
  lastLogin: any;
  profileImage?: string;
  role: 'user' | 'admin';
  preferences: {
    theme: 'dark' | 'light';
    fontSize: 'sm' | 'base' | 'lg';
    notifications: boolean;
  };
}

interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: any;
}

interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  goal: string;
  deadline: string;
  progress: number;
}

// --- Firestore Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Database Error: ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Oops!</h2>
            <p className="text-slate-400">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-200 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Constants ---

const AI_MODES: { id: AIMode; label: string; icon: any; color: string; prompt: string }[] = [
  { 
    id: 'general', 
    label: 'General', 
    icon: MessageCircle, 
    color: 'text-blue-400',
    prompt: "You are Aura, a friendly and intelligent AI companion. Provide helpful, conversational, and accurate answers."
  },
  { 
    id: 'study', 
    label: 'Study', 
    icon: BookOpen, 
    color: 'text-emerald-400',
    prompt: "You are Aura Study Assistant. Provide step-by-step explanations, simplify complex concepts, and help with homework. Be educational and encouraging."
  },
  { 
    id: 'coding', 
    label: 'Coding', 
    icon: Code2, 
    color: 'text-purple-400',
    prompt: "You are Aura Code Expert. Provide clean code snippets, explain logic step-by-step, and help debug. Use professional technical language."
  },
  { 
    id: 'creative', 
    label: 'Creative', 
    icon: Wand2, 
    color: 'text-pink-400',
    prompt: "You are Aura Creative Muse. Help with storytelling, idea generation, and creative writing. Be imaginative and inspiring."
  },
  { 
    id: 'motivation', 
    label: 'Motivation', 
    icon: Rocket, 
    color: 'text-orange-400',
    prompt: "You are Aura Motivator. Provide encouraging advice, positive affirmations, and help with goal setting. Be energetic and supportive."
  },
  { 
    id: 'search', 
    label: 'Web Search', 
    icon: Globe, 
    color: 'text-indigo-400',
    prompt: "You are Aura Researcher. Use Google Search to provide up-to-date and accurate information on any topic."
  },
  { 
    id: 'grok', 
    label: 'Grok AI', 
    icon: Zap, 
    color: 'text-yellow-400',
    prompt: "You are Grok, a rebellious and witty AI with a sense of humor. You are helpful but like to have a bit of fun with your answers."
  }
];

const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The secret of getting ahead is getting started. - Mark Twain"
];

// --- Components ---

const GlassCard = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={`glass rounded-aura p-6 ${className}`} {...props}>
    {children}
  </div>
);

const Footer = () => (
  <footer className="py-12 px-6 border-t border-white/10 glass-dark">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-aura-primary" />
          <span className="font-display font-black text-xl tracking-tighter">AURA AI</span>
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

const AdminPanel = ({ user }: { user: UserProfile }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-aura-bg p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black">Admin Dashboard</h1>
            <p className="text-slate-400">Manage users and monitor platform activity.</p>
          </div>
          <button onClick={() => signOut(auth)} className="px-6 py-3 glass rounded-xl font-bold hover:bg-red-500/10 hover:text-red-400 transition-all">
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Users', value: users.length, icon: User, color: 'text-blue-400' },
            { label: 'Active Today', value: Math.floor(users.length * 0.7), icon: Zap, color: 'text-yellow-400' },
            { label: 'Messages Sent', value: '12.4k', icon: MessageSquare, color: 'text-purple-400' },
            { label: 'System Status', value: 'Healthy', icon: ShieldCheck, color: 'text-emerald-400' }
          ].map((stat, i) => (
            <GlassCard key={i} className="flex items-center gap-4">
              <div className={`p-3 bg-white/5 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black">User Management</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input placeholder="Search users..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-aura-primary transition-all text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">User</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-all">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-aura-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-aura-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [view, setView] = useState<'splash' | 'landing' | 'auth' | 'dashboard' | 'admin'>('splash');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'chat' | 'pomodoro' | 'todo' | 'study' | 'profile'>('chat');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>('general');
  
  // Productivity State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  
  // Admin State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const quote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

  // Initialize Gemini
  const genAI = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }), []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
            if (userData.role === 'admin' && view === 'auth') setView('admin');
            else setView('dashboard');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setUser(null);
        setView('landing');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'splash') {
      const timer = setTimeout(() => {
        if (!loading) setView(user ? 'dashboard' : 'landing');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [view, loading, user]);

  // Listeners
  useEffect(() => {
    if (!user) return;

    // Sessions
    const qSessions = query(collection(db, 'chat_history'), where('userId', '==', user.userId), orderBy('timestamp', 'desc'), limit(50));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      // Group by sessionId to get sessions
      const sessionMap = new Map<string, ChatSession>();
      msgs.forEach(m => {
        if (!sessionMap.has(m.sessionId)) {
          sessionMap.set(m.sessionId, {
            id: m.sessionId,
            userId: m.userId,
            title: m.content.substring(0, 30) + '...',
            updatedAt: m.timestamp,
            mode: m.mode
          });
        }
      });
      setSessions(Array.from(sessionMap.values()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chat_history'));

    // Tasks
    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.userId), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

    // Study Plans
    const qPlans = query(collection(db, 'study_plans'), where('userId', '==', user.userId));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      setStudyPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyPlan)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'study_plans'));

    return () => {
      unsubSessions();
      unsubTasks();
      unsubPlans();
    };
  }, [user]);

  useEffect(() => {
    if (!user || !activeSessionId) {
      setMessages([]);
      return;
    }
    const qMessages = query(collection(db, 'chat_history'), where('sessionId', '==', activeSessionId), orderBy('timestamp', 'asc'));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chat_history'));
    return () => unsubMessages();
  }, [user, activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pomodoro Timer
  useEffect(() => {
    let interval: any;
    if (isPomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroActive(false);
      const nextMode = pomodoroMode === 'focus' ? 'break' : 'focus';
      setPomodoroMode(nextMode);
      setPomodoroTime(nextMode === 'focus' ? 25 * 60 : 5 * 60);
      alert(nextMode === 'focus' ? "Break over! Time to focus." : "Focus session complete! Take a break.");
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroTime, pomodoroMode]);

  // Handlers
  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;

    try {
      if (authMode === 'signup') {
        const age = differenceInYears(new Date(), new Date(dob));
        if (age < 13) {
          alert("You must be at least 13 years old to use Aura AI.");
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const userData: UserProfile = {
          userId: res.user.uid,
          name,
          email,
          dateOfBirth: dob,
          accountCreated: serverTimestamp(),
          lastLogin: serverTimestamp(),
          role: email === 'nihaleeeee.official@gmail.com' ? 'admin' : 'user',
          preferences: { theme: 'dark', fontSize: 'base', notifications: true }
        };
        try {
          await setDoc(doc(db, 'users', res.user.uid), userData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'users');
        }
        setUser(userData);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || !user) return;
    const sessionId = activeSessionId || crypto.randomUUID();
    if (!activeSessionId) setActiveSessionId(sessionId);
    
    const userMsg: Omit<Message, 'id'> = {
      userId: user.userId,
      sessionId,
      role: 'user',
      content: text,
      timestamp: serverTimestamp(),
      mode: currentMode
    };
    
    setInput('');
    try {
      await addDoc(collection(db, 'chat_history'), userMsg);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_history');
    }
    setIsTyping(true);

    try {
      const modeConfig = AI_MODES.find(m => m.id === currentMode)!;
      let aiResponseText = "";
      let sources: { uri: string; title: string }[] = [];
      let imageUrl = "";

      // --- Helper Functions for API Calls ---
      const tryGemini = async () => {
        const result = await genAI.models.generateContent({ 
          model: currentMode === 'search' ? "gemini-3-flash-latest" : "gemini-3-flash-preview",
          contents: [
            { role: 'user', parts: [{ text: modeConfig.prompt }] },
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
            { role: 'user', parts: [{ text }] }
          ],
          config: {
            systemInstruction: modeConfig.prompt,
            tools: currentMode === 'search' ? [{ googleSearch: {} }] : undefined
          }
        });
        const src = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          uri: chunk.web?.uri,
          title: chunk.web?.title
        })).filter((s: any) => s.uri) || [];
        return { text: result.text || "", sources: src };
      };

      const tryGrok = async () => {
        const response = await fetch('/api/chat/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
            systemPrompt: modeConfig.prompt
          })
        });
        if (!response.ok) throw new Error('Grok API failed');
        const data = await response.json();
        return { text: data.text };
      };

      const tryHuggingFace = async () => {
        const response = await fetch('/api/chat/huggingface', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
            systemPrompt: modeConfig.prompt
          })
        });
        if (!response.ok) throw new Error('Hugging Face API failed');
        const data = await response.json();
        return { text: data.text };
      };

      // --- Fallback Execution Logic ---
      try {
        console.log("Attempting Gemini...");
        const res = await tryGemini();
        aiResponseText = res.text;
        sources = res.sources || [];
      } catch (geminiErr: any) {
        console.error("Gemini failed/quota exceeded:", geminiErr);
        try {
          console.log("Falling back to Grok...");
          const res = await tryGrok();
          aiResponseText = res.text;
        } catch (grokErr: any) {
          console.error("Grok failed:", grokErr);
          try {
            console.log("Falling back to Hugging Face...");
            const res = await tryHuggingFace();
            aiResponseText = res.text;
          } catch (hfErr: any) {
            console.error("All APIs failed:", hfErr);
            aiResponseText = "I'm sorry, all my neural circuits are currently busy or over quota. Please try again in a moment.";
          }
        }
      }

      const aiMsg: Omit<Message, 'id'> = {
        userId: user.userId,
        sessionId,
        role: 'model',
        content: aiResponseText,
        timestamp: serverTimestamp(),
        mode: currentMode,
        imageUrl,
        sources
      };
      try {
        await addDoc(collection(db, 'chat_history'), aiMsg);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'chat_history');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const addTask = async (title: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.userId,
        title,
        completed: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !completed });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'tasks');
    }
  };

  if (view === 'splash') return <Splash />;

  if (view === 'landing') return (
    <div className="min-h-screen bg-aura-gradient">
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-aura-primary" />
            <span className="font-display font-black text-xl tracking-tighter">AURA AI</span>
          </div>
          <button 
            onClick={() => { setAuthMode('login'); setView('auth'); }}
            className="px-6 py-2 glass rounded-full text-sm font-bold hover:bg-white/10 transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
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
            AURA AI – Your Ultimate <br />
            <span className="text-gradient">Professional Assistant</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto font-medium"
          >
            Experience the most intelligent, supportive, and professional AI partner. 
            From study help to coding expertise, Aura is here for you.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button 
              onClick={() => { setAuthMode('signup'); setView('auth'); }}
              className="px-8 py-4 bg-aura-primary rounded-full font-black text-lg shadow-lg glow-aura hover:scale-105 transition-all"
            >
              Start Chatting Now
            </button>
            <button className="px-8 py-4 glass rounded-full font-black text-lg hover:bg-white/10 transition-all">
              Learn More
            </button>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: BrainCircuit, title: "Smart Study", desc: "Step-by-step explanations and homework help." },
            { icon: Code2, title: "Code Expert", desc: "Professional coding assistance and debugging." },
            { icon: Timer, title: "Productivity", desc: "Pomodoro timer and smart to-do lists." }
          ].map((feature, i) => (
            <GlassCard key={i} className="hover:scale-105 transition-all">
              <feature.icon className="w-12 h-12 text-aura-primary mb-6" />
              <h3 className="text-xl font-black mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </GlassCard>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );

  if (view === 'dashboard') return (
    <div className="flex h-screen bg-aura-bg overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="glass-dark border-r border-white/5 flex flex-col z-40"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-aura-primary" />
            <span className="font-display font-black text-xl tracking-tighter">AURA AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6">
          <div className="space-y-1">
            <label className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Menu</label>
            {[
              { id: 'chat', label: 'AI Chat', icon: MessageSquare },
              { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
              { id: 'todo', label: 'Tasks', icon: CheckSquare },
              { id: 'study', label: 'Study Plans', icon: BookOpen },
              { id: 'profile', label: 'Profile', icon: UserCircle }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-aura-primary text-white shadow-lg glow-aura' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Chats</label>
                <button onClick={() => setActiveSessionId(null)} className="p-1 hover:bg-white/5 rounded-lg text-aura-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSessionId === session.id ? 'bg-white/5 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                  >
                    <History className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{session.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 glass border-b border-white/5 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="font-black text-lg capitalize">{activeTab}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aura AI Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
            </div>
            <button className="p-2 glass rounded-full hover:bg-white/10 transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                {/* Mode Selector */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
                  {AI_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setCurrentMode(mode.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${currentMode === mode.id ? 'bg-aura-primary text-white shadow-lg' : 'glass text-slate-400 hover:text-white'}`}
                    >
                      <mode.icon className={`w-4 h-4 ${currentMode === mode.id ? 'text-white' : mode.color}`} />
                      <span className="text-xs font-bold">{mode.label}</span>
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 mb-4">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 bg-aura-primary/10 rounded-3xl flex items-center justify-center glow-aura">
                        <Sparkles className="w-10 h-10 text-aura-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black">Hello, I'm Aura</h3>
                        <p className="text-slate-400 max-w-sm">How can I assist you today? Choose a mode above for specialized help.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                        {["Help me with my homework", "Write a short story", "Explain React hooks", "Give me some motivation"].map(s => (
                          <button 
                            key={s}
                            onClick={() => sendMessage(s)}
                            className="p-4 glass rounded-2xl text-left text-sm font-medium hover:bg-white/10 transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-aura-primary text-white glow-aura' : 'glass text-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-2 opacity-50">
                          {msg.role === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{msg.role === 'user' ? 'You' : 'Aura'}</span>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        
                        {msg.imageUrl && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                            <img src={msg.imageUrl} alt="Generated" className="w-full h-auto" referrerPolicy="no-referrer" />
                            <div className="p-2 bg-black/40 flex justify-end">
                              <button 
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = msg.imageUrl!;
                                  link.download = `aura-gen-${Date.now()}.png`;
                                  link.click();
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((source, i) => (
                                <a 
                                  key={i} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-[10px] font-bold hover:bg-white/10 transition-all"
                                >
                                  <Globe className="w-3 h-3 text-blue-400" />
                                  <span className="truncate max-w-[150px]">{source.title || 'Source'}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="glass p-4 rounded-2xl flex gap-1">
                        <div className="w-1.5 h-1.5 bg-aura-primary rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-aura-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-aura-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Message Aura (${currentMode} mode)...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 outline-none focus:border-aura-primary transition-all"
                  />
                  <button 
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-aura-primary rounded-xl shadow-lg glow-aura hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'pomodoro' && (
              <motion.div 
                key="pomodoro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center space-y-12"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black capitalize">{pomodoroMode} Session</h2>
                  <p className="text-slate-400">Stay focused and productive with Aura.</p>
                </div>

                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                    <circle 
                      cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" 
                      strokeDasharray="100 100" strokeDashoffset={100 - (pomodoroTime / (pomodoroMode === 'focus' ? 25 * 60 : 5 * 60)) * 100}
                      className="text-aura-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="text-6xl md:text-8xl font-display font-black tracking-tighter">
                    {Math.floor(pomodoroTime / 60)}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPomodoroActive(!isPomodoroActive)}
                    className="px-12 py-4 bg-aura-primary rounded-2xl font-black text-xl shadow-lg glow-aura hover:scale-105 transition-all"
                  >
                    {isPomodoroActive ? 'Pause' : 'Start'}
                  </button>
                  <button 
                    onClick={() => { setIsPomodoroActive(false); setPomodoroTime(pomodoroMode === 'focus' ? 25 * 60 : 5 * 60); }}
                    className="p-4 glass rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'todo' && (
              <motion.div 
                key="todo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl mx-auto w-full space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black">Smart To-Do List</h2>
                    <p className="text-slate-400">Manage your daily tasks efficiently.</p>
                  </div>
                  <div className="p-3 glass rounded-2xl">
                    <CheckSquare className="w-6 h-6 text-aura-primary" />
                  </div>
                </div>

                <form 
                  onSubmit={(e) => { e.preventDefault(); const input = e.currentTarget.task; addTask(input.value); input.value = ''; }}
                  className="relative"
                >
                  <input name="task" placeholder="Add a new task..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 outline-none focus:border-aura-primary transition-all" />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-aura-primary rounded-xl shadow-lg glow-aura hover:scale-105 transition-all">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="group flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleTask(task.id, task.completed)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-aura-primary border-aura-primary' : 'border-white/10'}`}>
                          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        <span className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.title}</span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'study' && (
              <motion.div key="study" className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black">Study Planner</h2>
                    <p className="text-slate-400">Track your learning progress.</p>
                  </div>
                  <button className="px-6 py-3 bg-aura-primary rounded-xl font-bold shadow-lg glow-aura hover:scale-105 transition-all">
                    New Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studyPlans.map(plan => (
                    <GlassCard key={plan.id} className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-aura-primary/10 rounded-2xl">
                          <BookOpen className="w-6 h-6 text-aura-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{plan.deadline}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{plan.subject}</h3>
                        <p className="text-sm text-slate-400 mt-1">{plan.goal}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Progress</span>
                          <span>{plan.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-aura-primary" style={{ width: `${plan.progress}%` }} />
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && user && (
              <motion.div key="profile" className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8 p-8 glass rounded-aura">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-aura-primary glow-aura">
                      <img src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-aura-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h2 className="text-4xl font-black">{user.name}</h2>
                    <p className="text-slate-400 font-medium">{user.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                      <span className="px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                      <span className="px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest">Member since 2026</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <Settings className="w-5 h-5 text-aura-primary" />
                      Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <span className="font-bold">Dark Mode</span>
                        </div>
                        <div className="w-12 h-6 bg-aura-primary rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-blue-400" />
                          <span className="font-bold">Language</span>
                        </div>
                        <span className="text-sm font-bold text-slate-500">English</span>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      API Integrations
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-bold">Gemini AI</p>
                            <p className="text-xs text-slate-500">Core Intelligence</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold">Google Search</p>
                            <p className="text-xs text-slate-500">Web Grounding</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-bold">Grok AI (xAI)</p>
                            <p className="text-xs text-slate-500">Witty Intelligence</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Smile className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-bold">Hugging Face</p>
                            <p className="text-xs text-slate-500">Open Source Models</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Account Security
                    </h3>
                    <div className="space-y-4">
                      <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <span className="font-bold">Change Password</span>
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                      <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <span className="font-bold">Privacy Settings</span>
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );

  if (view === 'admin' && user?.role === 'admin') return <AdminPanel user={user} />;

  return null;
}
