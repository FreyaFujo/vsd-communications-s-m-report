
import React, { useState, useMemo, useRef } from 'react';
import { 
  ListChecks, Plus, Calendar, User, X, ShieldCheck, History, 
  CheckCircle2, Hash, CalendarPlus, Briefcase, Info, HelpCircle, 
  TrendingUp, FileText, Lock, ArrowRight, Activity, Zap, TrendingDown,
  Target, BarChart3, Download, Upload, UserCog, Lightbulb, FileSpreadsheet,
  ChevronDown, Check, Paperclip, Clock, Smartphone, Mail, Video, Users, MapPin, Phone, Save, Sparkles
} from 'lucide-react';
import { Deal, Lead, ActivityLogEntry } from '../types';

interface PipelineTrackerViewProps {
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  leads: Lead[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PO_CHANCES = [
  { value: 0, label: '0% (No Chance)' },
  { value: 25, label: '25% (Low - >3 Competitors)' },
  { value: 50, label: '50% (Half - Final 2)' },
  { value: 75, label: '75% (High - No Competitors)' },
  { value: 100, label: '100% (Confirmed)' },
];

const INV_CHANCES = [
  { value: 0, label: '0% (In Discussion)' },
  { value: 50, label: '50% (Pending Confirmation)' },
  { value: 100, label: '100% (Delivered)' },
];

const ACTIVITY_TYPES = ['Phone', 'WhatsApp', 'Email', 'Online Meeting', 'Physical Meeting'];

export const PipelineTrackerView: React.FC<PipelineTrackerViewProps> = ({ deals, setDeals, leads }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestionDeal, setSuggestionDeal] = useState<Deal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Costing File Upload State
  const [uploadingDealId, setUploadingDealId] = useState<string | null>(null);
  const costingInputRef = useRef<HTMLInputElement>(null);
  const [newDealCosting, setNewDealCosting] = useState<File | null>(null);
  const newDealFileRef = useRef<HTMLInputElement>(null);

  const [selectedDealForDetails, setSelectedDealForDetails] = useState<Deal | null>(null);
  
  // Pending Forecast State for "Confirm" functionality
  const [pendingForecasts, setPendingForecasts] = useState<Record<string, Partial<Deal>>>({});

  // Inline edit states
  const [editDecisionMaker, setEditDecisionMaker] = useState('');
  const [editQuotationNo, setEditQuotationNo] = useState('');
  const [editValue, setEditValue] = useState('');

  // New Activity Log State
  const [newActivityDate, setNewActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [newActivityType, setNewActivityType] = useState('Phone');
  const [newActivityNotes, setNewActivityNotes] = useState('');

  const [formData, setFormData] = useState<Partial<Deal>>({
    date: new Date().toISOString().split('T')[0],
    pipelineStatus: 'Prospecting',
    value: 0,
    activity: '',
    quotationNo: '',
    decisionMaker: ''
  });

  // Advanced Pipeline Analytics Calculation
  const metrics = useMemo(() => {
    const getCumulativeCount = (stages: string[]) => 
      deals.filter(d => stages.includes(d.pipelineStatus)).length;

    const counts = {
      Prospecting: getCumulativeCount(['Prospecting', 'Potential', 'Solutioning', 'Negotiation', 'Won']),
      Potential: getCumulativeCount(['Potential', 'Solutioning', 'Negotiation', 'Won']),
      Solutioning: getCumulativeCount(['Solutioning', 'Negotiation', 'Won']),
      Negotiation: getCumulativeCount(['Negotiation', 'Won']),
      Won: getCumulativeCount(['Won']),
    };

    const calcConv = (current: number, previous: number) => 
      previous === 0 ? 0 : Math.round((current / previous) * 100);

    const stageData = [
      { 
        id: 'Prospecting', 
        label: 'Prospecting', 
        cumulative: counts.Prospecting,
        conv: 100,
        dropOff: 0,
        theme: { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200', pill: 'bg-indigo-100 text-indigo-700' },
        hint: "Total qualified outreach baseline. All leads start here." 
      },
      { 
        id: 'Potential', 
        label: 'Qualified', 
        cumulative: counts.Potential,
        conv: calcConv(counts.Potential, counts.Prospecting),
        dropOff: 100 - calcConv(counts.Potential, counts.Prospecting),
        theme: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', pill: 'bg-blue-100 text-blue-700' },
        hint: "Deals with identified business needs and high probability. High drop-off from Prospecting suggests poor lead quality." 
      },
      { 
        id: 'Solutioning', 
        label: 'Solutioning', 
        cumulative: counts.Solutioning,
        conv: calcConv(counts.Solutioning, counts.Potential),
        dropOff: 100 - calcConv(counts.Solutioning, counts.Potential),
        theme: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', pill: 'bg-purple-100 text-purple-700' },
        hint: "Formal proposal or solution design in progress. Leakage here might indicate value/price mismatch or complex requirements." 
      },
      { 
        id: 'Negotiation', 
        label: 'Negotiation', 
        cumulative: counts.Negotiation,
        conv: calcConv(counts.Negotiation, counts.Solutioning),
        dropOff: 100 - calcConv(counts.Negotiation, counts.Solutioning),
        theme: { bg: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-200', pill: 'bg-violet-100 text-violet-700' },
        hint: "Finalizing contract details and pricing. Losses usually stem from commercial terms, strong competitor bids, or budget constraints." 
      },
      { 
        id: 'Won', 
        label: 'Closed Won', 
        cumulative: counts.Won,
        conv: calcConv(counts.Won, counts.Negotiation),
        dropOff: 100 - calcConv(counts.Won, counts.Negotiation),
        theme: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-700' },
        hint: "Successfully closed business, contracts finalized, and revenue realized. The ultimate goal!" 
      },
    ];

    const globalWinRate = calcConv(counts.Won, counts.Prospecting);

    return { stageData, globalWinRate };
  }, [deals]);

  const insights = useMemo(() => {
    const criticalDropOffs = metrics.stageData
        .filter(s => s.dropOff > 50 && s.id !== 'Prospecting')
        .map(s => s.label);
    
    return {
        hasIssues: criticalDropOffs.length > 0,
        text: criticalDropOffs.length > 0 
            ? `Constraint Detected: High pipeline leakage in ${criticalDropOffs.join(', ')} stages. Immediate focus required on qualification criteria or closing mechanics.` 
            : "Pipeline Health is Strong. Conversion rates are consistent across all gates.",
        color: criticalDropOffs.length > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: criticalDropOffs.length > 0 ? <TrendingDown size={18} className="text-amber-600" /> : <TrendingUp size={18} className="text-emerald-600" />
    };
  }, [metrics]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLeadId = e.target.value;
    const selectedLead = leads.find(l => l.id === selectedLeadId);
    if (selectedLead) {
      setFormData(prev => ({
        ...prev,
        contactPersonId: selectedLead.id,
        contactPersonName: selectedLead.name,
        companyName: selectedLead.companyName
      }));
    }
  };

  const handleStatusUpdate = (id: string, newStatus: Deal['pipelineStatus']) => {
    setDeals(prev => {
      const deal = prev.find(d => d.id === id);
      const now = new Date().toISOString();
      const updated = prev.map(d => d.id === id ? { 
        ...d, 
        pipelineStatus: newStatus,
        stageHistory: [...(d.stageHistory || []), { stage: newStatus, date: now }]
      } : d);
      
      if (deal && (newStatus === 'Prospecting' || newStatus === 'Potential')) {
        setSuggestionDeal(deal);
      }
      return updated;
    });
  };

  // Forecast Logic - Pending State
  const handlePendingForecastChange = (id: string, field: keyof Deal, value: any) => {
    setPendingForecasts(prev => ({
        ...prev,
        [id]: {
            ...prev[id],
            [field]: value
        }
    }));
  };

  const saveForecast = (id: string) => {
    const changes = pendingForecasts[id];
    if (!changes) return;
    
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...changes } : d));
    
    const newPending = { ...pendingForecasts };
    delete newPending[id];
    setPendingForecasts(newPending);
  };

  const cancelForecast = (id: string) => {
    const newPending = { ...pendingForecasts };
    delete newPending[id];
    setPendingForecasts(newPending);
  };

  const startInlineEdit = (deal: Deal) => {
    setEditingId(deal.id);
    setEditDecisionMaker(deal.decisionMaker);
    setEditQuotationNo(deal.quotationNo || '');
    setEditValue(deal.value.toString());
  };

  const saveInlineEdit = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { 
      ...d, 
      decisionMaker: editDecisionMaker,
      quotationNo: editQuotationNo,
      value: parseFloat(editValue) || 0
    } : d));
    setEditingId(null);
  };

  // Add new activity log
  const handleAddActivity = () => {
    if (!selectedDealForDetails || !newActivityNotes) return;
    
    const newEntry: ActivityLogEntry = {
        id: Date.now().toString(),
        date: newActivityDate,
        type: newActivityType as any,
        notes: newActivityNotes,
        createdAt: new Date().toISOString()
    };

    setDeals(prev => prev.map(d => {
        if (d.id === selectedDealForDetails.id) {
            return {
                ...d,
                activity: newActivityNotes, // Update latest activity summary
                date: newActivityDate,      // Update latest activity date
                activityHistory: [newEntry, ...(d.activityHistory || [])]
            };
        }
        return d;
    }));

    // Update local state to reflect changes immediately in modal
    setSelectedDealForDetails(prev => prev ? {
        ...prev,
        activity: newActivityNotes,
        date: newActivityDate,
        activityHistory: [newEntry, ...(prev.activityHistory || [])]
    } : null);

    setNewActivityNotes('');
    setNewActivityDate(new Date().toISOString().split('T')[0]);
  };

  const exportDealsToCSV = () => {
    if (deals.length === 0) return;
    const headers = ["id", "quotationNo", "description", "contactPersonId", "contactPersonName", "companyName", "decisionMaker", "value", "activity", "date", "pipelineStatus", "notes"];
    const csvRows = [headers.join(',')];

    for (const deal of deals) {
        const values = headers.map(header => {
            const val = (deal as any)[header] || '';
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `VSD_Pipeline_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importDealsFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const newDeals: Deal[] = [];
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            const values = rows[i].split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const dealData: any = {};
            headers.forEach((h, idx) => {
                dealData[h] = values[idx];
            });

            if (dealData.description && (dealData.contactPersonName || dealData.contactPersonId)) {
                newDeals.push({
                    id: dealData.id || Date.now().toString() + i,
                    quotationNo: dealData.quotationNo || '',
                    description: dealData.description,
                    contactPersonId: dealData.contactPersonId || '',
                    contactPersonName: dealData.contactPersonName || 'Unknown Contact',
                    companyName: dealData.companyName || '',
                    decisionMaker: dealData.decisionMaker || 'Unknown',
                    value: Number(dealData.value) || 0,
                    activity: dealData.activity || 'Imported via CSV',
                    date: dealData.date || new Date().toISOString().split('T')[0],
                    pipelineStatus: (dealData.pipelineStatus as Deal['pipelineStatus']) || 'Prospecting',
                    notes: dealData.notes || '',
                    activityHistory: [] // Init empty history
                });
            }
        }

        if (newDeals.length > 0) {
            setDeals(prev => [...newDeals, ...prev]);
            alert(`Successfully imported ${newDeals.length} deals.`);
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Costing File Upload Handlers
  const triggerCostingUpload = (dealId: string) => {
    setUploadingDealId(dealId);
    if (costingInputRef.current) {
        costingInputRef.current.value = '';
        costingInputRef.current.click();
    }
  };

  const handleCostingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDealId) {
        // Read file as Data URL to persist in localStorage (simulated)
        const reader = new FileReader();
        reader.onload = (event) => {
             const base64 = event.target?.result as string;
             setDeals(prev => prev.map(d => d.id === uploadingDealId ? {
                ...d,
                costingFile: {
                    name: file.name,
                    url: base64,
                    type: file.type
                }
            } : d));
        };
        reader.readAsDataURL(file);
    }
    setUploadingDealId(null);
  };

  const handleNewDealFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setNewDealCosting(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.contactPersonName) return;

    const createDeal = (costingData?: { name: string, url: string, type: string }) => {
        const initialActivity = {
            id: Date.now().toString(),
            date: formData.date || new Date().toISOString().split('T')[0],
            type: 'Other' as const,
            notes: formData.activity || 'Deal Created',
            createdAt: new Date().toISOString()
        };

        const newDeal: Deal = {
            id: Date.now().toString(),
            quotationNo: formData.quotationNo || '',
            description: formData.description || '',
            contactPersonId: formData.contactPersonId || '',
            contactPersonName: formData.contactPersonName || '',
            companyName: formData.companyName || '',
            decisionMaker: formData.decisionMaker || 'Unknown',
            value: Number(formData.value) || 0,
            activity: formData.activity || 'Opportunity identified',
            date: formData.date || new Date().toISOString().split('T')[0],
            pipelineStatus: (formData.pipelineStatus as Deal['pipelineStatus']) || 'Prospecting',
            notes: formData.notes || '',
            costingFile: costingData,
            activityHistory: [initialActivity],
            stageHistory: [{ stage: formData.pipelineStatus || 'Prospecting', date: new Date().toISOString() }]
        };

        setDeals(prev => [newDeal, ...prev]);
        if (newDeal.pipelineStatus === 'Prospecting' || newDeal.pipelineStatus === 'Potential') {
            setSuggestionDeal(newDeal);
        }

        // Reset
        setFormData({ date: new Date().toISOString().split('T')[0], pipelineStatus: 'Prospecting', value: 0, quotationNo: '', decisionMaker: '' });
        setNewDealCosting(null);
        setShowForm(false);
    };

    if (newDealCosting) {
        const reader = new FileReader();
        reader.onload = (event) => {
             const base64 = event.target?.result as string;
             createDeal({
                 name: newDealCosting.name,
                 url: base64,
                 type: newDealCosting.type
             });
        };
        reader.readAsDataURL(newDealCosting);
    } else {
        createDeal(undefined);
    }
  };

  const openCalendar = (deal: Deal, type: 'google' | 'outlook') => {
    const subject = encodeURIComponent(`Follow-up: ${deal.description} - ${deal.companyName}`);
    const body = encodeURIComponent(`Strategic follow-up for ${deal.contactPersonName}. Objective: Advance to ${deal.pipelineStatus} phase.`);
    const url = type === 'google' 
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${subject}&details=${body}`
      : `https://outlook.office.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}`;
    window.open(url, '_blank');
    setSuggestionDeal(null);
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-MY', { 
    style: 'currency', 
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 text-white text-[11px] font-bold leading-tight rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center border border-slate-700">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-5">
           {/* Section Icon - Systematic Style */}
           <div className="flex-shrink-0 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20">
               <TrendingUp size={24} />
           </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Pipeline Velocity</h2>
            <div className="flex items-center gap-3 mt-1.5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Efficiency Intelligence</p>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest group relative">
                    Global Win Rate: {metrics.globalWinRate}%
                </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={importDealsFromCSV} 
          />
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            className="hidden" 
            ref={costingInputRef} 
            onChange={handleCostingFileChange} 
          />
          <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-slate-50 text-slate-900 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm text-xs border border-slate-200"
          >
              <Upload size={18} /> Import
          </button>
          <button 
              onClick={exportDealsToCSV}
              className="bg-white hover:bg-slate-50 text-slate-900 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm text-xs border border-slate-200"
          >
              <Download size={18} /> Export
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl active:scale-95 text-xs border-b-4 border-indigo-800"
          >
            <Plus size={20} /> Log Engagement
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-8 space-y-8">
        
        {/* FUNNEL INSIGHTS SUMMARY */}
        <div className={`max-w-[1600px] mx-auto p-5 rounded-2xl border flex items-center gap-4 shadow-sm animate-in slide-in-from-top duration-500 ${insights.color}`}>
            <div className="p-3 bg-white rounded-xl shadow-sm">
                {insights.icon}
            </div>
            <div className="flex-1">
                <h4 className="font-black text-xs uppercase tracking-widest mb-1">Strategic Funnel Analysis</h4>
                <p className="font-bold text-sm leading-tight">{insights.text}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60">
                <Lightbulb size={14} /> AI Generated Insight
            </div>
        </div>

        {/* CONVERSION SUMMARY HEADER */}
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
          {metrics.stageData.map((m, idx) => (
            <div key={m.id} className="relative flex items-center gap-2 group min-w-[200px] hover:z-[100] transition-all duration-200">
              <div className={`flex-1 p-6 rounded-[2rem] border-2 transition-all cursor-default shadow-lg hover:shadow-2xl ${m.theme.bg} ${m.theme.border}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-current opacity-80 group/label relative ${m.theme.text}`}>
                    {m.label}
                    <div className="group/tooltip relative inline-block ml-1">
                       <Info size={14} className="text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                       <Tooltip text={m.hint} />
                    </div>
                  </div>
                  {idx > 0 && (
                      <div className="flex flex-col items-end group/conv relative">
                          <div className={`text-[10px] font-black flex items-center gap-1 ${m.conv >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              <TrendingUp size={12} /> {m.conv}%
                          </div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Conversion</div>
                      </div>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-black tracking-tighter leading-none ${m.theme.text}`}>
                    {m.cumulative}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deals</span>
                </div>

                <div className="space-y-3 mt-6 pt-6 border-t border-black/5">
                   <div className="flex justify-between items-center text-[10px] font-black group/leak relative">
                      <span className="text-slate-400 uppercase tracking-widest">Stage Leakage</span>
                      <span className="text-rose-500">
                        {idx === 0 ? '0%' : `-${m.dropOff}%`}
                      </span>
                   </div>
                   <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${m.conv >= 60 ? 'bg-emerald-400' : m.conv >= 30 ? 'bg-amber-400' : 'bg-rose-400'}`} 
                        style={{ width: `${m.conv}%` }}
                      />
                   </div>
                </div>
              </div>
              
              {idx < metrics.stageData.length - 1 && (
                <div className="hidden md:flex items-center justify-center -mr-2 z-10">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 shadow-md flex items-center justify-center text-slate-200 group-hover:text-indigo-500 transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DATA TABLE SECTION */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 text-lg">
                  <History className="text-indigo-600" size={20}/>
                  Deal Registry & Activity Log
              </h3>
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 group relative">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Health</span>
                  </div>
                  <div className="flex items-center gap-2 group relative">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">At Risk</span>
                  </div>
              </div>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-900 text-white uppercase tracking-[0.2em] font-black text-[10px]">
              <tr>
                <th className="px-8 py-7 group relative hover:z-50 w-1/4">
                    <div className="flex items-center gap-2">
                        Deal Identity
                    </div>
                </th>
                <th className="px-8 py-7 group relative hover:z-50 w-1/5">
                    <div className="flex items-center gap-2">
                        Stakeholders
                    </div>
                </th>
                <th className="px-8 py-7 group relative hover:z-50">
                    <div className="flex items-center gap-2">
                        Value
                    </div>
                </th>
                <th className="px-8 py-7 group relative hover:z-50 w-[25%]">
                    <div className="flex items-center gap-2">
                        Forecast Probability
                    </div>
                </th>
                <th className="px-8 py-7 text-center group relative hover:z-50">
                    <div className="flex items-center justify-center gap-2">
                        Status Phase
                    </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deals.map((deal) => {
                const pending = pendingForecasts[deal.id];
                const poPercent = pending?.forecastedPoPercentage ?? deal.forecastedPoPercentage ?? 0;
                const poMonth = pending?.forecastedPoMonth ?? deal.forecastedPoMonth ?? MONTHS[0];
                const invPercent = pending?.forecastedInvoicePercentage ?? deal.forecastedInvoicePercentage ?? 0;
                const invMonth = pending?.estimatedInvoiceMonth ?? deal.estimatedInvoiceMonth ?? MONTHS[0];
                const hasChanges = pending !== undefined;

                return (
                <tr key={deal.id} className="hover:bg-indigo-50/20 transition-all border-l-4 border-transparent hover:border-indigo-600 group">
                  <td className="px-8 py-8 cursor-pointer align-top" onClick={() => setSelectedDealForDetails(deal)}>
                    {editingId === deal.id ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                                <input 
                                    type="text" 
                                    value={editQuotationNo}
                                    onChange={(e) => setEditQuotationNo(e.target.value)}
                                    placeholder="QT-Ref-No"
                                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-indigo-200 text-[10px] font-black text-indigo-700 uppercase tracking-wider outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(deal.id)} 
                                    onClick={e => e.stopPropagation()}
                                />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); saveInlineEdit(deal.id); }}
                                    className="p-1.5 bg-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg transition-colors"
                                    title="Save changes"
                                >
                                    <CheckCircle2 size={14} />
                                </button>
                            </div>
                            <div className="font-black text-slate-900 text-base leading-tight tracking-tight opacity-50 pl-1">{deal.description}</div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-tighter">
                                    {deal.quotationNo || 'UNTRACKED'}
                                </span>
                                {deal.costingFile && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                        <FileSpreadsheet size={10} /> Costing Ready
                                    </span>
                                )}
                             </div>
                            
                            <div className="font-black text-slate-900 text-base leading-tight tracking-tight hover:text-indigo-700 transition-colors">
                                {deal.description}
                            </div>
                            
                            {/* Activity Visibility Snippet */}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">
                                    Latest: <span className="text-slate-600">{deal.activity || 'No activity recorded'}</span>
                                </p>
                                <span className="text-[10px] font-bold text-slate-400">{deal.date}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {deal.costingFile && (
                                    <a 
                                        href={deal.costingFile.url} 
                                        download={deal.costingFile.name}
                                        onClick={(e) => e.stopPropagation()} 
                                        className="text-[9px] font-black text-slate-400 hover:text-indigo-600 flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        <Download size={10} /> Download Costing
                                    </a>
                                )}
                                 <button
                                    onClick={(e) => { e.stopPropagation(); triggerCostingUpload(deal.id); }}
                                    className="text-[9px] font-black text-slate-400 hover:text-indigo-600 flex items-center gap-1 uppercase tracking-wider"
                                >
                                    <Upload size={10} /> Update File
                                </button>
                            </div>
                        </div>
                    )}
                  </td>
                  <td className="px-8 py-8 align-top">
                    <div className="flex flex-col gap-3">
                      <div className="text-slate-900 font-bold text-xs flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                          <User size={12}/>
                        </div>
                        {deal.contactPersonName}
                      </div>
                      <div className="pl-8">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {deal.companyName}
                         </div>
                      </div>
                      <div className="text-indigo-700 font-black text-[9px] uppercase tracking-[0.1em] flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 self-start w-fit mt-1">
                        <ShieldCheck size={12} className="text-indigo-500" />
                        DM: {deal.decisionMaker}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 cursor-pointer align-top" onClick={() => !editingId && startInlineEdit(deal)}>
                     {editingId === deal.id ? (
                        <input 
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(deal.id)}
                            className="w-full px-2 py-1.5 rounded-lg border border-indigo-500 font-black text-slate-900 outline-none text-sm"
                            placeholder="0.00"
                        />
                     ) : (
                        <div className="font-mono font-black text-slate-900 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 inline-block shadow-sm text-sm">
                        {fmtMoney(deal.value)}
                        </div>
                     )}
                  </td>
                  
                  {/* FORECAST COLUMN - REPLACED ENGAGEMENT ACTIVITY */}
                  <td className="px-8 py-8 align-top">
                      <div className="flex flex-col gap-4">
                          {/* PO Forecast */}
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  Forecasted PO
                              </span>
                              <div className="flex gap-2">
                                  <select 
                                    className={`w-full bg-white border text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors ${hasChanges ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-indigo-300'}`}
                                    value={poPercent}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handlePendingForecastChange(deal.id, 'forecastedPoPercentage', parseInt(e.target.value))}
                                  >
                                      {PO_CHANCES.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                  </select>
                                  <select 
                                    className={`w-28 bg-white border text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors ${hasChanges ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-indigo-300'}`}
                                    value={poMonth}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handlePendingForecastChange(deal.id, 'forecastedPoMonth', e.target.value)}
                                  >
                                      <option value="">Month</option>
                                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                              </div>
                          </div>

                          {/* Invoice Forecast */}
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Forecasted Invoice</span>
                              <div className="flex gap-2">
                                  <select 
                                    className={`w-full bg-white border text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors ${hasChanges ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-indigo-300'}`}
                                    value={invPercent}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handlePendingForecastChange(deal.id, 'forecastedInvoicePercentage', parseInt(e.target.value))}
                                  >
                                      {INV_CHANCES.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                  </select>
                                   <select 
                                    className={`w-28 bg-white border text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors ${hasChanges ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-indigo-300'}`}
                                    value={invMonth}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handlePendingForecastChange(deal.id, 'estimatedInvoiceMonth', e.target.value)}
                                  >
                                      <option value="">Month</option>
                                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                              </div>
                          </div>
                          
                          {/* Confirm / Cancel Buttons */}
                          {hasChanges && (
                              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); saveForecast(deal.id); }}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm transition-all"
                                  >
                                      <Save size={12} /> Confirm
                                  </button>
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); cancelForecast(deal.id); }}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
                                      title="Cancel changes"
                                  >
                                      <X size={14} />
                                  </button>
                              </div>
                          )}
                      </div>
                  </td>

                  <td className="px-8 py-8 text-center relative z-20 align-top">
                    <select
                        value={deal.pipelineStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusUpdate(deal.id, e.target.value as any)}
                        className={`w-full px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 outline-none cursor-pointer transition-all appearance-none text-center shadow-sm
                        ${deal.pipelineStatus === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          deal.pipelineStatus === 'Closed' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                          'bg-white text-slate-700 border-slate-200 hover:border-indigo-500 focus:border-indigo-500'}`}
                    >
                        {['Prospecting', 'Potential', 'Solutioning', 'Negotiation', 'Won', 'Closed'].map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modals maintained from previous version */}
      {showForm && (
        <div className="absolute inset-0 z-[60] flex justify-end bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20 shadow-sm">
              <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight leading-none">New Deal Lifecycle</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-black p-3 hover:bg-slate-100 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 pb-32">
              
              {/* Row 1: Quotation No & Date */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Quotation Reference</label>
                  <input name="quotationNo" onChange={handleInputChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-black font-bold focus:border-indigo-600 outline-none transition-all" placeholder="QN-202X-XXX" />
                </div>
                 <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Capture Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-black font-bold focus:border-indigo-600 outline-none transition-all" />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Deal Intent / Description *</label>
                <input required name="description" onChange={handleInputChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-black font-bold focus:border-indigo-600 outline-none transition-all" placeholder="e.g. Infrastructure Refresh" />
              </div>
              
              {/* Row 3: Contact & Value */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Primary Lead (Contact) *</label>
                  <select name="contactPersonId" onChange={handleContactChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-black font-bold focus:border-indigo-600 outline-none transition-all" required>
                    <option value="">Select Contact...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.companyName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Opportunity Value (RM)</label>
                  <input type="number" step="0.01" name="value" onChange={handleInputChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-black font-bold focus:border-indigo-600 outline-none transition-all" placeholder="0.00" />
                </div>
              </div>

              {/* Row 4: Costing Upload (New) */}
              <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Upload Costing (Optional)</label>
                  <div 
                      className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                      onClick={() => newDealFileRef.current?.click()}
                  >
                      {newDealCosting ? (
                          <div className="flex items-center gap-2 text-indigo-600">
                              <FileSpreadsheet size={24} />
                              <span className="font-bold text-sm truncate max-w-[200px]">{newDealCosting.name}</span>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setNewDealCosting(null); }}
                                className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full"
                              >
                                  <X size={16} />
                              </button>
                          </div>
                      ) : (
                          <>
                              <Upload size={24} className="text-slate-300 group-hover:text-indigo-500 mb-2" />
                              <span className="text-xs font-black uppercase text-slate-400 group-hover:text-indigo-700 tracking-wider">Click to attach file</span>
                          </>
                      )}
                      <input 
                          type="file" 
                          className="hidden" 
                          ref={newDealFileRef} 
                          onChange={handleNewDealFileChange} 
                          accept=".xlsx,.xls,.csv,.pdf"
                      />
                  </div>
              </div>

              {/* Row 5: Activity Log */}
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Activity Log (Notes) *</label>
                <textarea required name="activity" onChange={handleInputChange} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-black font-bold focus:border-indigo-600 outline-none transition-all h-24 resize-none" placeholder="Enter initial activity details..." />
              </div>

              {/* Hidden/Secondary Fields to maintain functionality */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block">Entry Status</label>
                    <select name="pipelineStatus" value={formData.pipelineStatus} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-bold text-xs focus:border-indigo-600 outline-none transition-all">
                        <option value="Prospecting">Prospecting</option>
                        <option value="Potential">Potential</option>
                        <option value="Solutioning">Solutioning</option>
                        <option value="Negotiation">Negotiation</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block">Stakeholder (DM)</label>
                    <input name="decisionMaker" value={formData.decisionMaker} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-bold text-xs focus:border-indigo-600 outline-none transition-all" placeholder="Name/Role" />
                 </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 uppercase tracking-widest mt-4">
                Inject into Pipeline
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED ACTIVITY MODAL */}
      {selectedDealForDetails && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-md">
              <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
                  {/* Modal Header */}
                  <div className="p-8 border-b border-slate-100 sticky top-0 bg-white z-20 flex justify-between items-start shadow-sm">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <div className="flex-shrink-0">
                                   <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <rect width="36" height="36" rx="8" fill="url(#modal-logo-gradient)"/>
                                      <path d="M10 12L18 24L26 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                      <defs>
                                          <linearGradient id="modal-logo-gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                              <stop stopColor="#2563EB"/>
                                              <stop offset="1" stopColor="#4F46E5"/>
                                          </linearGradient>
                                      </defs>
                                   </svg>
                               </div>
                              <div className="text-[10px] font-black text-white bg-indigo-600 px-2 py-1 rounded uppercase tracking-widest">{selectedDealForDetails.quotationNo || 'REF-ID'}</div>
                          </div>
                          <h3 className="font-black text-2xl text-slate-900 leading-tight mb-1">{selectedDealForDetails.description}</h3>
                          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                              <User size={14} /> {selectedDealForDetails.contactPersonName} @ {selectedDealForDetails.companyName}
                          </div>
                      </div>
                      <button onClick={() => setSelectedDealForDetails(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10">
                      
                      {/* Deal Metadata */}
                      <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Deal Value</span>
                              <div className="text-xl font-black text-slate-900">{fmtMoney(selectedDealForDetails.value)}</div>
                          </div>
                          <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Forecast PO</span>
                              <div className="text-xl font-black text-indigo-600">
                                  {selectedDealForDetails.forecastedPoPercentage || 0}% <span className="text-sm font-bold text-slate-400">in {selectedDealForDetails.forecastedPoMonth || 'N/A'}</span>
                              </div>
                          </div>
                      </div>

                      {/* Log New Activity Form - ENHANCED USABILITY */}
                      <div className="bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100 p-8 shadow-inner">
                          <div className="flex items-center justify-between mb-6">
                              <h4 className="font-black text-base text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                  <Activity className="text-indigo-600" size={20} />
                                  Log New Engagement
                              </h4>
                              <Sparkles size={18} className="text-indigo-300" />
                          </div>
                          <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                          <Calendar size={14} className="text-slate-400" />
                                          Activity Date
                                      </label>
                                      <input 
                                        type="date" 
                                        value={newActivityDate}
                                        onChange={(e) => setNewActivityDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                          <Zap size={14} className="text-slate-400" />
                                          Communication Channel
                                      </label>
                                      <select 
                                        value={newActivityType}
                                        onChange={(e) => setNewActivityType(e.target.value)}
                                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm appearance-none cursor-pointer"
                                      >
                                          {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                      <FileText size={14} className="text-slate-400" />
                                      Detailed Activity Notes
                                  </label>
                                  <textarea 
                                    value={newActivityNotes}
                                    onChange={(e) => setNewActivityNotes(e.target.value)}
                                    placeholder="Summarize the meeting objectives, key decisions, and immediate follow-ups..."
                                    className="w-full h-36 px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm resize-none"
                                  />
                              </div>
                              <button 
                                onClick={handleAddActivity}
                                disabled={!newActivityNotes}
                                className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3"
                              >
                                  <Save size={18} /> Record Interaction
                              </button>
                          </div>
                      </div>

                      {/* Timeline */}
                      <div>
                          <h4 className="font-black text-sm text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <History size={16} className="text-slate-400" /> Engagement Timeline
                          </h4>
                          
                          <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pl-8">
                                {/* Map history or default to initial creation if no history */}
                                {(selectedDealForDetails.activityHistory && selectedDealForDetails.activityHistory.length > 0) ? (
                                    selectedDealForDetails.activityHistory.map((log, idx) => (
                                        <div key={log.id || idx} className="relative">
                                            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white border-[4px] border-indigo-500 shadow-sm z-10"></div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.date}</span>
                                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase tracking-wider">{log.type}</span>
                                                </div>
                                                <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white p-4 border border-slate-200 rounded-xl shadow-sm mt-2">
                                                    {log.notes}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative">
                                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white border-[4px] border-slate-300 shadow-sm z-10"></div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedDealForDetails.date}</span>
                                            <p className="text-sm text-slate-600 font-medium italic">
                                                Initial Record: {selectedDealForDetails.activity}
                                            </p>
                                        </div>
                                    </div>
                                )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* RE-ENGAGEMENT MODAL */}
      {suggestionDeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300">
            <div className="p-10 bg-indigo-600 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <CalendarPlus size={40} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Protect Velocity</h3>
              <p className="text-indigo-100 text-[10px] font-bold mt-3 uppercase tracking-widest">Schedule a strategic touchpoint immediately.</p>
            </div>
            <div className="p-10 space-y-4">
              <button onClick={() => openCalendar(suggestionDeal, 'google')} className="w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-transparent hover:border-indigo-600 rounded-[1.5rem] transition-all group">
                <span className="font-black text-slate-800 text-xs uppercase tracking-widest">Google Sync</span>
                <TrendingUp size={16} className="text-indigo-500" />
              </button>
              <button onClick={() => openCalendar(suggestionDeal, 'outlook')} className="w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-transparent hover:border-indigo-600 rounded-[1.5rem] transition-all group">
                <span className="font-black text-slate-800 text-xs uppercase tracking-widest">Office / Outlook</span>
                <TrendingUp size={16} className="text-indigo-500" />
              </button>
              <button onClick={() => setSuggestionDeal(null)} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest pt-6 hover:text-slate-600 transition-colors">Close Advice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
