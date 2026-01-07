
import React, { useState, useEffect } from 'react';
import { Swords, Plus, Sparkles, Trash2, Loader2, Save, Newspaper, CheckCircle2, ChevronRight, Link as LinkIcon, Unlink, X, Briefcase, Hash, BrainCircuit, Clipboard, HelpCircle, Target, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import { analyzeCompetitor, generateIntegratedStrategy, suggestCompetitorNotes } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Competitor, UserProfile, Deal } from '../types';

interface CompetitiveStrategyViewProps {
  userProfile?: UserProfile;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
}

export const CompetitiveStrategyView: React.FC<CompetitiveStrategyViewProps> = ({ userProfile, deals, setDeals }) => {
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    const saved = localStorage.getItem('vsd_competitors');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Competitor Alpha',
        swotAnalysis: '**Strengths:** Global reach, cloud-native.\n**Weaknesses:** High cost, complex support.',
        recentNews: 'Recently acquired a cybersecurity startup.',
        notes: 'Aggressive in government tenders.'
      }
    ];
  });

  const [selectedCompId, setSelectedCompId] = useState<string>(competitors[0]?.id || '');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [suggestingNotesId, setSuggestingNotesId] = useState<string | null>(null);
  const [strategyContext, setStrategyContext] = useState('');
  const [generatedStrategy, setGeneratedStrategy] = useState('');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState('');

  useEffect(() => {
    localStorage.setItem('vsd_competitors', JSON.stringify(competitors));
  }, [competitors]);

  const selectedCompetitor = competitors.find(c => c.id === selectedCompId);
  const associatedDeals = deals.filter(d => d.linkedCompetitorId === selectedCompId);
  const availableDeals = deals.filter(d => !d.linkedCompetitorId);

  const handleAnalyzeCompetitor = async (id: string) => {
    const comp = competitors.find(c => c.id === id);
    if (!comp) return;
    setAnalyzingId(id);
    setSelectedCompId(id);
    try {
      const response = await analyzeCompetitor(comp.name);
      let swot = "Analysis failed.";
      let news = "";
      try {
        if (response.text) {
          const json = JSON.parse(response.text);
          swot = json.swot || response.text;
          news = json.news || "";
        }
      } catch (parseError) {
        swot = response.text || "Analysis failed.";
      }
      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, swotAnalysis: swot, recentNews: news } : c));
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSuggestNotes = async (id: string) => {
    const comp = competitors.find(c => c.id === id);
    if (!comp) return;

    setSuggestingNotesId(id);
    try {
      const suggestions = await suggestCompetitorNotes(comp.swotAnalysis, comp.recentNews, userProfile);
      const timestamp = new Date().toLocaleDateString();
      const newNote = `\n\n--- AI STRATEGIC INTEL [${timestamp}] ---\n${suggestions}\n--- END INTEL ---\n`;
      
      setCompetitors(prev => prev.map(c => 
        c.id === id 
          ? { ...c, notes: (c.notes || "") + newNote }
          : c
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setSuggestingNotesId(null);
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleLinkDeal = (dealId: string) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, linkedCompetitorId: selectedCompId } : d));
    setShowLinkModal(false);
  };

  const handleUnlinkDeal = (dealId: string) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, linkedCompetitorId: undefined } : d));
  };

  const handleGenerateAttackPlan = async () => {
    if (!strategyContext.trim()) return;
    setIsGeneratingStrategy(true);
    try {
      const response = await generateIntegratedStrategy(strategyContext, selectedCompetitor, userProfile, associatedDeals);
      setGeneratedStrategy(response.text || "Strategy generation failed.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitorName.trim()) return;
    const newComp: Competitor = {
      id: Date.now().toString(),
      name: newCompetitorName,
      swotAnalysis: 'AI SWOT analysis pending...',
      recentNews: '',
      notes: ''
    };
    setCompetitors([...competitors, newComp]);
    setSelectedCompId(newComp.id);
    setNewCompetitorName('');
    setShowAddForm(false);
  };

  const handleDeleteCompetitor = (id: string) => {
    if (window.confirm('Remove this competitor from intelligence hub?')) {
      const newComps = competitors.filter(c => c.id !== id);
      setCompetitors(newComps);
      setDeals(prev => prev.map(d => d.linkedCompetitorId === id ? { ...d, linkedCompetitorId: undefined } : d));
      
      if (selectedCompId === id && newComps.length > 0) setSelectedCompId(newComps[0].id);
      else if (newComps.length === 0) setSelectedCompId('');
    }
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="text-red-600" />
            Competitive Strategy Hub
          </h2>
          <p className="text-slate-500 mt-1 font-medium hidden md:block">
            Synthesize market intel and deal dynamics into a master attack plan.
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowAddForm(true)}
                className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 text-xs"
            >
                <Plus size={18} /> New Competitor
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto h-1/3 lg:h-full custom-scrollbar">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Rivals</span>
              <ShieldCheck size={14} className="text-slate-300" />
          </div>

          {showAddForm && (
            <form onSubmit={handleAddCompetitor} className="p-4 border-b-2 border-red-100 bg-red-50/30 animate-in slide-in-from-top duration-200">
              <input 
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-black font-bold mb-3 focus:border-red-500 outline-none shadow-sm"
                placeholder="Competitor Name..."
                value={newCompetitorName}
                onChange={e => setNewCompetitorName(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white text-xs py-2 rounded-lg font-black uppercase tracking-wider">Save</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 text-xs py-2 rounded-lg font-black uppercase tracking-wider">Cancel</button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {competitors.map(comp => (
              <div 
                key={comp.id}
                onClick={() => setSelectedCompId(comp.id)}
                className={`p-4 cursor-pointer transition-all border-l-4 group relative ${
                    selectedCompId === comp.id 
                      ? 'bg-slate-900 border-red-500 shadow-xl scale-[1.02] z-10 ring-2 ring-red-600/30' 
                      : 'hover:bg-slate-50 border-transparent bg-white border-b border-slate-50'
                  }`}
              >
                <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-3">
                        <div className={`font-black text-sm truncate transition-colors ${selectedCompId === comp.id ? 'text-white' : 'text-slate-950'}`}>
                            {comp.name}
                        </div>
                        <div className={`text-[11px] font-bold mt-1 uppercase tracking-wider truncate transition-colors ${selectedCompId === comp.id ? 'text-red-200' : 'text-slate-500'}`}>
                            {selectedCompId === comp.id ? 'Active Intelligence' : (comp.swotAnalysis.includes('pending') ? 'Analysis Needed' : 'View Intel')}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleAnalyzeCompetitor(comp.id); }}
                            className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest ${
                                selectedCompId === comp.id 
                                    ? 'bg-red-600 text-white hover:bg-red-500' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600'
                            }`}
                            title="Generate AI SWOT Analysis"
                        >
                            {analyzingId === comp.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            <span className="hidden xl:inline">AI SWOT</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCompetitor(comp.id); }}
                            className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${selectedCompId === comp.id ? 'text-slate-500 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 h-2/3 lg:h-full bg-slate-50 custom-scrollbar">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-50/30 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <Zap className="text-amber-500" />
                                    Strategic Briefing
                                </h3>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                    {selectedCompetitor ? `Situation vs ${selectedCompetitor.name}` : "General Market Strategy"}
                                </p>
                            </div>
                            {selectedCompetitor && (
                                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm animate-pulse">
                                    <Swords size={14} /> Competitive Mode
                                </div>
                            )}
                        </div>

                        <textarea 
                            className="w-full h-40 p-6 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:ring-4 focus:ring-red-50 outline-none resize-none text-slate-900 font-bold bg-white shadow-inner transition-all text-lg placeholder-slate-400 relative z-10"
                            placeholder="Describe current deal friction points, stakeholder concerns, and specific competitor claims..."
                            value={strategyContext}
                            onChange={(e) => setStrategyContext(e.target.value)}
                        />

                        <div className="mt-6 flex justify-end relative z-10">
                            <button 
                                onClick={handleGenerateAttackPlan}
                                disabled={isGeneratingStrategy || !strategyContext.trim()}
                                className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                            >
                                {isGeneratingStrategy ? <Loader2 className="animate-spin" /> : <BrainCircuit size={24} className="text-red-400" />}
                                Generate Attack Plan
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
                            <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Target className="text-red-600" />
                                AI Strategic Plan
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isGeneratingStrategy ? (
                                <div className="flex flex-col items-center justify-center h-full gap-8 text-slate-400 py-20">
                                    <Loader2 size={80} className="animate-spin text-red-600 opacity-20" />
                                    <p className="font-black uppercase tracking-[0.3em] text-xl text-slate-900 animate-pulse">Synthesizing Intel...</p>
                                </div>
                            ) : generatedStrategy ? (
                                <div className="prose prose-slate prose-lg max-w-none text-slate-900 prose-headings:text-black prose-p:text-slate-900 prose-strong:text-black prose-ul:text-slate-900">
                                    <MarkdownRenderer content={generatedStrategy} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                                    <Target size={120} className="text-slate-300 mb-6" />
                                    <p className="text-center font-black uppercase tracking-[0.2em] text-slate-400">Provide briefing details above to start</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border-2 border-emerald-50 shadow-xl flex flex-col relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/30 -mr-24 -mt-24 rounded-full transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-emerald-100 relative z-10">
                            <h4 className="font-black text-xl text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                                <Briefcase size={22} className="text-emerald-600" />
                                Associated Deals
                            </h4>
                            <button 
                                onClick={() => setShowLinkModal(true)}
                                disabled={!selectedCompId}
                                className="p-2 bg-emerald-600 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        
                        <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {associatedDeals.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <LinkIcon size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No deals linked</p>
                                </div>
                            ) : (
                                associatedDeals.map(deal => (
                                    <div key={deal.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group/deal">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                                    {deal.quotationNo || 'UNTRACKED'}
                                                </span>
                                                <span className="text-slate-900 font-black text-xs truncate">{deal.description}</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{deal.companyName}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleUnlinkDeal(deal.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/deal:opacity-100 transition-all ml-2"
                                        >
                                            <Unlink size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border-2 border-indigo-50 shadow-2xl flex flex-col h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/30 -mr-24 -mt-24 rounded-full transition-transform group-hover:scale-110"></div>
                        
                        {/* Section 1: SWOT Display */}
                        <div className="flex flex-col gap-4 mb-6 relative z-10">
                            <h4 className="font-black text-xl text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                                <Clipboard size={24} className="text-indigo-600"/>
                                Market Intelligence (SWOT)
                            </h4>
                            <div className="p-6 bg-white rounded-xl border-2 border-slate-200 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                                <div className="prose prose-slate prose-base max-w-none text-slate-800 prose-headings:text-indigo-900 prose-headings:font-black prose-p:text-slate-800 prose-li:text-slate-800 prose-strong:text-indigo-700">
                                    <MarkdownRenderer content={selectedCompetitor?.swotAnalysis || 'No analysis generated.'} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Notes & AI Generation */}
                        <div className="flex-1 flex flex-col relative z-10 pt-6 border-t border-indigo-50">
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-lg text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                    <BrainCircuit size={20} className="text-indigo-600"/>
                                    Consultant Observations
                                </h4>
                                <button 
                                    onClick={() => selectedCompetitor && handleSuggestNotes(selectedCompetitor.id)}
                                    disabled={suggestingNotesId === selectedCompId || !selectedCompetitor}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {suggestingNotesId === selectedCompId ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-300" />}
                                    Generate Strategy Notes
                                </button>
                             </div>

                            <textarea 
                                className="flex-1 w-full resize-none outline-none text-lg text-slate-900 font-medium placeholder-slate-400 p-6 rounded-2xl bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-sm leading-relaxed min-h-[200px]"
                                placeholder="Log manual observations or use AI to synthesize SWOT into strategic notes..."
                                value={selectedCompetitor?.notes || ''}
                                onChange={(e) => selectedCompetitor && handleUpdateNotes(selectedCompetitor.id, e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showLinkModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <LinkIcon className="text-emerald-400" />
                          <h3 className="font-black text-xl uppercase tracking-tight">Link Active Deal</h3>
                      </div>
                      <button onClick={() => setShowLinkModal(false)} className="text-white/60 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                          Available opportunities for association
                      </p>
                      <div className="space-y-3">
                          {availableDeals.length === 0 ? (
                              <div className="text-center py-10 text-slate-300 font-bold italic">No unassociated deals found.</div>
                          ) : (
                              availableDeals.map(deal => (
                                  <button 
                                      key={deal.id}
                                      onClick={() => handleLinkDeal(deal.id)}
                                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl transition-all text-left group"
                                  >
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <Hash size={12} className="text-slate-400" />
                                              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{deal.quotationNo || 'NO QUOTE'}</span>
                                          </div>
                                          <div className="font-bold text-slate-600 text-sm leading-tight">{deal.description}</div>
                                          <div className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{deal.companyName}</div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                          <div className="text-xs font-black text-slate-900">{fmtMoney(deal.value)}</div>
                                          <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Link Deal →</div>
                                      </div>
                                  </button>
                              ))
                          )}
                      </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={() => setShowLinkModal(false)}
                        className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
