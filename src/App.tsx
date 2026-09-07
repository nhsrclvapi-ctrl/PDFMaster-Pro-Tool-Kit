import React, { useState, useEffect, useRef } from 'react';
import { mergePDF, splitPDF, compressPDF, pdfToWord, pdfToExcel, pdfToPpt, resizePDF, editPDF, blobUrl } from './pdfTools';
import { 
  FileText, Merge, Scissors, Minimize2, FileSpreadsheet, Presentation, 
  Edit3, Maximize, Upload, Download, CheckCircle, AlertCircle, RefreshCw, 
  Lock, Zap, Shield, HelpCircle, User, LogIn, Menu, X, ChevronDown, 
  ChevronUp, Trash2, ArrowRight, Eye, Check, Settings, Sparkles, 
  Sliders, Play, Layers, FileCheck, ExternalLink, ArrowLeft
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================
type ViewState = 'home' | 'tools' | 'pricing' | 'about' | 'faq' | 'dashboard' | 'tool-detail';
type ToolId = 'merge' | 'split' | 'compress' | 'to-word' | 'to-excel' | 'to-ppt' | 'edit' | 'resize';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'ready' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  previewUrl?: string;
  file?: File;
}

interface RecentActivity {
  id: string;
  filename: string;
  tool: string;
  date: string;
  status: 'Completed' | 'Failed';
}

