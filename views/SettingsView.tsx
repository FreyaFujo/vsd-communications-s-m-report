
import React, { useState, useEffect } from 'react';
import { Settings, Save, User, Briefcase, Star, Target, CheckCircle2, Building2, TrendingUp, Package, Compass, Upload, Trash2, FileText, Image, Video, FileSpreadsheet, Presentation, Cloud, Database, Download, ExternalLink, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile, ProductAsset } from '../types';
import { generateIdealClientProfile } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isGeneratingICP, setIsGeneratingICP] = useState(false);
  
  // Initialize from local storage or use the default Google Drive link
  const [cloudUrl, setCloudUrl] = useState(() => {
    return localStorage.getItem('vsd_cloud_url') || 'https://drive.google.com/drive/folders/16h74cBl4OYaWgFcY2MmOOLNroHs_odyg?usp=sharing';
  });

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Persist cloud URL whenever it changes
  useEffect(() => {
    localStorage.setItem('vsd_cloud_url', cloudUrl);
  }, [cloudUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>, type: ProductAsset['type']) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newAsset: ProductAsset = {
        id: Date.now().toString(),
        name: file.name,
        type: type,
        url: url,
        size: file.size,
        mimeType: file.type
      };
      setFormData(prev => ({
        ...prev,
        productAssets: [...(prev.productAssets || []), newAsset]
      }));
    }
  };

  const handleRemoveAsset = (id: string) => {
    setFormData(prev => {
        const assetToRemove = prev.productAssets?.find(a => a.id === id);
        if (assetToRemove) URL.revokeObjectURL(assetToRemove.url);
        return {
            ...prev,
            productAssets: prev.productAssets?.filter(a => a.id !== id)
        };
    });
  };

  const handleGenerateICP = async () => {
    setIsGeneratingICP(true);
    try {
      const icp = await generateIdealClientProfile(formData);
      const updatedProfile = { ...formData, idealClientProfile: icp };
      setFormData(updatedProfile);
      onUpdate(updatedProfile); // Persist immediately
    } catch (error) {
      console.error("Failed to generate ICP:", error);
      // Optionally show an error toast
    } finally {
      setIsGeneratingICP(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setShowSavedToast(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleExportAndSync = () => {
    // 1. Gather all data from LocalStorage
    const dataBundle = {
        timestamp: new Date().toISOString(),
        profile: JSON.parse(localStorage.getItem('vsd_user_profile') || '{}'),
        leads: JSON.parse(localStorage.getItem('vsd_leads') || '[]'),
        deals: JSON.parse(localStorage.getItem('vsd_deals') || '[]'),
        competitors: JSON.parse(localStorage.getItem('vsd_competitors') || '[]')
    };

    // 2. Create Downloadable JSON Blob
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataBundle, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `VSD_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);

    // 3. Open Cloud Storage URL
    if (cloudUrl) {
        window.open(cloudUrl, '_blank');
    }
  };

  const inputClasses = "w-full px-5 py-4 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 font-bold";
  const labelClasses = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-2";

  const getAssetIcon = (type: ProductAsset['type']) => {
    switch (type) {
      case 'datasheet': return <FileText className="text-blue-500" />;
      case 'presentation': return <Presentation className="text-orange-500" />;
      case 'costing': return <FileSpreadsheet className="text-green-500" />;
      case 'photo': return <Image className="text-purple-500" />;
      case 'video': return <Video className="text-red-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-y-auto pb-20">
      <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Settings className="text-slate-600" />
            AI Personalization & Business Settings
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Configure your business context so the AI can provide hyper-relevant advice.
          </p>
        </div>
        {showSavedToast && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-3 rounded-2xl border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300 shadow-md">
            <CheckCircle2 size={20} />
            <span className="font-black uppercase tracking-wide text-xs">Settings Updated</span>
          </div>
        )}
      </div>

      <div className="p-10 max-w-6xl mx-auto w-full space-y-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-10">
                {/* Consultant Identity */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-blue-50/50">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                        <User size={24} />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Consultant Identity</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 gap-6">
                    <div>
                        <label className={labelClasses}>Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Alex Chen" className={inputClasses} />
                    </div>
                    <div>
                        <label className={labelClasses}>Current Role / Title</label>
                        <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Senior Channel Consultant" className={inputClasses} />
                    </div>
                    <div>
                        <label className={labelClasses}>Company Name</label>
                        <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Building2 size={20} />
                        </div>
                        <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} placeholder="e.g. VSD Communications" className={`${inputClasses} pl-12`} />
                        </div>
                    </div>
                    </div>
                </div>

                {/* Sales Methodology */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-amber-50/50">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                        <Star size={24} />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Sales Style & Methodology</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 gap-6">
                    <div>
                        <label className={labelClasses}>Preferred Methodology</label>
                        <select name="salesStyle" value={formData.salesStyle} onChange={handleChange} className={`${inputClasses} appearance-none bg-no-repeat bg-[right_1.5rem_center]`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}>
                        <option value="Consultative">Consultative Selling</option>
                        <option value="Challenger">The Challenger Sale</option>
                        <option value="SPIN">SPIN Selling</option>
                        <option value="Solution">Solution Selling</option>
                        <option value="Aggressive">Aggressive / Direct</option>
                        <option value="Relation">Relationship Based</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Primary Professional Goals</label>
                        <input type="text" name="goals" value={formData.goals} onChange={handleChange} placeholder="e.g. Hit RM 2M in new accounts" className={inputClasses} />
                    </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {/* Product Assets - NEW MOVED SECTION */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-indigo-100 overflow-hidden flex flex-col h-full">
                    <div className="p-8 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                                <Package size={24} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl">Product Sales Assets</h3>
                        </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                        <p className="text-sm text-slate-500 font-bold mb-8">
                            Upload your sales materials. The AI will use these file names and types to generate hyper-specific strategy recommendations.
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            {[
                                { type: 'datasheet' as const, label: 'Datasheet', icon: <FileText size={24}/> },
                                { type: 'presentation' as const, label: 'Deck', icon: <Presentation size={24}/> },
                                { type: 'costing' as const, label: 'Costing', icon: <FileSpreadsheet size={24}/> },
                                { type: 'photo' as const, label: 'Photo', icon: <Image size={24}/> },
                                { type: 'video' as const, label: 'Video', icon: <Video size={24}/> }
                            ].map((btn) => (
                                <label key={btn.type} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group">
                                    <div className="text-slate-400 group-hover:text-indigo-600 transition-colors mb-2">{btn.icon}</div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-900 tracking-wider">{btn.label}</span>
                                    <input type="file" className="hidden" onChange={(e) => handleAssetUpload(e, btn.type)} />
                                </label>
                            ))}
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {(formData.productAssets || []).length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                    <Upload size={40} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No assets uploaded</p>
                                </div>
                            ) : (
                                (formData.productAssets || []).map((asset) => (
                                    <div key={asset.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="p-2.5 bg-slate-50 rounded-xl">{getAssetIcon(asset.type)}</div>
                                            <div className="truncate">
                                                <p className="text-sm font-black text-slate-900 truncate leading-tight mb-1">{asset.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.type} • {(asset.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveAsset(asset.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Business Targets & Strategy */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-emerald-50/50">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Target size={24} />
              </div>
              <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Business Strategy & Targets</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className={labelClasses}>Target Revenue (Quarterly/Annual)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <TrendingUp size={20} />
                    </div>
                    <input type="text" name="targetRevenue" value={formData.targetRevenue || ''} onChange={handleChange} placeholder="e.g. RM 500,000" className={`${inputClasses} pl-12`} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Primary Product Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Package size={20} />
                    </div>
                    <input type="text" name="product" value={formData.product || ''} onChange={handleChange} placeholder="e.g. Enterprise Cloud ERP" className={`${inputClasses} pl-12`} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClasses}>Strategic Sales Plan Summary</label>
                <div className="relative">
                  <div className="absolute left-4 top-5 text-slate-400">
                    <Compass size={20} />
                  </div>
                  <textarea name="plan" value={formData.plan || ''} onChange={handleChange} rows={3} placeholder="Describe your current strategic approach..." className={`${inputClasses} pl-12 resize-none h-32 leading-relaxed`} />
                </div>
              </div>
            </div>
          </div>

          {/* Ideal Client Profile (AI-Generated) */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-purple-100 overflow-hidden">
            <div className="p-8 border-b border-purple-50 flex items-center gap-4 bg-purple-50/30">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                    <BrainCircuit size={24} />
                </div>
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Ideal Client Profile (AI-Generated)</h3>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-600 font-bold leading-relaxed">
                Generate a comprehensive Ideal Client Profile based on your current business context and product offerings.
              </p>
              
              <button 
                type="button" 
                onClick={handleGenerateICP}
                disabled={isGeneratingICP || !formData.name || !formData.product}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
              >
                {isGeneratingICP ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} className="text-amber-300" />}
                {isGeneratingICP ? 'Generating ICP...' : 'Generate Ideal Client Profile'}
              </button>

              <div className="min-h-[200px] bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
                {isGeneratingICP ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                    <p className="font-bold text-sm uppercase tracking-widest animate-pulse">Crafting your Ideal Client Profile...</p>
                  </div>
                ) : formData.idealClientProfile ? (
                  <div className="prose prose-slate prose-base max-w-none text-slate-800 prose-headings:text-slate-900 prose-strong:text-purple-700">
                    <MarkdownRenderer content={formData.idealClientProfile} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <BrainCircuit size={64} className="opacity-10 mb-4" />
                    <p className="font-bold text-sm uppercase tracking-widest text-slate-400">Your AI-generated ICP will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Data Synchronization Section */}
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden text-white">
            <div className="p-8 border-b border-slate-800 flex items-center gap-4 bg-slate-800/50">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/50">
                    <Cloud size={24} />
                </div>
                <h3 className="font-black text-xl tracking-tight">Data Synchronization & Backup</h3>
            </div>
            <div className="p-10">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="flex-1 space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Google Drive / Cloud Folder URL</label>
                            <div className="relative">
                                <ExternalLink size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={cloudUrl} 
                                    onChange={(e) => setCloudUrl(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-3 leading-relaxed font-bold">
                                Enter the shared folder link. The app will generate a backup file which you can drag-and-drop into this folder.
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-col gap-4 min-w-[300px]">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                            <h4 className="text-sm font-black text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
                                <Database size={16} className="text-blue-400" />
                                Full Data Export
                            </h4>
                            <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">
                                Bundle Leads, Deals, Competitors & Profile into a single JSON file.
                            </p>
                            <button 
                                type="button" 
                                onClick={handleExportAndSync}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
                            >
                                <Download size={18} />
                                Generate & Open Drive
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-12">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-black text-white px-16 py-6 rounded-[2rem] font-black text-xl flex items-center gap-4 shadow-2xl transition-all active:scale-95 uppercase tracking-widest hover:shadow-indigo-500/30"
            >
              <Save size={28} />
              Commit Strategy Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
