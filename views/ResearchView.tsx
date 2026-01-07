
import React, { useState } from 'react';
import { Search, Loader2, Building2, Newspaper, CheckCircle2 } from 'lucide-react';
import { researchCompany } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { GroundingSources } from '../components/GroundingSources';

export const ResearchView: React.FC = () => {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; metadata?: any } | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await researchCompany(company);
      setResult({
        text: response.text || "No information found.",
        metadata: response.candidates?.[0]?.groundingMetadata
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-8 bg-white border-b border-slate-200">
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <Newspaper className="text-blue-600" />
          Company Intelligence
        </h2>
        <p className="text-slate-500 mt-2 font-medium text-lg">
          Deep dive into company financials, news, and strategic shifts to prep for your meetings.
        </p>

        <form onSubmit={handleResearch} className="mt-8 relative max-w-3xl">
           <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
            <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name (e.g. Nvidia, Salesforce, Stripe)"
                className="w-full pl-16 pr-4 py-5 rounded-3xl border-2 border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none shadow-sm text-lg placeholder-slate-400 transition-all"
            />
            <button
                type="submit"
                disabled={loading || !company.trim()}
                className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-black text-white px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Research'}
            </button>
           </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {loading && (
           <div className="flex flex-col items-center justify-center h-96 text-slate-500">
             <div className="relative">
                 <Loader2 className="animate-spin mb-6 text-blue-600" size={64} />
                 <Building2 className="absolute -top-2 -right-2 text-blue-400 animate-bounce" size={24} />
             </div>
             <p className="font-black text-xl text-slate-900 tracking-tight">Gathering intelligence...</p>
             <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Powered by Gemini 3 Flash</p>
           </div>
        )}

        {!loading && result && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
             <div className="lg:col-span-3">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                      <Building2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{company}</h3>
                      <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Research Report</p>
                    </div>
                  </div>
                  <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-blue-600 prose-strong:text-slate-900">
                    <MarkdownRenderer content={result.text} />
                  </div>
                  <GroundingSources metadata={result.metadata} />
                </div>
             </div>

             <div className="lg:col-span-1 space-y-6">
                <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 sticky top-4">
                  <h4 className="font-black text-blue-900 mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16}/> Pre-Meeting Checklist
                  </h4>
                  <ul className="space-y-4">
                     {['Review recent quarterly earnings', 'Check recent C-suite hires', 'Identify mutual connections', 'Prepare 3 strategic questions'].map((item, i) => (
                         <li key={i} className="flex items-start gap-3 text-sm font-bold text-blue-800">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                             {item}
                         </li>
                     ))}
                  </ul>
                </div>
             </div>
          </div>
        )}

        {!loading && !result && (
           <div className="flex flex-col items-center justify-center h-full text-center pb-20">
             <div className="p-8 bg-white shadow-xl rounded-[2.5rem] mb-8 border border-slate-100 rotate-[-3deg] transition-transform hover:rotate-0">
               <Building2 size={64} className="text-blue-200" />
             </div>
             <p className="text-3xl font-black text-slate-900 uppercase tracking-tight">Company Intel</p>
             <p className="text-slate-500 mt-3 font-medium text-lg max-w-md">Enter a company name to generate a deep-dive report.</p>
           </div>
        )}
      </div>
    </div>
  );
};
