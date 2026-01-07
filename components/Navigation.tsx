
import React from 'react';
import { LayoutDashboard, Users, Search, Map, MessageSquareQuote, Settings, Database, Filter, ListChecks, Target, Swords, X, CalendarDays, Crosshair, Share2 } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'funnel', label: 'Pipeline Funnel', icon: <Filter size={20} /> },
    { id: 'database', label: 'Lead Database', icon: <Database size={20} /> },
    { id: 'tracker', label: 'Pipeline Tracker', icon: <ListChecks size={20} /> },
    { id: 'prospecting', label: 'Lead Prospecting', icon: <Users size={20} /> },
    { id: 'marketing_planner', label: 'Marketing Planner', icon: <CalendarDays size={20} /> },
    { id: 'competitive_strategy', label: 'Strategy Hub', icon: <Crosshair size={20} /> },
    { id: 'research', label: 'Deep Research', icon: <Search size={20} /> },
    { id: 'local', label: 'Local Intel', icon: <Map size={20} /> },
    { id: 'coaching', label: 'AI Coach', icon: <MessageSquareQuote size={20} /> },
  ];

  const handleNavClick = (id: ViewState) => {
    onNavigate(id);
    onClose();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("App Link copied to clipboard! Share this URL with your team.");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-800
        md:translate-x-0 md:static md:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-8 border-b border-slate-800 flex flex-col justify-center relative">
          <div className="flex items-center justify-between">
               {/* Company Logo - VSD Communications */}
               <div className="flex-1">
                  <svg viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-56 h-auto">
                    {/* VSD Text matching image style - Bold Italic - White */}
                    <text x="10" y="65" fill="white" fontSize="80" fontWeight="900" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="-4">VSD</text>
                    
                    {/* Communications Text - White */}
                    <text x="12" y="90" fill="white" fontSize="22" fontWeight="600" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="0">Communications</text>
                  </svg>
               </div>
               
               {/* Mobile Close Button */}
               <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
                 <X size={24} />
               </button>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 pl-3">Intelligent Sales Platform</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-4">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group
                    ${currentView === item.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <span className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-3">
          <div className="mb-4 px-2 flex flex-col items-center justify-center gap-1 opacity-80">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">By</span>
              <div className="flex items-center gap-2">
                  <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-auto">
                    <text x="0" y="32" fill="white" fontSize="40" fontWeight="900" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="-2">VSD</text>
                    <text x="85" y="32" fill="white" fontSize="14" fontWeight="600" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="0">Communications</text>
                  </svg>
              </div>
          </div>
          <button 
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-xl group"
          >
            <Share2 size={18} className="text-indigo-400 group-hover:text-white transition-colors" />
            Share Application
          </button>
          <button 
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-xl
              ${currentView === 'settings' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Settings size={18} />
            System Settings
          </button>
        </div>
      </div>
    </>
  );
};
