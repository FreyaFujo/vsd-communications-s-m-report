
import React from 'react';
import { Filter, Info, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Deal, Lead } from '../types';

interface PipelineFunnelViewProps {
  deals: Deal[];
  leads: Lead[];
}

export const PipelineFunnelView: React.FC<PipelineFunnelViewProps> = ({ deals, leads }) => {
  
  const stages = [
    { 
        id: 'leads', 
        name: 'Leads Generation', 
        definition: "Total contacts in database. Potential starting point.", 
        count: leads.length, 
        value: 0 
    },
    { 
        id: 'prospecting', 
        name: 'Prospecting', 
        definition: "Active touch points identified as 'Prospecting' in Tracker.", 
        count: deals.filter(d => d.pipelineStatus === 'Prospecting').length, 
        value: deals.filter(d => d.pipelineStatus === 'Prospecting').reduce((acc, c) => acc + c.value, 0) 
    },
    { 
        id: 'potential', 
        name: 'Potential', 
        definition: "Qualified interest with high deal probability.", 
        count: deals.filter(d => d.pipelineStatus === 'Potential').length, 
        value: deals.filter(d => d.pipelineStatus === 'Potential').reduce((acc, c) => acc + c.value, 0) 
    },
    { 
        id: 'solutioning', 
        name: 'Solutioning', 
        definition: "Proposal sent and solution design in progress.", 
        count: deals.filter(d => d.pipelineStatus === 'Solutioning').length, 
        value: deals.filter(d => d.pipelineStatus === 'Solutioning').reduce((acc, c) => acc + c.value, 0) 
    },
    { 
        id: 'negotiation', 
        name: 'Negotiation', 
        definition: "Finalizing contract details and pricing.", 
        count: deals.filter(d => d.pipelineStatus === 'Negotiation').length, 
        value: deals.filter(d => d.pipelineStatus === 'Negotiation').reduce((acc, c) => acc + c.value, 0) 
    },
    { 
        id: 'won', 
        name: 'Won', 
        definition: "Successfully closed business.", 
        count: deals.filter(d => d.pipelineStatus === 'Won').length, 
        value: deals.filter(d => d.pipelineStatus === 'Won').reduce((acc, c) => acc + c.value, 0) 
    },
  ];

  const calculateConversion = (index: number) => {
    if (index === 0) return 100;
    const prev = stages[index - 1];
    const curr = stages[index];
    if (prev.count === 0) return 0;
    return (curr.count / prev.count) * 100;
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n);

  const totalWonValue = stages.find(s => s.id === 'won')?.value || 0;
  const activeValue = stages.slice(1, 5).reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-8 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <Filter className="text-indigo-600" />
                Automated Funnel Analytics
                </h2>
                <p className="text-slate-500 mt-2 font-medium text-lg">
                Live performance data aggregated from Lead Database and Pipeline Activity Tracker.
                </p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2 shadow-sm">
                <ShieldCheck size={16}/> Read-Only Logic
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white uppercase tracking-[0.2em] font-black text-[10px]">
              <tr>
                <th className="px-10 py-8">Pipeline Stage</th>
                <th className="px-10 py-8 text-center">Deal Count</th>
                <th className="px-10 py-8 text-right">Aggregated Value</th>
                <th className="px-10 py-8 text-right">Conversion Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stages.map((stage, index) => {
                const conversion = calculateConversion(index);
                const isWon = stage.id === 'won';
                const isLeads = stage.id === 'leads';
                
                return (
                  <tr key={stage.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 font-black text-slate-900 text-xl uppercase tracking-tight">
                          {stage.name}
                          <div className="group/tooltip relative">
                             <Info size={16} className="text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                             <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-slate-900 text-white text-[10px] p-3 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 font-bold">
                                 {stage.definition}
                             </div>
                          </div>
                        </div>
                        <div className="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isWon ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${stages[0].count > 0 ? (stage.count / stages[0].count) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                        <div className="text-3xl font-black text-slate-900">{stage.count}</div>
                    </td>
                    <td className="px-10 py-8 text-right">
                        <div className="text-2xl font-mono font-black text-slate-900 tracking-tight">
                            {isLeads ? '—' : fmtMoney(stage.value)}
                        </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                        {isLeads ? (
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Base Layer</span>
                        ) : (
                            <div className={`text-2xl font-black ${conversion >= 60 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {conversion.toFixed(1)}%
                            </div>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center border-b-8 border-emerald-500 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-indigo-400 font-black uppercase tracking-widest text-xs mb-4">Closed Won Revenue</h3>
                    <div className="text-6xl font-black text-white tracking-tighter">
                        {fmtMoney(totalWonValue)}
                    </div>
                    <div className="mt-10 pt-8 border-t border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-emerald-400" size={28} />
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Funnel Output</span>
                        </div>
                    </div>
                </div>
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-[80px]"></div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-xl flex flex-col justify-center">
                <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4">Active Pipeline Opportunity</h3>
                <div className="text-6xl font-black text-slate-900 tracking-tighter">
                    {fmtMoney(activeValue)}
                </div>
                <div className="mt-10 pt-8 border-t border-slate-100">
                    <div className="flex justify-between">
                         <div className="text-center flex-1">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Total Leads</div>
                            <div className="text-2xl font-black text-slate-900">{leads.length}</div>
                         </div>
                         <div className="w-px h-12 bg-slate-100 mx-6"></div>
                         <div className="text-center flex-1">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">In Negotiation</div>
                            <div className="text-2xl font-black text-indigo-600">
                                {fmtMoney(stages.find(s => s.id === 'negotiation')?.value || 0)}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
