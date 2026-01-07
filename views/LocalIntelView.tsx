
import React, { useState, useEffect } from 'react';
import { Map, Loader2, Navigation as NavIcon } from 'lucide-react';
import { findLocalProspects } from '../services/geminiService';
import { LocationCoords } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { GroundingSources } from '../components/GroundingSources';

export const LocalIntelView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<LocationCoords | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; metadata?: any } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationStatus('granted');
        },
        (error) => {
          console.error("Location access denied", error);
          setLocationStatus('denied');
        }
      );
    } else {
      setLocationStatus('denied');
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await findLocalProspects(query, coords);
      setResult({
        text: response.text || "No locations found.",
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <Map className="text-green-600" />
                Local Intelligence
                </h2>
                <p className="text-slate-500 mt-2 font-medium text-lg">
                Find prospects near you or in specific areas using Google Maps data.
                </p>
            </div>
            {locationStatus === 'granted' && (
                <span className="text-[10px] font-black bg-green-50 text-green-700 px-4 py-2 rounded-full flex items-center gap-2 uppercase tracking-widest border border-green-100 shadow-sm self-start">
                    <NavIcon size={12} /> Location Active
                </span>
            )}
            {locationStatus === 'denied' && (
                <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-4 py-2 rounded-full uppercase tracking-widest border border-amber-100 shadow-sm self-start">
                    Location Denied
                </span>
            )}
        </div>

        <form onSubmit={handleSearch} className="mt-8 relative max-w-3xl">
           <div className="relative group">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'Manufacturing companies nearby' or 'Law firms in Chicago'"
                className="w-full pl-6 pr-32 py-5 rounded-3xl border-2 border-slate-200 bg-white text-slate-900 font-bold focus:border-green-600 focus:ring-4 focus:ring-green-50 outline-none shadow-sm text-lg placeholder-slate-400 transition-all"
            />
            <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-3 top-3 bottom-3 bg-green-600 hover:bg-green-700 text-white px-8 rounded-2xl font-black uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg text-xs"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Explore Map'}
            </button>
           </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {loading && (
             <div className="flex flex-col items-center justify-center h-96 text-slate-400">
             <Loader2 className="animate-spin mb-6 text-green-600" size={64} />
             <p className="font-black uppercase tracking-widest text-xl text-slate-900">Scanning local area...</p>
             <p className="text-xs mt-2 font-black uppercase tracking-widest text-slate-400">Powered by Gemini 2.5 Flash + Maps</p>
           </div>
        )}

        {!loading && result && (
          <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-green-600 prose-strong:text-slate-900">
                <MarkdownRenderer content={result.text} />
            </div>
            <GroundingSources metadata={result.metadata} />
          </div>
        )}

        {!loading && !result && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
             <div className="p-8 bg-white shadow-xl rounded-[2.5rem] mb-8 border border-slate-100 rotate-3 transition-transform hover:rotate-0">
                <Map size={64} className="text-green-200" />
             </div>
             <p className="text-3xl font-black text-slate-900 uppercase tracking-tight">Map Intelligence</p>
             <p className="text-slate-500 mt-3 font-medium text-lg">Start a local search to see results.</p>
          </div>
        )}
      </div>
    </div>
  );
};
