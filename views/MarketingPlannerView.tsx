
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, Sparkles, Linkedin, Newspaper, BookOpen, Loader2, CheckCircle, Clock, ExternalLink, Edit3, X, Copy, Check, FileText, Save, Send, ChevronLeft, ChevronRight, Briefcase, Zap, Phone, Users, MapPin, AlertCircle } from 'lucide-react';
import { generateMarketingCalendar, generateMarketingContent } from '../services/geminiService';
import { MarketingTask, UserProfile, Deal } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface MarketingPlannerViewProps {
  userProfile?: UserProfile;
  deals: Deal[];
}

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'AI_TASK' | 'PIPELINE_ACTIVITY';
  details?: string;
  meta?: any;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MarketingPlannerView: React.FC<MarketingPlannerViewProps> = ({ userProfile, deals }) => {
  const [tasks, setTasks] = useState<MarketingTask[]>(() => {
    const saved = localStorage.getItem('vsd_marketing_tasks');
    const initialTasks: MarketingTask[] = saved ? JSON.parse(saved) : [];
    
    // Add the specific "Q3 Channel Partner Update" task if not already present
    const q3TaskExists = initialTasks.some(task => task.title === 'Q3 Channel Partner Update');
    if (!q3TaskExists) {
      initialTasks.push({
        id: 'q3-update-newsletter',
        type: 'Newsletter',
        title: 'Q3 Channel Partner Update',
        topic: 'Latest Product Features',
        content: `Subject: Elevate Your Offerings: VSD Communications Q3 Partner Update!

Dear Valued Partner,

We're thrilled to share the latest innovations from VSD Communications designed to boost your sales and enhance your customers' experiences! Our Q3 updates bring powerful new features across our Mimosa, Altai, Ligowave, and Wi-Tek solutions, ensuring you stay ahead in the competitive wireless connectivity landscape.

**What's New This Quarter?**

*   **Mimosa A6 Enhancements**: Experience up to 2.5 Gbps throughput with improved interference mitigation for dense urban deployments. Our new "Adaptive Beamforming" algorithm dynamically steers signals, maximizing spectrum efficiency and client capacity.
*   **Altai Super WiFi 6 Integration**: Seamlessly integrate Altai’s cutting-edge WiFi 6 access points with existing infrastructure. Features include "Smart Antenna Technology" for extended range and superior penetration, perfect for large venues and complex environments.
*   **Ligowave Next-Gen PtMP**: Introducing our new point-to-multipoint (PtMP) solution with "TDMA Synchronization+", dramatically reducing latency and increasing reliability for critical applications like CCTV backhaul and smart city networks.
*   **Wi-Tek Industrial Series**: Expanded ruggedized portfolio with "IP68-rated Switches" and "Fiber Converters" built for extreme temperatures and harsh industrial conditions, ensuring uninterrupted Layer 1 connectivity in challenging sites like ports and manufacturing plants.

**Why These Updates Matter to YOU:**

These advancements are engineered to help you:
*   **Win More Deals**: Offer unparalleled performance and reliability that outpaces the competition.
*   **Expand Your Market**: Address new verticals and use cases with purpose-built solutions.
*   **Increase Profitability**: Leverage new features for upsell opportunities and higher customer satisfaction.

Join us for an exclusive webinar next month where our product experts will deep dive into these features and demonstrate their real-world impact. Keep an eye on your inbox for the invitation!

Should you have any immediate questions, please do not hesitate to reach out to your dedicated Channel Manager.

Committed to Your Success,

The VSD Communications Partner Team`,
        fullDraft: `Subject: Elevate Your Offerings: VSD Communications Q3 Partner Update!

Dear Valued Partner,

We're thrilled to share the latest innovations from VSD Communications designed to boost your sales and enhance your customers' experiences! Our Q3 updates bring powerful new features across our Mimosa, Altai, Ligowave, and Wi-Tek solutions, ensuring you stay ahead in the competitive wireless connectivity landscape.

**What's New This Quarter?**

*   **Mimosa A6 Enhancements**: Experience up to 2.5 Gbps throughput with improved interference mitigation for dense urban deployments. Our new "Adaptive Beamforming" algorithm dynamically steers signals, maximizing spectrum efficiency and client capacity.
*   **Altai Super WiFi 6 Integration**: Seamlessly integrate Altai’s cutting-edge WiFi 6 access points with existing infrastructure. Features include "Smart Antenna Technology" for extended range and superior penetration, perfect for large venues and complex environments.
*   **Ligowave Next-Gen PtMP**: Introducing our new point-to-multipoint (PtMP) solution with "TDMA Synchronization+", dramatically reducing latency and increasing reliability for critical applications like CCTV backhaul and smart city networks.
*   **Wi-Tek Industrial Series**: Expanded ruggedized portfolio with "IP68-rated Switches" and "Fiber Converters" built for extreme temperatures and harsh industrial conditions, ensuring uninterrupted Layer 1 connectivity in challenging sites like ports and manufacturing plants.

**Why These Updates Matter to YOU:**

These advancements are engineered to help you:
*   **Win More Deals**: Offer unparalleled performance and reliability that outpaces the competition.
*   **Expand Your Market**: Address new verticals and use cases with purpose-built solutions.
*   **Increase Profitability**: Leverage new features for upsell opportunities and higher customer satisfaction.

Join us for an exclusive webinar next month where our product experts will deep dive into these features and demonstrate their real-world impact. Keep an eye on your inbox for the invitation!

Should you have any immediate questions, please do not hesitate to reach out to your dedicated Channel Manager.

Committed to Your Success,

The VSD Communications Partner Team`,
        date: new Date().toISOString().split('T')[0], // Today's date
        status: 'Draft',
        priority: 'Medium'
      });
    }
    // Ensure all tasks have a priority field, default to 'Medium' if missing (for old data)
    return initialTasks.map(task => ({ ...task, priority: task.priority || 'Medium' }));
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const [generatedPlan, setGeneratedPlan] = useState<any>(() => {
      const saved = localStorage.getItem('vsd_marketing_plan');
      return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MarketingTask | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('vsd_marketing_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('vsd_marketing_plan', JSON.stringify(generatedPlan));
  }, [generatedPlan]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const monthName = MONTHS[selectedMonth];
      const result = await generateMarketingCalendar(monthName, selectedYear, userProfile);
      
      setGeneratedPlan(result.eventPlan);

      // Transform weekly content into tasks
      const newTasks: MarketingTask[] = result.weeklyContent.map((item: any, idx: number) => {
          // Calculate approximate date: 1st, 8th, 15th, 22nd
          const day = 1 + (item.week - 1) * 7;
          const date = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];

          return {
              id: Date.now().toString() + idx,
              type: item.channel === 'Email' ? 'Newsletter' : (item.channel === 'LinkedIn Post' ? 'LinkedIn' : (item.channel === 'WhatsApp message' ? 'WhatsApp' : 'Blog')), // Map to existing types
              title: `Week ${item.week}: ${item.focus}`,
              topic: item.focus,
              content: item.copy, // The full copy is already generated
              fullDraft: item.copy,
              date: date,
              status: 'Draft',
              priority: 'Medium' // Default priority for AI-generated tasks
          } as MarketingTask;
      });

      // Filter out old tasks for this specific month/year to avoid duplicates if re-generating
      const otherTasks = tasks.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() !== selectedMonth || tDate.getFullYear() !== selectedYear;
      });

      setTasks([...otherTasks, ...newTasks]);

    } catch (e) {
      console.error(e);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedYear(parseInt(e.target.value));
  };

  const handleUpdateTask = (updatedTask: MarketingTask) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    setSelectedTask(updatedTask); // Update selected task in modal
  };

  // Calendar Logic
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const calendarEvents = useMemo(() => {
      const events: CalendarEvent[] = [];

      // 1. Add Marketing Tasks (AI)
      tasks.forEach(task => {
          const tDate = new Date(task.date);
          if (tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear) {
              events.push({
                  id: task.id,
                  date: tDate,
                  title: task.title,
                  type: 'AI_TASK',
                  details: task.content,
                  meta: task
              });
          }
      });

      // 2. Add Pipeline Activities (Tracker)
      deals.forEach(deal => {
          if (deal.activityHistory) {
              deal.activityHistory.forEach(log => {
                  const lDate = new Date(log.date);
                  if (lDate.getMonth() === selectedMonth && lDate.getFullYear() === selectedYear) {
                      events.push({
                          id: log.id,
                          date: lDate,
                          title: `${log.type} with ${deal.contactPersonName}`,
                          type: 'PIPELINE_ACTIVITY',
                          details: log.notes,
                          meta: { dealName: deal.companyName, ...log }
                      });
                  }
              });
          }
      });

      return events;
  }, [tasks, deals, selectedMonth, selectedYear]);

  const renderCalendarGrid = () => {
      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear); // 0 = Sunday
      const days = [];
      
      // Empty cells for previous month
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100 rounded-xl opacity-50"></div>);
      }

      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
          const currentDayEvents = calendarEvents.filter(e => e.date.getDate() === day);
          const isToday = day === new Date().getDate() && selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

          days.push(
              <div key={day} className={`min-h-[140px] p-2 border border-slate-200 rounded-xl bg-white hover:border-indigo-300 transition-colors relative flex flex-col gap-1 ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
                  <span className={`text-sm font-black mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                      {currentDayEvents.map(event => (
                          <div 
                              key={event.id}
                              onClick={() => {
                                  if (event.type === 'AI_TASK') setSelectedTask(event.meta);
                                  else setSelectedEvent(event);
                              }}
                              className={`p-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-105 border-l-2 shadow-sm
                                  ${event.type === 'AI_TASK' 
                                      ? 'bg-purple-50 text-purple-700 border-purple-500 hover:bg-purple-100' 
                                      : 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100'}`}
                          >
                              <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1">
                                      {event.type === 'AI_TASK' ? <Sparkles size={10} /> : <Zap size={10} />}
                                      <span className="truncate">{event.title}</span>
                                  </div>
                                  {event.type === 'AI_TASK' && (
                                      <div className={`w-2 h-2 rounded-full 
                                          ${event.meta.priority === 'High' ? 'bg-red-500' : 
                                            event.meta.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`
                                      }></div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      return days;
  };

  const handleCopyDraft = () => {
      if (selectedTask?.fullDraft) {
          navigator.clipboard.writeText(selectedTask.fullDraft);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const getStatusClasses = (status: MarketingTask['status']) => {
    switch (status) {
      case 'Draft': return 'bg-slate-200 text-slate-700';
      case 'Scheduled': return 'bg-indigo-100 text-indigo-700';
      case 'Published': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const getPriorityClasses = (priority: MarketingTask['priority']) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  };


  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-6 bg-white border-b border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 z-10 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <CalendarIcon className="text-indigo-600" />
            VSD Marketing Commander
          </h2>
          <p className="text-slate-500 mt-1 font-bold text-sm">
            Unified View: AI Campaign Strategy & Pipeline Activity Logs.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl">
            <select 
                value={selectedMonth} 
                onChange={handleMonthChange}
                className="bg-white px-4 py-2 rounded-xl font-black text-slate-900 outline-none border border-slate-200 focus:border-indigo-500 text-sm"
            >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
                value={selectedYear} 
                onChange={handleYearChange}
                className="bg-white px-4 py-2 rounded-xl font-black text-slate-900 outline-none border border-slate-200 focus:border-indigo-500 text-sm"
            >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
            </select>
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-black text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest transition-all shadow-md active:scale-95 text-xs flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="text-amber-300" />}
                Generate Plan
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* LEFT PANEL: Event Plan & Details */}
        <div className="w-full lg:w-96 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Yearly Target</h3>
                <div className="text-3xl font-black tracking-tighter mb-4 text-white">RM 5,000,000</div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-3/4"></div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Designing Event Strategy...</p>
                </div>
            ) : generatedPlan ? (
                <div className="space-y-6 animate-in slide-in-from-left duration-500">
                    <div className="border-b-2 border-indigo-50 pb-4">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">Event Theme</span>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mt-2">{generatedPlan.theme}</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock size={12} /> Agenda
                            </h4>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{generatedPlan.agenda}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Users size={12} /> Speakers
                            </h4>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{generatedPlan.speakers}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} /> Activity
                            </h4>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{generatedPlan.activity}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 opacity-40">
                    <Sparkles size={48} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Plan Generated</p>
                </div>
            )}
        </div>

        {/* RIGHT PANEL: Calendar Grid */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
                <div className="grid grid-cols-7 gap-4 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                    {renderCalendarGrid()}
                </div>
             </div>
             
             <div className="mt-6 flex items-center gap-6">
                 <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                     <span className="text-xs font-bold text-slate-600">AI Marketing Task</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                     <span className="text-xs font-bold text-slate-600">Pipeline Activity Log</span>
                 </div>
             </div>
        </div>
      </div>

      {/* Task/Activity Detail Modal */}
      {(selectedTask || selectedEvent) && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in fade-in duration-300">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          {selectedTask ? (
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-white bg-purple-600 px-2 py-1 rounded uppercase tracking-widest">Marketing Task</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTask.date}</span>
                             </div>
                          ) : (
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-1 rounded uppercase tracking-widest">Pipeline Log</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEvent?.date.toLocaleDateString()}</span>
                             </div>
                          )}
                          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                              {selectedTask ? selectedTask.title : selectedEvent?.title}
                          </h3>
                      </div>
                      <button onClick={() => { setSelectedTask(null); setSelectedEvent(null); }} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                          <X size={28} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      {selectedTask ? (
                          <div className="space-y-6">
                               {/* Priority and Status Selectors */}
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Priority</label>
                                      <select 
                                          value={selectedTask.priority}
                                          onChange={(e) => handleUpdateTask({...selectedTask, priority: e.target.value as MarketingTask['priority']})}
                                          className={`w-full px-4 py-3 rounded-xl border-2 ${getPriorityClasses(selectedTask.priority)} font-bold text-sm outline-none cursor-pointer appearance-none`}
                                      >
                                          <option value="High">High</option>
                                          <option value="Medium">Medium</option>
                                          <option value="Low">Low</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest block">Status</label>
                                      <select 
                                          value={selectedTask.status}
                                          onChange={(e) => handleUpdateTask({...selectedTask, status: e.target.value as MarketingTask['status']})}
                                          className={`w-full px-4 py-3 rounded-xl border-2 ${getStatusClasses(selectedTask.status)} font-bold text-sm outline-none cursor-pointer appearance-none`}
                                      >
                                          <option value="Draft">Draft</option>
                                          <option value="Scheduled">Scheduled</option>
                                          <option value="Published">Published</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Strategy Context</h4>
                                  <p className="text-sm font-medium text-slate-700">{selectedTask.content}</p>
                              </div>
                              <div>
                                  <div className="flex justify-between items-center mb-4">
                                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                          <FileText size={16} className="text-indigo-600"/> Content Draft
                                      </h4>
                                      <button onClick={handleCopyDraft} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                                          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                                      </button>
                                  </div>
                                  <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-inner text-lg font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                                      {selectedTask.fullDraft}
                                  </div>
                              </div>
                          </div>
                      ) : selectedEvent ? (
                          <div className="space-y-6">
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 bg-slate-50 rounded-2xl">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company</span>
                                       <div className="font-bold text-slate-900">{selectedEvent.meta.dealName}</div>
                                   </div>
                                   <div className="p-4 bg-slate-50 rounded-2xl">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Type</span>
                                       <div className="font-bold text-slate-900">{selectedEvent.meta.type}</div>
                                   </div>
                               </div>
                               <div>
                                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Meeting Notes</h4>
                                   <div className="bg-white border border-slate-200 p-6 rounded-2xl text-slate-700 leading-relaxed shadow-sm">
                                       {selectedEvent.details}
                                   </div>
                               </div>
                          </div>
                      ) : null}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
