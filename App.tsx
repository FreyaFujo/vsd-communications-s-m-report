
import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { ProspectingView } from './views/ProspectingView';
import { ResearchView } from './views/ResearchView';
import { LocalIntelView } from './views/LocalIntelView';
import { CoachingView } from './views/CoachingView';
import { DatabaseView } from './views/DatabaseView';
import { PipelineFunnelView } from './views/PipelineFunnelView';
import { PipelineTrackerView } from './views/PipelineTrackerView';
import { CompetitiveStrategyView } from './views/CompetitiveStrategyView';
import { MarketingPlannerView } from './views/MarketingPlannerView';
import { SettingsView } from './views/SettingsView';
import { ViewState, Lead, Deal, UserProfile } from './types';
import { Menu } from 'lucide-react';
import backupData from './backup_data.json';
import { subscribeToDoc, saveData } from './services/firebase';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- FIREBASE INTEGRATION ---
  // State initialization with defaults
  const [userProfile, setUserProfileState] = useState<UserProfile>({
    name: '',
    role: 'Sales Channel Consultant',
    companyName: 'VSD Communications',
    targetRevenue: '100,000',
    product: '',
    plan: '',
    experience: '',
    industries: '',
    salesStyle: 'Consultative',
    goals: '',
    productAssets: []
  });

  const [leads, setLeadsState] = useState<Lead[]>([]);
  const [deals, setDealsState] = useState<Deal[]>([]);

  // Loading states to prevent flashing empty screens
  const [loading, setLoading] = useState(true);

  // Subscriptions
  useEffect(() => {
    const unsubProfile = subscribeToDoc<UserProfile>('profile', (data) => {
      setUserProfileState(data);
    }, (backupData.profile as unknown as UserProfile));

    const unsubLeads = subscribeToDoc<Lead[]>('leads', (data) => {
      setLeadsState(data);
    }, (backupData.leads as unknown as Lead[]) || []);

    const unsubDeals = subscribeToDoc<Deal[]>('deals', (data) => {
      setDealsState(data);
      setLoading(false); // Assume loaded after deals
    }, (backupData.deals as unknown as Deal[]) || []);

    return () => {
      unsubProfile();
      unsubLeads();
      unsubDeals();
    };
  }, []);

  // Wrappers to sync state to Firebase
  // Note: These simplistic wrappers handle direct value updates. 
  // If components use function updates (prev => ...), we need to handle that.
  // Most simple apps just pass the new array.
  const setUserProfile = (newState: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    let valueToSave: UserProfile;
    if (typeof newState === 'function') {
      valueToSave = newState(userProfile);
    } else {
      valueToSave = newState;
    }
    setUserProfileState(valueToSave); // Optimistic
    saveData('profile', valueToSave);
  };

  const setLeads = (newState: Lead[] | ((prev: Lead[]) => Lead[])) => {
    let valueToSave: Lead[];
    if (typeof newState === 'function') {
      valueToSave = newState(leads);
    } else {
      valueToSave = newState;
    }
    setLeadsState(valueToSave); // Optimistic
    saveData('leads', valueToSave);
  };

  const setDeals = (newState: Deal[] | ((prev: Deal[]) => Deal[])) => {
    let valueToSave: Deal[];
    if (typeof newState === 'function') {
      valueToSave = newState(deals);
    } else {
      valueToSave = newState;
    }
    setDealsState(valueToSave); // Optimistic
    saveData('deals', valueToSave);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} userProfile={userProfile} deals={deals} leads={leads} />;
      case 'funnel':
        return <PipelineFunnelView deals={deals} leads={leads} />;
      case 'tracker':
        return <PipelineTrackerView deals={deals} setDeals={setDeals} leads={leads} />;
      case 'marketing_planner':
        return <MarketingPlannerView userProfile={userProfile} deals={deals} />;
      case 'competitive_strategy':
        return <CompetitiveStrategyView userProfile={userProfile} deals={deals} setDeals={setDeals} />;
      case 'database':
        return <DatabaseView leads={leads} setLeads={setLeads} deals={deals} setDeals={setDeals} />;
      case 'prospecting':
        return <ProspectingView />;
      case 'research':
        return <ResearchView />;
      case 'local':
        return <LocalIntelView />;
      case 'coaching':
        return <CoachingView userProfile={userProfile} />;
      case 'settings':
        return <SettingsView profile={userProfile} onUpdate={setUserProfile} />;
      default:
        return <DashboardView onNavigate={setCurrentView} userProfile={userProfile} deals={deals} leads={leads} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navigation
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: 'lightblue', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'blue', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <text x="10" y="65" fill="url(#logoGradient)" fontSize="80" fontWeight="900" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="-4">VSD</text>
              <text x="12" y="90" fill="url(#logoGradient)" fontSize="22" fontWeight="600" fontFamily="Arial, sans-serif" fontStyle="italic" letterSpacing="0">Communications</text>
            </svg>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 h-full overflow-hidden relative w-full">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
