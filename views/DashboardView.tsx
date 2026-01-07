
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Target, Users, TrendingUp, Sparkles, BarChart3, Wallet, ChevronRight, FileSignature, Receipt, CheckCircle2, LayoutDashboard as DashboardIcon } from 'lucide-react';
import { getQuickMotivation } from '../services/geminiService';
import { UserProfile, Deal, Lead } from '../types';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  userProfile: UserProfile;
  deals: Deal[];
  leads: Lead[];
}

const MONTHS_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, userProfile, deals, leads }) => {
  const [quote, setQuote] = useState("Loading motivation...");

  useEffect(() => {
    getQuickMotivation(userProfile).then(setQuote);
  }, [userProfile]);

  const totalWon = deals.filter(d => d.pipelineStatus === 'Won').reduce((acc, curr) => acc + curr.value, 0);
  const activeDeals = deals.filter(d => d.pipelineStatus !== 'Won' && d.pipelineStatus !== 'Closed');
  
  const targetRevenue = parseFloat(userProfile.targetRevenue.replace(/[^0-9.]/g, '')) || 100000;
  
  const conversionRate = deals.length > 0 
    ? Math.round((deals.filter(d => d.pipelineStatus === 'Won').length / deals.length) * 100) 
    : 0;

  const calculateWeightedForecast = () => {
    const weights: Record<string, number> = {
      'Prospecting': 0.1,
      'Potential': 0.3,
      'Solutioning': 0.6,
      'Negotiation': 0.9,
      'Won': 1.0,
      'Closed': 0.0
    };
    return activeDeals.reduce((acc, deal) => {
      const weight = weights[deal.pipelineStatus] || 0;
      return acc + (deal.value * weight);
    }, 0);
  };

  const forecastedRevenue = calculateWeightedForecast();
  const rawPipelineValue = activeDeals.reduce((acc, d) => acc + d.value, 0);

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-MY', { 
    style: 'currency', 
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);

  type ForecastItem = { deal: Deal, type: 'PO' | 'Invoice', pct: number };
  
  const groupItemsByMonth = (items: ForecastItem[]) => {
      const grouped: Record<string, ForecastItem[]> = {};
      items.forEach(item => {
          const month = item.type === 'PO' ? (item.deal.forecastedPoMonth || 'Unscheduled') : (item.deal.estimatedInvoiceMonth || 'Unscheduled');
          if (!grouped[month]) grouped[month] = [];
          grouped[month].push(item);
      });
      return grouped;
  };

  const probableItems: ForecastItem[] = [];
  deals.forEach(d => {
      if (d.pipelineStatus === 'Closed') return;
      if (d.forecastedPoPercentage === 75) probableItems.push({ deal: d, type: 'PO', pct: 75 });
      if (d.forecastedInvoicePercentage === 50) probableItems.push({ deal: d, type: 'Invoice', pct: 50 });
  });

  const confirmedItems: ForecastItem[] = [];
  deals.forEach(d => {
      if (d.forecastedPoPercentage === 100) confirmedItems.push({ deal: d, type: 'PO', pct: 100 });
      if (d.forecastedInvoicePercentage === 100) confirmedItems.push({ deal: d, type: 'Invoice', pct: 100 });
  });

  const probableByMonth = groupItemsByMonth(probableItems);
  const confirmedByMonth = groupItemsByMonth(confirmedItems);

  const sortedMonths = (data: Record<string, any>) => {
      return Object.keys(data).sort((a, b) => {
          const idxA = MONTHS_ORDER.indexOf(a);
          const idxB = MONTHS_ORDER.indexOf(b);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
  };

  const renderForecastList = (groupedData: Record<string, ForecastItem[]>, emptyMsg: string, isConfirmed: boolean) => {
      const months = sortedMonths(groupedData);
      if (months.length === 0) return <div className="text-center py-6 text-slate-300 font-bold italic text-lg">{emptyMsg}</div>;

      return (
          <div className="space-y-4">
              {months.map(month => (
                  <div key={month} className="bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2 bg-slate-200/50 border-b border-slate-200 flex justify-between items-center">
                          <span className="text-[12px] font-black text-slate-700 uppercase tracking-[0.1em]">{month}</span>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase">{groupedData[month].length} Items</span>
                      </div>
                      <div className="divide-y divide-slate-200">
                          {groupedData[month].map((item, idx) => (
                              <div key={`${item.deal.id}-${item.type}-${idx}`} className="p-4 hover:bg-white transition-colors flex justify-between items-start">
                                  <div className="min-w-0 pr-4">
                                      <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">{item.deal.companyName}</div>
                                      <div className="font-extrabold text-slate-900 text-base leading-tight mb-2">{item.deal.description}</div>
                                      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.type === 'PO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                          {item.type === 'PO' ? <FileSignature size={12} /> : <Receipt size={12} />}
                                          {item.type} Target
                                      </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                      <div className="font-black text-slate-900 text-lg leading-none mb-1">{fmtMoney(item.deal.value)}</div>
                                      <div className={`text-[12px] font-black uppercase tracking-widest ${isConfirmed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                          {item.pct}% PROBABILITY
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header - Scalable Typography */}
      <div className="p-6 md:p-8 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-[1800px] mx-auto">
            <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                    <DashboardIcon size={32} className="text-blue-600" />
                    Executive Sales Terminal
                </h2>
                <p className="text-slate-500 mt-2 font-semibold text-lg md:text-xl">
                    Performance Intelligence for {userProfile?.name || 'Partner'}.
                </p>
            </div>
            <div className="text-right hidden md:block">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Current Operating Period</p>
                <p className="text-slate-900 font-extrabold text-xl">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
        <div className="max-w-[1800px] mx-auto space-y-10">
          
          {/* Top KPI Grid - Optimized padding */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Realized Revenue', value: totalWon, target: `Goal: ${fmtMoney(targetRevenue)}`, icon: <Wallet />, color: 'blue', progress: (totalWon / targetRevenue) * 100 },
                { label: 'Weighted Forecast', value: forecastedRevenue, target: `Pipeline: ${fmtMoney(rawPipelineValue)}`, icon: <TrendingUp />, color: 'emerald', progress: null },
                { label: 'Active Opportunities', value: leads.length, target: `${leads.length} Contacts Linked`, icon: <Users />, color: 'indigo', progress: null },
                { label: 'Pipeline Win Rate', value: `${conversionRate}%`, target: 'Based on Closed Deals', icon: <BarChart3 />, color: 'purple', progress: null },
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-2xl`}>{kpi.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest bg-${kpi.color}-50 px-3 py-1.5 rounded-full text-${kpi.color}-700 border border-${kpi.color}-100`}>
                      {kpi.target}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{typeof kpi.value === 'number' ? fmtMoney(kpi.value) : kpi.value}</h3>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.15em] mt-1">{kpi.label}</p>
                  </div>
                  {kpi.progress !== null && (
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
                      <div className={`bg-${kpi.color}-600 h-full rounded-full transition-all duration-1000`} style={{ width: `${Math.min(kpi.progress, 100)}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Forecast Section - 15% Smaller Boxes, Larger Text */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* High Probability Box */}
              <div className="bg-white p-6 md:p-7 rounded-[2rem] shadow-xl border-t-8 border-t-amber-400 border-x border-b border-slate-100 flex flex-col min-h-[400px]">
                  <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                      <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tight flex items-center gap-3">
                          <TrendingUp className="text-amber-500" size={28} />
                          Forecast Intel
                      </h3>
                      <div className="text-[14px] font-black bg-amber-50 text-amber-700 px-4 py-2 rounded-xl uppercase tracking-[0.1em] border-2 border-amber-100 shadow-sm">
                          PO 75% | INV 50%
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {renderForecastList(probableByMonth, "No priority forecasts detected.", false)}
                  </div>
              </div>

              {/* Confirmed / Secured Box */}
              <div className="bg-white p-6 md:p-7 rounded-[2rem] shadow-xl border-t-8 border-t-emerald-500 border-x border-b border-slate-100 flex flex-col min-h-[400px]">
                  <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                      <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tight flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-600" size={28} />
                          Confirmed Revenue
                      </h3>
                      <div className="text-[14px] font-black bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl uppercase tracking-[0.1em] border-2 border-emerald-100 shadow-sm">
                          100% Probability
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {renderForecastList(confirmedByMonth, "Awaiting secured contracts.", true)}
                  </div>
              </div>
          </div>

          {/* Pulse and Motivation - Scaled for readability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Strategy Pulse - BIGGER FONTS */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active Strategy Pulse</h3>
                      <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-xs font-black text-green-700 uppercase tracking-widest">System Live</span>
                      </div>
                  </div>
                  <ul className="space-y-6">
                      {[
                        { title: 'Review Pipeline Health', sub: 'Analyze stage conversion & leakage', icon: <BarChart3 />, color: 'orange', view: 'funnel' },
                        { title: 'Track & Log Deal Activities', sub: 'Update deal status & next steps', icon: <Target />, color: 'blue', view: 'tracker' },
                        { title: 'Plan Marketing Content', sub: 'Generate AI posts & emails', icon: <Sparkles />, color: 'purple', view: 'marketing_planner' },
                      ].map((pulse, i) => (
                        <li key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] hover:bg-white hover:shadow-xl cursor-pointer transition-all border-2 border-transparent hover:border-indigo-100 group" onClick={() => onNavigate(pulse.view)}>
                          <div className={`p-4 bg-white rounded-2xl shadow-md text-${pulse.color}-500 group-hover:scale-110 transition-transform`}>
                              {/* Fix: provide a generic type that includes the expected 'size' prop to satisfy TS */}
                              {React.cloneElement(pulse.icon as React.ReactElement<{ size?: number }>, { size: 28 })}
                          </div>
                          <div className="flex-1">
                              <span className="text-xl md:text-2xl font-black text-slate-900 block leading-tight mb-1">{pulse.title}</span>
                              <span className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-wide">{pulse.sub}</span>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={32} />
                        </li>
                      ))}
                  </ul>
              </div>

              {/* Motivation Box - 15% Smaller UI, High Impact Text */}
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-white relative overflow-hidden flex flex-col justify-center border-b-[12px] border-indigo-600 group min-h-[400px]">
                  <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-3">
                          <Sparkles size={24} className="text-indigo-400" />
                          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-400">Consultant Briefing</h3>
                      </div>
                      <p className="text-white text-3xl md:text-4xl font-black italic leading-[1.1] tracking-tight">
                          "{quote}"
                      </p>
                      <div className="pt-6">
                          <button 
                            onClick={() => onNavigate('coaching')}
                            className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl text-sm hover:bg-indigo-50 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.2)] uppercase tracking-[0.2em] active:scale-95 flex items-center gap-3"
                          >
                            Access AI Performance Coach <ChevronRight size={18} strokeWidth={3} />
                          </button>
                      </div>
                  </div>
                  <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600 opacity-20 rounded-full blur-[100px] group-hover:opacity-40 transition-opacity duration-1000"></div>
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-600 opacity-20 rounded-full blur-[100px] group-hover:opacity-40 transition-opacity duration-1000"></div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayoutDashboardIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="9" rx="2" fill="#2563EB"/>
        <rect x="14" y="3" width="7" height="5" rx="2" fill="#93C5FD"/>
        <rect x="14" y="12" width="7" height="9" rx="2" fill="#60A5FA"/>
        <rect x="3" y="16" width="7" height="5" rx="2" fill="#BFDBFE"/>
    </svg>
);
