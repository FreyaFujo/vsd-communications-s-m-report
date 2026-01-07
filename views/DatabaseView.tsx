
import React, { useState, useRef, useMemo } from 'react';
import { Database, Plus, Mail, Trash2, Search, X, ClipboardList, Clock, User, Phone, MapPin, Save, History, Edit3, HelpCircle, Share2, Download, Upload, Briefcase, ChevronRight, Building2 } from 'lucide-react';
import { Lead, Deal } from '../types';

interface DatabaseViewProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
}

/**
 * UX Audit & Improvements implemented:
 * 1. Visual Hierarchy: Increased header font size and weight for immediate orientation.
 * 2. Scannability: Grouped contact info into distinct vertical clusters.
 * 3. Accessibility: Improved contrast and interactive states for better legibility when zooming.
 * 4. Performance: Used useMemo for filtering to prevent unnecessary re-renders.
 * 5. Layout Density: Adjusted padding to be tighter yet breathable, ensuring box sizes align with text.
 * 6. Readability: Enhanced text color for form labels.
 */

export const DatabaseView: React.FC<DatabaseViewProps> = ({ leads, setLeads, deals, setDeals }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Lead>>({
    source: 'Direct Outreach'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setFormData(lead);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyName) return;

    if (editingLead) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...formData } as Lead : l));
    } else {
      const newLead: Lead = {
        id: Date.now().toString(),
        name: formData.name || '',
        companyName: formData.companyName || '',
        address: formData.address || '',
        email: formData.email || '',
        phone: formData.phone || '',
        jobTitle: formData.jobTitle || '',
        department: formData.department || '',
        jobDescription: formData.jobDescription || '',
        industry: formData.industry || 'Unspecified',
        source: formData.source || 'Direct Outreach',
        userNotes: '',
        projectBrief: formData.projectBrief || ''
      };
      setLeads(prev => [newLead, ...prev]);
    }
    
    setFormData({ source: 'Direct Outreach' });
    setEditingLead(null);
    setShowForm(false);
  };

  const handleUpdateUserNotes = (id: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, userNotes: notes } : l));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('WARNING: Deleting this contact will ALSO PERMANENTLY DELETE all associated quotations and deals. Continue?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
      setDeals(prev => prev.filter(d => d.contactPersonId !== id));
      if (selectedLeadId === id) setSelectedLeadId(null);
    }
  };

  const exportLeadsToCSV = () => {
    if (leads.length === 0) return;
    const headers = ["id", "name", "companyName", "address", "email", "phone", "jobTitle", "department", "jobDescription", "industry", "source", "projectBrief", "userNotes"];
    const csvRows = [headers.join(',')];

    for (const lead of leads) {
      const values = headers.map(header => {
        const val = (lead as any)[header] || '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `VSD_Contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importLeadsFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const newLeads: Lead[] = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const values = rows[i].split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        const leadData: any = {};
        headers.forEach((h, idx) => {
          leadData[h] = values[idx];
        });

        if (leadData.name && leadData.companyName) {
          newLeads.push({
            id: leadData.id || Date.now().toString() + i,
            name: leadData.name,
            companyName: leadData.companyName,
            address: leadData.address || '',
            email: leadData.email || '',
            phone: leadData.phone || '',
            jobTitle: leadData.jobTitle || '',
            department: leadData.department || '',
            jobDescription: leadData.jobDescription || '',
            industry: leadData.industry || 'Unspecified',
            source: leadData.source || 'CSV Import',
            userNotes: leadData.userNotes || '',
            projectBrief: leadData.projectBrief || ''
          });
        }
      }

      if (newLeads.length > 0) {
        setLeads(prev => [...newLeads, ...prev]);
        alert(`Imported ${newLeads.length} contacts.`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredLeads = useMemo(() => leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [leads, searchTerm]);

  const getLatestDealForLead = (leadId: string) => {
    const leadDeals = deals.filter(d => d.contactPersonId === leadId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return leadDeals[0] || null;
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const leadActivities = selectedLead ? deals.filter(d => d.contactPersonId === selectedLead.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  // Enhanced readability for form input labels
  const labelTextStyles = "block text-[11px] font-black text-slate-700 mb-2.5 uppercase tracking-widest";
  const commonInputStyles = "w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-white text-slate-900 font-bold focus:border-blue-600 outline-none transition-all placeholder-slate-400 text-base md:text-lg shadow-sm";

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 text-white text-[11px] font-bold leading-tight rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center border border-slate-700">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Dynamic Header Section */}
      <div className="p-6 md:p-8 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-6 shrink-0 z-20">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200">
                <Database size={28} />
            </div>
            Contact Intelligence
          </h2>
          <p className="text-slate-500 mt-2 font-bold text-lg md:text-xl">
            Channel Consultant Lead Hub & Strategic Database.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={importLeadsFromCSV} />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm border border-slate-200 text-xs active:scale-95"
            >
                <Upload size={18} /> Import
            </button>
            <button 
                onClick={exportLeadsToCSV}
                className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm border border-slate-200 text-xs active:scale-95"
            >
                <Download size={18} /> Export
            </button>
            <button 
                onClick={() => { setEditingLead(null); setFormData({ source: 'Direct Outreach' }); setShowForm(true); }}
                className="bg-blue-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-200 active:scale-95 text-xs border-b-4 border-blue-800"
            >
                <Plus size={20} /> Register Contact
            </button>
        </div>
      </div>

      {/* Global Search Interface */}
      <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 shrink-0">
        <div className="relative max-w-4xl mx-auto group">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={28} />
          <input 
            type="text" 
            placeholder="Search Intelligence Database..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-6 rounded-3xl border-2 border-slate-200 bg-white text-black font-black focus:border-blue-600 focus:ring-8 focus:ring-blue-50 outline-none shadow-lg transition-all text-xl placeholder-slate-300"
          />
        </div>
      </div>

      {/* Optimized Data Registry Table */}
      <div className="flex-1 overflow-auto px-6 md:px-10 pb-10 pt-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden min-w-[1400px]"> {/* Increased min-width for new columns */}
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-900 text-white font-black uppercase tracking-[0.25em] text-[12px] md:text-[13px]">
              <tr>
                <th className="px-8 py-7 w-[18%] border-b border-slate-800">Contact Profile</th>
                <th className="px-6 py-7 w-[15%] border-b border-slate-800">Email</th>
                <th className="px-6 py-7 w-[12%] border-b border-slate-800">Phone</th>
                <th className="px-6 py-7 w-[10%] border-b border-slate-800">Job Title</th>
                <th className="px-6 py-7 w-[10%] border-b border-slate-800">Department</th>
                <th className="px-6 py-7 w-[12%] border-b border-slate-800">Address</th>
                <th className="px-6 py-7 w-[10%] border-b border-slate-800">Source</th>
                <th className="px-8 py-7 w-[18%] border-b border-slate-800">Latest Deal Intelligence</th>
                <th className="px-4 py-7 w-[80px] border-b border-slate-800 text-center">Opt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const latestDeal = getLatestDealForLead(lead.id);
                return (
                  <tr key={lead.id} className="hover:bg-blue-50/40 transition-all border-l-4 border-transparent hover:border-blue-600 group">
                    <td className="px-8 py-8 cursor-pointer align-top" onClick={() => setSelectedLeadId(lead.id)}>
                      <div className="flex flex-col gap-1">
                        <div className="font-black text-slate-900 text-xl group-hover:text-blue-700 transition-colors leading-tight">{lead.name}</div>
                        <div className="text-slate-400 font-black text-[11px] uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <Building2 size={12} className="text-slate-300" />
                            {lead.companyName}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-8 align-top">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold">
                            <Mail size={12} className="text-slate-400" /> {lead.email}
                        </div>
                    </td>
                    <td className="px-6 py-8 align-top">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold">
                            <Phone size={12} className="text-slate-400" /> {lead.phone}
                        </div>
                    </td>
                    <td className="px-6 py-8 align-top">
                        <div className="text-[11px] text-blue-600 font-extrabold uppercase tracking-wide">{lead.jobTitle}</div>
                    </td>
                    <td className="px-6 py-8 align-top">
                        <div className="text-[11px] text-slate-700 font-bold">{lead.department}</div>
                    </td>
                    <td className="px-6 py-8 align-top">
                        {lead.address && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold">
                            <MapPin size={12} className="text-slate-400" /> {lead.address}
                          </div>
                        )}
                    </td>

                    <td className="px-6 py-8 align-top">
                      <span className="inline-block px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        {lead.source || 'Manual'}
                      </span>
                    </td>

                    <td className="px-8 py-8 align-top">
                      {latestDeal ? (
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${latestDeal.pipelineStatus === 'Won' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{latestDeal.pipelineStatus}</span>
                          </div>
                          <div className="text-slate-800 font-extrabold text-sm leading-relaxed line-clamp-3 italic">
                            "{latestDeal.activity}"
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold italic text-sm">No associated deals in pipeline</span>
                      )}
                    </td>

                    <td className="px-4 py-8 text-center align-top">
                        <div className="flex flex-col items-center gap-2">
                            <button onClick={() => handleEditClick(lead)} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                                <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDelete(lead.id)} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Multi-Panel Detail Modal */}
      {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-200">
                  <div className="p-8 bg-slate-950 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
                      <div className="flex items-center gap-8">
                          <div className="p-5 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-900/50">
                              <User size={40} />
                          </div>
                          <div>
                              <h3 className="text-4xl font-black uppercase tracking-tight leading-none">{selectedLead.name}</h3>
                              <div className="flex items-center gap-3 mt-3">
                                <p className="text-blue-400 text-sm font-black uppercase tracking-[0.2em]">{selectedLead.jobTitle}</p>
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                                <p className="text-slate-400 text-sm font-bold">{selectedLead.companyName}</p>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setSelectedLeadId(null); handleEditClick(selectedLead); }} className="px-6 py-4 bg-white/10 hover:bg-white text-white hover:text-slate-950 rounded-2xl transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest active:scale-95">
                            <Edit3 size={18} /> Edit Core Profile
                        </button>
                        <button onClick={() => setSelectedLeadId(null)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
                            <X size={40} />
                        </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-100">
                      <div className="p-10 space-y-12 col-span-1 bg-slate-50/80">
                          <div className="space-y-8">
                              <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                  <ClipboardList size={18} className="text-blue-600"/> Verified Contact Identifiers
                              </h4>
                              <div className="space-y-6">
                                  <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Email</span>
                                      <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                                          <Mail size={18} className="text-blue-500 shrink-0" /> {selectedLead.email}
                                      </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Line</span>
                                      <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                                          <Phone size={18} className="text-blue-500 shrink-0" /> {selectedLead.phone}
                                      </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Division</span>
                                      <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                                          <Briefcase size={18} className="text-blue-500 shrink-0" /> {selectedLead.department}
                                      </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headquarters</span>
                                      <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                                          <MapPin size={18} className="text-blue-500 shrink-0" /> {selectedLead.address || 'Not set'}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-4 pt-4">
                              <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Capture Source Intel</h4>
                              <div className="p-6 bg-blue-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-between">
                                  <span>{selectedLead.source}</span>
                                  <Share2 size={18} className="opacity-60" />
                              </div>
                          </div>

                          <div className="space-y-5 pt-4">
                              <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-between">
                                  Persistent Sales Notes
                                  <Save size={16} className="text-blue-500" />
                              </h4>
                              <textarea 
                                  value={selectedLead.userNotes || ''} 
                                  onChange={(e) => handleUpdateUserNotes(selectedLead.id, e.target.value)}
                                  className="w-full h-48 p-6 bg-white border-2 border-slate-200 rounded-3xl text-base font-bold text-slate-800 focus:border-blue-600 outline-none transition-all shadow-inner resize-none leading-relaxed"
                                  placeholder="Record long-term strategic observations here..."
                              />
                          </div>
                      </div>

                      <div className="p-10 col-span-2 bg-white">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.25em] mb-12 flex items-center gap-4">
                              <History className="text-blue-600" size={24} /> 
                              Engagement Lifecycle & Historic Logs
                          </h4>
                          
                          <div className="relative border-l-4 border-slate-100 ml-6 space-y-12 pl-12">
                              {leadActivities.length === 0 ? (
                                  <div className="py-20 text-center">
                                      <History size={64} className="mx-auto text-slate-100 mb-6" />
                                      <p className="text-slate-300 font-black uppercase tracking-widest text-xl">No active engagement logs found</p>
                                  </div>
                              ) : (
                                  leadActivities.map((activity, idx) => (
                                      <div key={activity.id} className="relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                          <div className="absolute -left-[62px] top-1.5 w-7 h-7 rounded-full bg-white border-[6px] border-blue-600 shadow-xl z-10 flex items-center justify-center">
                                              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                                          </div>
                                          <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all group/item">
                                              <div className="flex justify-between items-start mb-6">
                                                  <div>
                                                      <span className="text-[11px] font-black text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-xl uppercase tracking-widest block mb-2 w-fit">
                                                          {activity.quotationNo ? `REF: ${activity.quotationNo}` : 'Lifecycle Event'}
                                                      </span>
                                                      <h5 className="font-black text-slate-900 text-2xl tracking-tight">{activity.description}</h5>
                                                  </div>
                                                  <span className="text-[12px] font-black text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest shadow-sm">
                                                      {activity.date}
                                                  </span>
                                              </div>
                                              <div className="text-base text-slate-700 font-extrabold leading-loose p-6 bg-white rounded-2xl border border-slate-100 shadow-inner">
                                                  {activity.activity}
                                              </div>
                                              <div className="mt-6 flex justify-end">
                                                  <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                                      View Full Analysis <ChevronRight size={14} />
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Modern Side-Drawer Form for Entry */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/70 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-400 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20 shadow-sm shrink-0">
              <div>
                <h3 className="font-black text-3xl text-slate-900 uppercase tracking-tight">
                    {editingLead ? 'Update Profile' : 'Register Contact'}
                </h3>
                <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">
                    Enter precise business identifiers.
                </p>
              </div>
              <button onClick={() => { setShowForm(false); setEditingLead(null); }} className="text-slate-400 hover:text-black p-3 hover:bg-slate-100 rounded-full transition-all">
                <X size={32} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 pb-32 flex-1">
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className={labelTextStyles}>Full Consultant Identity *</label>
                  <input required name="name" value={formData.name || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="First & Last Name" />
                </div>
                <div>
                  <label className={labelTextStyles}>Target Organization *</label>
                  <input required name="companyName" value={formData.companyName || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="Company Legal Name" />
                </div>
                
                <div className="relative group">
                  <label className={`${labelTextStyles} flex items-center gap-2`}>
                    Lead Intake Source *
                    <HelpCircle size={14} className="text-slate-400" />
                    <Tooltip text="Identification of lead origin is critical for channel attribution and conversion tracking." />
                  </label>
                  <input required name="source" value={formData.source || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="LinkedIn / AI Prospect / Event" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className={labelTextStyles}>Verified Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="name@domain.com" />
                    </div>
                    <div>
                    <label className={labelTextStyles}>Direct Phone</label>
                    <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="+60..." />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className={labelTextStyles}>Job Title</label>
                      <input name="jobTitle" value={formData.jobTitle || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="Role / Rank" />
                  </div>
                  <div>
                      <label className={labelTextStyles}>Business Unit</label>
                      <input name="department" value={formData.department || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="Dept." />
                  </div>
                </div>

                <div>
                  <label className={labelTextStyles}>Physical Business Address</label>
                  <input name="address" value={formData.address || ''} onChange={handleInputChange} className={commonInputStyles} placeholder="HQ or Site Location" />
                </div>

                <div>
                  <label className={labelTextStyles}>Capture Brief & Opportunity</label>
                  <textarea name="projectBrief" value={formData.projectBrief || ''} onChange={handleInputChange} className={`${commonInputStyles} h-40 resize-none leading-relaxed`} placeholder="Initial requirements and pain points..." />
                </div>
              </div>

              <div className="pt-10">
                <button type="submit" className="w-full bg-slate-950 hover:bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl uppercase tracking-widest transition-all active:scale-95 border-b-8 border-slate-800 hover:border-blue-800">
                    {editingLead ? 'Update Registry' : 'Commit To Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