// ==========================================
// REAL CLIENT-SIDE PDF SERVICE
// ==========================================
// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; plan: string } | null>(null);

  // Global notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center space-x-3 text-white transition-all transform animate-bounce ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">PDF<span className="text-indigo-600">Master</span></span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Pro Toolkit</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => setCurrentView('home')} className={`text-sm font-medium transition-colors hover:text-indigo-600 ${currentView === 'home' ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>Home</button>
            <button onClick={() => setCurrentView('tools')} className={`text-sm font-medium transition-colors hover:text-indigo-600 ${currentView === 'tools' || currentView === 'tool-detail' ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>All PDF Tools</button>
            <button onClick={() => setCurrentView('pricing')} className={`text-sm font-medium transition-colors hover:text-indigo-600 ${currentView === 'pricing' ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>Pricing</button>
            <button onClick={() => setCurrentView('faq')} className={`text-sm font-medium transition-colors hover:text-indigo-600 ${currentView === 'faq' ? 'text-indigo-600 font-semibold' : 'text-slate-600'}`}>FAQ</button>
          </nav>

          {/* User Auth Buttons / Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
              >
                <User size={18} />
                <span>{user.name}</span>
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setAuthModal('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={() => setAuthModal('signup')}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
            <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">Home</button>
            <button onClick={() => { setCurrentView('tools'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">All PDF Tools</button>
            <button onClick={() => { setCurrentView('pricing'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">Pricing</button>
            <button onClick={() => { setCurrentView('faq'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">FAQ</button>
            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
              {user ? (
                <button onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }} className="w-full py-2 text-center font-medium bg-indigo-50 text-indigo-700 rounded-lg">Dashboard ({user.name})</button>
              ) : (
                <>
                  <button onClick={() => { setAuthModal('login'); setMobileMenuOpen(false); }} className="w-full py-2.5 text-center font-semibold text-indigo-600 border border-indigo-200 rounded-xl">Log In</button>
                  <button onClick={() => { setAuthModal('signup'); setMobileMenuOpen(false); }} className="w-full py-2.5 text-center font-semibold text-white bg-indigo-600 rounded-xl">Sign Up Free</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Dynamic Switcher */}
      <main className="flex-grow">
        {currentView === 'home' && <HomeView setCurrentView={setCurrentView} setActiveTool={setActiveTool} showToast={showToast} />}
        {currentView === 'tools' && <ToolsDashboardView setActiveTool={setActiveTool} setCurrentView={setCurrentView} />}
        {currentView === 'tool-detail' && activeTool && <ToolExecutionView toolId={activeTool} showToast={showToast} />}
        {currentView === 'pricing' && <PricingView showToast={showToast} />}
        {currentView === 'faq' && <FaqView />}
        {currentView === 'dashboard' && <UserDashboardView user={user} setUser={setUser} setCurrentView={setCurrentView} />}
      </main>

      {/* Auth Modal */}
      {authModal && (
        <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onAuth={(userData) => { setUser(userData); setAuthModal(null); showToast(`Welcome back, ${userData.name}!`); setCurrentView('dashboard'); }} />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <FileText size={18} />
                </div>
                <span className="text-xl font-bold text-white">PDFMaster</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                The ultimate browser-based PDF utility platform. Fast, secure, and intuitive tools for all your document workflows.
              </p>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <Shield size={16} className="text-indigo-400" />
                <span>SSL Encrypted & Auto-Deleted after 2 hours</span>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">PDF Tools</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => { setActiveTool('merge'); setCurrentView('tool-detail'); }} className="hover:text-white transition-colors">Merge PDF</button></li>
                <li><button onClick={() => { setActiveTool('split'); setCurrentView('tool-detail'); }} className="hover:text-white transition-colors">Split PDF</button></li>
                <li><button onClick={() => { setActiveTool('compress'); setCurrentView('tool-detail'); }} className="hover:text-white transition-colors">Compress PDF</button></li>
                <li><button onClick={() => { setActiveTool('to-word'); setCurrentView('tool-detail'); }} className="hover:text-white transition-colors">PDF to Word</button></li>
                <li><button onClick={() => { setActiveTool('edit'); setCurrentView('tool-detail'); }} className="hover:text-white transition-colors">Edit PDF</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => setCurrentView('faq')} className="hover:text-white transition-colors">FAQ & Help</button></li>
                <li><button onClick={() => setCurrentView('pricing')} className="hover:text-white transition-colors">Pricing Plans</button></li>
                <li><a href="#privacy" onClick={(e) => {e.preventDefault(); showToast("Privacy policy: Files are securely processed and auto-deleted.");}} className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" onClick={(e) => {e.preventDefault(); showToast("Terms of service applied.");}} className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => setCurrentView('about' as any)} className="hover:text-white transition-colors">About Us</button></li>
                <li><a href="#contact" onClick={(e) => {e.preventDefault(); showToast("Contact support: support@pdfmaster.io");}} className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} PDFMaster Technologies Inc. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="hover:text-slate-400 cursor-pointer">Security</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms</span>
              <span className="hover:text-slate-400 cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// HOME VIEW
// ==========================================
function HomeView({ setCurrentView, setActiveTool, showToast }: { setCurrentView: (v: ViewState) => void; setActiveTool: (t: ToolId) => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setActiveTool('merge');
      setCurrentView('tool-detail');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setActiveTool('merge');
      setCurrentView('tool-detail');
    }
  };

  const popularTools = [
    { id: 'merge' as ToolId, name: 'Merge PDF', desc: 'Combine multiple PDFs in exact order', icon: Merge, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'compress' as ToolId, name: 'Compress PDF', desc: 'Reduce file size without quality loss', icon: Minimize2, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'to-word' as ToolId, name: 'PDF to Word', desc: 'Convert PDFs to editable DOCX', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { id: 'to-excel' as ToolId, name: 'PDF to Excel', desc: 'Extract tables into XLSX spreadsheets', icon: FileSpreadsheet, color: 'text-amber-600 bg-amber-50' },
    { id: 'to-ppt' as ToolId, name: 'PDF to PowerPoint', desc: 'Turn PDFs into dynamic PPTX slides', icon: Presentation, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-20 pb-24">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles size={14} />
            <span>Next-Gen Document Processing Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Everything You Need to Work <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">With PDFs</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Merge, split, compress, convert, edit, and resize your PDF files quickly and easily — all in one secure place.
          </p>

          {/* Drag & Drop Upload Hero Box */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`max-w-2xl mx-auto p-10 rounded-3xl border-2 border-dashed transition-all duration-300 bg-white shadow-xl shadow-indigo-600/5 ${dragOver ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' : 'border-indigo-200 hover:border-indigo-400'}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept=".pdf" className="hidden" />
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Upload size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Drag & Drop your PDF here</h3>
            <p className="text-sm text-slate-500 mb-6">Supports multiple PDF files up to 100MB each</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
              >
                Choose PDF File
              </button>
              <button 
                onClick={() => { setActiveTool('merge'); setCurrentView('tool-detail'); }}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
              >
                Browse All Tools
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
              <Lock size={13} className="text-emerald-600" />
              <span>256-Bit SSL Secure • Automatic deletion after 2 hours</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Shortcuts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Popular PDF Solutions</h2>
          <p className="text-slate-500 text-sm mt-1">Select any tool to get started instantly without installation</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {popularTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div 
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setCurrentView('tool-detail'); }}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${tool.color}`}>
                    <IconComponent size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{tool.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>Use tool</span>
                  <ArrowRight size={14} className="ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security & Privacy Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Shield size={14} />
              <span>Enterprise-Grade Privacy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Your files remain strictly confidential</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We use advanced end-to-end encryption for file transfers. All uploaded documents are automatically and permanently purged from our servers after 2 hours. We never read or share your data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
              <span className="block text-2xl font-bold text-indigo-400">100%</span>
              <span className="text-xs text-slate-300 mt-1 block">Secure Processing</span>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
              <span className="block text-2xl font-bold text-indigo-400">2 Hours</span>
              <span className="text-xs text-slate-300 mt-1 block">Auto-Purge Window</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// TOOLS DASHBOARD VIEW
// ==========================================
function ToolsDashboardView({ setActiveTool, setCurrentView }: { setActiveTool: (t: ToolId) => void; setCurrentView: (v: ViewState) => void }) {
  const toolsList = [
    { id: 'merge' as ToolId, name: 'Merge PDF', desc: 'Combine multiple PDF files into one document in your preferred order.', icon: Merge, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'split' as ToolId, name: 'Split PDF', desc: 'Extract individual pages or split a PDF into multiple separate files.', icon: Scissors, color: 'text-violet-600 bg-violet-50' },
    { id: 'compress' as ToolId, name: 'Compress PDF', desc: 'Reduce file size while preserving high visual document quality.', icon: Minimize2, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'to-word' as ToolId, name: 'PDF to Word', desc: 'Convert PDF documents into fully editable Word DOCX files.', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { id: 'to-excel' as ToolId, name: 'PDF to Excel', desc: 'Extract complex tables and data into editable Excel spreadsheets.', icon: FileSpreadsheet, color: 'text-amber-600 bg-amber-50' },
    { id: 'to-ppt' as ToolId, name: 'PDF to PowerPoint', desc: 'Transform PDF pages into editable PowerPoint slide decks.', icon: Presentation, color: 'text-rose-600 bg-rose-50' },
    { id: 'edit' as ToolId, name: 'Edit PDF', desc: 'Add text, signatures, shapes, comments, and annotations directly.', icon: Edit3, color: 'text-cyan-600 bg-cyan-50' },
    { id: 'resize' as ToolId, name: 'Resize PDF', desc: 'Change PDF page dimensions to A4, Letter, Custom size or orientation.', icon: Maximize, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">All PDF Utilities</h1>
        <p className="text-slate-600 text-base">Select any tool below to begin processing your documents instantly in your browser.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {toolsList.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div 
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setCurrentView('tool-detail'); }}
              className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${tool.color}`}>
                  <IconComponent size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{tool.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">Ready to use</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// TOOL EXECUTION VIEW (With Reusable Components)
// ==========================================
function ToolExecutionView({ toolId, showToast }: { toolId: ToolId; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultReady, setResultReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Tool specific options
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'less'>('recommended');
  const [splitRanges, setSplitRanges] = useState('1-3');
  const [resizePreset, setResizePreset] = useState('A4');
  const [isLandscape, setIsLandscape] = useState(false);

  // Edit PDF specific states
  const [editAnnotations, setEditAnnotations] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  const [newText, setNewText] = useState('');
  const [editPage, setEditPage] = useState(1);

  const toolTitles: Record<ToolId, { title: string; desc: string; icon: any }> = {
    'merge': { title: 'Merge PDF Files', desc: 'Combine multiple PDF files into one unified document.', icon: Merge },
    'split': { title: 'Split PDF Pages', desc: 'Extract pages or split your document into separate files.', icon: Scissors },
    'compress': { title: 'Compress PDF Size', desc: 'Reduce file size while preserving high visual quality.', icon: Minimize2 },
    'to-word': { title: 'Convert PDF to Word', desc: 'Transform PDF into fully editable DOCX document.', icon: FileText },
    'to-excel': { title: 'Convert PDF to Excel', desc: 'Extract tables into clean XLSX spreadsheets.', icon: FileSpreadsheet },
    'to-ppt': { title: 'Convert PDF to PowerPoint', desc: 'Turn PDF into engaging PPTX slides.', icon: Presentation },
    'edit': { title: 'Edit PDF Online', desc: 'Add text annotations, shapes, and comments.', icon: Edit3 },
    'resize': { title: 'Resize PDF Pages', desc: 'Change page dimensions, scaling, and orientation.', icon: Maximize },
  };

  const currentToolInfo = toolTitles[toolId];
  const IconComponent = currentToolInfo.icon;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: UploadedFile[] = Array.from(e.target.files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 100,
      status: 'ready' as const,
      file: f
    }));
    setFiles(toolId === 'merge' ? [...files, ...newFiles] : [newFiles[0]]);
    showToast(`Added ${newFiles.length} file(s) successfully.`);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleProcess = async () => {
    if (files.length === 0 && toolId !== 'edit') {
      showToast("Please upload at least one PDF file.", "error");
      return;
    }

    setProcessing(true);
    setProgress(15);

    // Simulate progress steps
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 25;
      });
    }, 400);

    try {
      const realFiles = files.map(f => f.file!).filter(Boolean);
      if (!realFiles.length) throw new Error('The selected PDF could not be read.');
      let blob: Blob;
      let filename = files[0]?.name || 'document.pdf';
      if (toolId === 'merge') { blob = await mergePDF(realFiles); filename = 'merged_document.pdf'; }
      else if (toolId === 'split') { const r = await splitPDF(realFiles[0], splitRanges); blob = r.single || r.blob; filename = r.single ? 'split_document.pdf' : 'split_pdfs.zip'; }
      else if (toolId === 'compress') { const r = await compressPDF(realFiles[0], compressLevel); blob = r.blob; filename = 'compressed_document.pdf'; }
      else if (toolId === 'to-word') { blob = await pdfToWord(realFiles[0]); filename = 'converted_document.docx'; }
      else if (toolId === 'to-excel') { blob = await pdfToExcel(realFiles[0]); filename = 'converted_document.xlsx'; }
      else if (toolId === 'to-ppt') { blob = await pdfToPpt(realFiles[0]); filename = 'converted_document.pptx'; }
      else if (toolId === 'resize') { blob = await resizePDF(realFiles[0], resizePreset as any, isLandscape); filename = 'resized_document.pdf'; }
      else { blob = await editPDF(realFiles[0], newText, editPage); filename = 'edited_document.pdf'; }
      clearInterval(interval); setProgress(100); setProcessing(false);
      setResultBlob(blob); setDownloadUrl(blobUrl(blob));
      (window as any).__pdfmasterDownloadName = filename;
      setResultReady(true); showToast('Operation completed successfully!');
    } catch (err) {
      clearInterval(interval); setProcessing(false);
      showToast(err instanceof Error ? err.message : 'Processing failed.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Tool Header */}
      <div className="flex items-center space-x-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
          <IconComponent size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{currentToolInfo.title}</h1>
          <p className="text-sm text-slate-500">{currentToolInfo.desc}</p>
        </div>
      </div>

      {!resultReady ? (
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          {/* File Upload Area */}
          {files.length === 0 ? (
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 rounded-2xl p-10 text-center transition-all">
              <input type="file" id="tool-file-upload" onChange={handleFileUpload} multiple={toolId === 'merge'} accept=".pdf" className="hidden" />
              <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Upload size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Select PDF file to {toolId}</h3>
              <p className="text-xs text-slate-500 mb-6">Drag and drop or browse from your computer</p>
              <label 
                htmlFor="tool-file-upload"
                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
              >
                Browse Files
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Selected Files ({files.length})</h3>
                {toolId === 'merge' && (
                  <label htmlFor="add-more-files" className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
                    + Add more files
                  </label>
                )}
                <input type="file" id="add-more-files" onChange={handleFileUpload} multiple accept=".pdf" className="hidden" />
              </div>

              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-sm text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(file.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool Specific Configurations */}
          {files.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-6">
              {toolId === 'compress' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Compression Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'recommended', title: 'Recommended', desc: 'Good quality, good reduction' },
                      { id: 'extreme', title: 'Extreme', desc: 'Maximum size reduction, lower quality' },
                      { id: 'less', title: 'Less', desc: 'Highest quality, minimal reduction' },
                    ].map((opt) => (
                      <div 
                        key={opt.id}
                        onClick={() => setCompressLevel(opt.id as any)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${compressLevel === opt.id ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <p className="font-bold text-sm text-slate-800">{opt.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === 'split' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">Page Ranges or Numbers</label>
                  <input 
                    type="text" 
                    value={splitRanges} 
                    onChange={(e) => setSplitRanges(e.target.value)} 
                    placeholder="e.g., 1-3, 5, 8-10" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                  <p className="text-xs text-slate-400">Specify page numbers and/or page ranges separated by commas.</p>
                </div>
              )}

              {toolId === 'resize' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target Page Size</label>
                    <select 
                      value={resizePreset} 
                      onChange={(e) => setResizePreset(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                    >
                      <option value="A4">A4 (Standard)</option>
                      <option value="A3">A3 (Large)</option>
                      <option value="A5">A5 (Compact)</option>
                      <option value="Letter">US Letter</option>
                      <option value="Legal">US Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Orientation</label>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setIsLandscape(false)}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-all ${!isLandscape ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        Portrait
                      </button>
                      <button 
                        onClick={() => setIsLandscape(true)}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-all ${isLandscape ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {toolId === 'edit' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Text to add</label>
                    <input type="text" value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Enter text to place on the PDF" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Page number</label>
                    <input type="number" min={1} value={editPage} onChange={e=>setEditPage(Math.max(1, Number(e.target.value)||1))} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                  </div>
                  <p className="sm:col-span-2 text-xs text-slate-400">Adds the text near the top-left of the selected page. The original PDF content is preserved.</p>
                </div>
              )}

              {/* Processing Progress Bar */}
              {processing && (
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Processing your PDF...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {!processing && (
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleProcess}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
                  >
                    <span>Process PDF Now</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your PDF is ready!</h2>
            <p className="text-sm text-slate-500">Operation completed successfully with secure client processing.</p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <FileText className="text-indigo-600 shrink-0" size={24} />
              <div className="text-left truncate">
                <p className="font-semibold text-sm text-slate-800 truncate">{files[0]?.name || 'document.pdf'}</p>
                <p className="text-xs text-slate-400">Processed successfully</p>
              </div>
            </div>
            <a 
              href={downloadUrl || '#'} 
              download={(window as any).__pdfmasterDownloadName || 'processed_document'} 
              onClick={() => showToast("Download started successfully!")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md flex items-center space-x-2 shrink-0 transition-transform hover:scale-105"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <button 
              onClick={() => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); setResultReady(false); setFiles([]); setDownloadUrl(null); setResultBlob(null); }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
            >
              Process Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// PRICING VIEW
// ==========================================
function PricingView({ showToast }: { showToast: (m: string) => void }) {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Essential tools for casual document tasks.',
      features: ['Basic PDF tools (Merge, Split)', 'Limited file size up to 25MB', 'Up to 5 daily operations', 'Standard processing speed'],
      badge: 'Current Plan',
      highlight: false
    },
    {
      name: 'Pro',
      price: isAnnual ? '$9' : '$12',
      period: 'per month',
      desc: 'Advanced tools and higher limits for power users.',
      features: ['All PDF utilities unlocked', 'Unlimited file size up to 500MB', 'Unlimited daily operations', 'Advanced PDF editing & batch processing', 'Priority cloud processing'],
      badge: 'Most Popular',
      highlight: true
    },
    {
      name: 'Business',
      price: isAnnual ? '$29' : '$39',
      period: 'per month',
      desc: 'Collaborative controls and API access for teams.',
      features: ['Everything in Pro plan', 'Team workspace & management', 'Developer API access', 'Custom branding & watermarking', 'Dedicated 24/7 priority support'],
      badge: 'Enterprise',
      highlight: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-slate-600 text-base">Choose the right plan for your personal or business PDF workflow needs.</p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center p-1.5 bg-slate-200/80 rounded-2xl mt-6">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Monthly Billing
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Annual Billing <span className="text-xs text-indigo-600 font-bold ml-1">Save 25%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <div 
            key={idx}
            className={`bg-white rounded-3xl p-8 flex flex-col justify-between border transition-all duration-300 relative ${plan.highlight ? 'border-indigo-600 shadow-2xl shadow-indigo-600/10 ring-2 ring-indigo-600' : 'border-slate-200 shadow-sm'}`}
          >
            {plan.badge && (
              <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${plan.highlight ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'}`}>
                {plan.badge}
              </span>
            )}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-xs text-slate-500 mb-6">{plan.desc}</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500 ml-2">/ {plan.period}</span>
              </div>

              <div className="space-y-3.5 pt-6 border-t border-slate-100">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center space-x-3 text-sm text-slate-600">
                    <Check size={18} className="text-indigo-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-100">
              <button 
                onClick={() => showToast(`Selected ${plan.name} plan successfully!`)}
                className={`w-full py-4 rounded-xl font-semibold text-sm transition-all shadow-md ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 hover:scale-[1.02]' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
              >
                Get Started with {plan.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// FAQ VIEW
// ==========================================
function FaqView() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: 'How do I merge PDF files?', a: 'Select the Merge PDF tool, upload your PDF files, drag and drop them into your preferred sequence, and click Process. Your combined PDF will be ready in seconds.' },
    { q: 'How can I compress a PDF file?', a: 'Upload your PDF into the Compress PDF tool, select your preferred compression level (Recommended, Extreme, or Less), and download the optimized file.' },
    { q: 'Can I convert PDF documents to Word or Excel?', a: 'Yes! We support high-fidelity conversions from PDF to Word (DOCX), Excel (XLSX), and PowerPoint (PPTX) with preserved formatting and tables.' },
    { q: 'Are my uploaded files secure?', a: 'Absolutely. All files are transferred over 256-bit SSL encryption and are permanently and automatically deleted from our servers after 2 hours.' },
    { q: 'What is the maximum file size supported?', a: 'Free users can upload files up to 25MB. Pro and Business subscribers enjoy file size limits up to 500MB with batch processing.' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="text-slate-600 text-base">Got questions about PDFMaster? We have answers.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-6 text-left font-bold text-slate-900 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-base">{faq.q}</span>
                {isOpen ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-slate-400" />}
              </button>
              {isOpen && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// USER DASHBOARD VIEW
// ==========================================
function UserDashboardView({ user, setUser, setCurrentView }: { user: { name: string; email: string; plan: string } | null; setUser: any; setCurrentView: (v: ViewState) => void }) {
  const recentActivities: RecentActivity[] = [
    { id: '1', filename: 'Q3_Financial_Report.pdf', tool: 'Compress PDF', date: '2 mins ago', status: 'Completed' },
    { id: '2', filename: 'Contract_Agreement_Signed.pdf', tool: 'Merge PDF', date: 'Yesterday', status: 'Completed' },
    { id: '3', filename: 'Invoice_1092.pdf', tool: 'PDF to Excel', date: '3 days ago', status: 'Completed' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Welcome Back</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{user?.name || 'Alex Morgan'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{user?.email || 'alex.morgan@example.com'}</p>
        </div>
        <button 
          onClick={() => { setUser(null); setCurrentView('home'); }}
          className="px-5 py-2.5 bg-rose-50 text-rose-700 font-semibold text-sm rounded-xl hover:bg-rose-100 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Files Processed</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">24</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">↑ 12% this month</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Storage Used</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">142 MB</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">of 1 GB limit</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Daily Operations</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">18 Left</p>
          <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">Resets at midnight</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Current Plan</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{user?.plan || 'Free Tier'}</p>
          </div>
          <button 
            onClick={() => setCurrentView('pricing')} 
            className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">Recent Document Activity</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivities.map((act) => (
            <div key={act.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{act.filename}</p>
                  <p className="text-xs text-slate-400">Tool: {act.tool} • {act.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">{act.status}</span>
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// AUTH MODAL COMPONENT
// ==========================================
function AuthModal({ mode, onClose, onAuth }: { mode: 'login' | 'signup'; onClose: () => void; onAuth: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth({
      name: mode === 'signup' ? name || 'Alex Morgan' : 'Alex Morgan',
      email: email || 'alex@example.com',
      plan: 'Pro Tier'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative space-y-6">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-xs text-slate-500 mt-1">Access all your PDF utilities in one place</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Alex Morgan" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="alex@example.com" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01]"
          >
            {mode === 'login' ? 'Log In' : 'Sign Up Free'}
          </button>
        </form>
      </div>
    </div>
  );
}