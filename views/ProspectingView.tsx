
import React, { useState } from 'react';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { prospectLeads } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { GroundingSources } from '../components/GroundingSources';

export const ProspectingView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; metadata?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await prospectLeads(query);
      setResult({
        text: response.text || "No results found.",
        metadata: response.candidates?.[0]?.groundingMetadata
      });
    } catch (err) {
      setError("Failed to generate leads. Please check your API key and connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-8 bg-white border-b border-slate-200">
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <Sparkles className="text-amber-500 fill-amber-500" />
          Lead Prospecting
        </h2>
        <p className="text-slate-500 mt-2 font-medium text-lg">
          Use AI with Google Search to find high-quality leads tailored to your industry.
        </p>
        
        <form onSubmit={handleSearch} className="mt-8 relative max-w-3xl">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Mid-sized fintech startups in New York looking for cloud solutions'"
              className="w-full pl-16 pr-4 py-5 rounded-3xl border-2 border-slate-200 bg-white text-slate-900 font-bold focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none shadow-sm text-lg placeholder-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-black text-white px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Find Leads'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-6 rounded-3xl flex items-center gap-4 border-2 border-red-100 max-w-3xl mx-auto shadow-sm">
            <AlertCircle size={24} className="flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500">
            <div className="relative">
                <Loader2 className="animate-spin mb-6 text-indigo-600" size={64} />
                <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-bounce" size={24} />
            </div>
            <p className="font-black text-xl text-slate-900 tracking-tight">Analyzing market data...</p>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Powered by Gemini 3 Flash</p>
          </div>
        )}

        {!loading && result && (
          <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600 prose-strong:text-slate-900">
                <MarkdownRenderer content={result.text} />
            </div>
            <GroundingSources metadata={result.metadata} />
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="p-8 bg-white shadow-xl rounded-[2.5rem] mb-8 border border-slate-100 rotate-3 transition-transform hover:rotate-0">
              <Search size={64} className="text-indigo-200" />
            </div>
            <p className="text-3xl font-black text-slate-900 uppercase tracking-tight">Intelligence Ready</p>
            <p className="text-slate-500 mt-3 font-medium text-lg max-w-md">Enter your prospecting criteria above to begin the AI scan.</p>
          </div>
        )}
      </div>
    </div>
  );
};
