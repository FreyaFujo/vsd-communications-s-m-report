
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, MessageSquareQuote, Mic, MicOff, X, Volume2, PenTool, Copy, Check, Sparkles, Layers, Type as TypeIcon, Star, Smartphone } from 'lucide-react';
import { getCoachingChat, getAiClient, generateSalesScript } from '../services/geminiService';
import { Modality } from '@google/genai';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { UserProfile } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

type TabState = 'chat' | 'script';

export const CoachingView: React.FC<{ userProfile?: UserProfile }> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState<TabState>('chat');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: `Hello${userProfile?.name ? ` ${userProfile.name}` : ''}! I'm your AI Sales Performance Coach. Ready to scale your pipeline today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [scriptParams, setScriptParams] = useState({
    scenario: 'Cold Email',
    target: '',
    valueProp: '',
    tone: 'Professional',
    variations: 1,
    // WhatsApp Specifics
    goal: '',
    outcome: '',
    cta: ''
  });
  const [isCustomTone, setIsCustomTone] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState<number | null>(null);

  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    chatSessionRef.current = getCoachingChat([], userProfile);
    return () => {
        stopVoiceSession();
    };
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on scenario
    if (scriptParams.scenario === 'WhatsApp Outreach') {
        if (!scriptParams.goal || !scriptParams.outcome || !scriptParams.cta) return;
    } else {
        if (!scriptParams.target || !scriptParams.valueProp) return;
    }

    setIsGeneratingScript(true);
    setGeneratedScript('');
    setSelectedVariationIdx(null);
    try {
        const script = await generateSalesScript(
            scriptParams.scenario,
            scriptParams.target,
            scriptParams.valueProp,
            scriptParams.tone,
            scriptParams.variations,
            userProfile,
            scriptParams.scenario === 'WhatsApp Outreach' ? {
                goal: scriptParams.goal,
                outcome: scriptParams.outcome,
                cta: scriptParams.cta
            } : undefined
        );
        setGeneratedScript(script);
    } catch (error) {
        console.error(error);
    } finally {
        setIsGeneratingScript(false);
    }
  };

  const handleCopyVariation = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSessionRef.current) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: result.text || "I'm thinking..." };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoiceSession = async () => {
    setIsVoiceMode(true);
    setIsConnected(false);
    try {
        const ai = getAiClient();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                systemInstruction: `You are a world-class Elite Sales Coach. 
                Provide high-impact, concise strategy advice for B2B Sales Channel Consultants. 
                Be high-energy, focused on results, and act as a strategic partner to the user.
                User context: ${userProfile?.name ? `Working with ${userProfile.name} at ${userProfile.companyName}` : 'Anonymous Consultant'}.`
            },
            callbacks: {
                onopen: () => {
                    setIsConnected(true);
                    const source = ctx.createMediaStreamSource(stream);
                    const processor = ctx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (e) => {
                        if (isMuted) return;
                        const inputData = e.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                        
                        const bytes = new Uint8Array(int16.buffer);
                        let binary = '';
                        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                        
                        sessionPromise.then((session: any) => {
                            session.sendRealtimeInput({ media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' } });
                        });
                    };
                    source.connect(processor);
                    processor.connect(ctx.destination);
                    inputSourceRef.current = source;
                    processorRef.current = processor;
                },
                onmessage: async (msg: any) => {
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        const binaryString = atob(base64Audio);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                        const dataInt16 = new Int16Array(bytes.buffer);
                        const buffer = outCtx.createBuffer(1, dataInt16.length, 24000);
                        const channelData = buffer.getChannelData(0);
                        for (let i = 0; i < channelData.length; i++) channelData[i] = dataInt16[i] / 32768.0;
                        const source = outCtx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(outCtx.destination);
                        const start = Math.max(outCtx.currentTime, nextStartTimeRef.current);
                        source.start(start);
                        nextStartTimeRef.current = start + buffer.duration;
                    }
                },
                onclose: () => stopVoiceSession(),
                onerror: () => stopVoiceSession()
            }
        });
        liveSessionRef.current = sessionPromise;
    } catch (err) {
        console.error("Voice start error:", err);
        setIsVoiceMode(false);
    }
  };

  const stopVoiceSession = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    liveSessionRef.current = null;
    setIsVoiceMode(false);
    setIsConnected(false);
    nextStartTimeRef.current = 0;
  };

  const commonInputStyles = "w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-black font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all placeholder-slate-400";

  // Parsing variations for better display
  const variations = generatedScript.split(/--- VARIATION \d+ ---/i).filter(v => v.trim().length > 0);

  const isWhatsApp = scriptParams.scenario === 'WhatsApp Outreach';
  const isFormValid = isWhatsApp 
    ? (scriptParams.goal && scriptParams.outcome && scriptParams.cta)
    : (scriptParams.target && scriptParams.valueProp);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b border-slate-100 bg-white z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
                    <MessageSquareQuote size={24} />
                </div>
                <div>
                    <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">Coach Gemini</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Strategic Performance Expert</p>
                </div>
            </div>
            {activeTab === 'chat' && (
                <button 
                    onClick={startVoiceSession}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                >
                    <Mic size={16} /> Live Coaching
                </button>
            )}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                AI Coach Chat
            </button>
            <button 
                onClick={() => setActiveTab('script')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'script' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <PenTool size={14} /> Script Generator
            </button>
        </div>
      </div>

      {isVoiceMode && (
        <div className="absolute inset-0 z-50 bg-slate-900/98 backdrop-blur-md flex flex-col items-center justify-center text-white p-6">
            <button onClick={stopVoiceSession} className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                <X size={28} />
            </button>
            <div className="flex flex-col items-center gap-10">
                <div className="relative">
                    {isConnected ? (
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-[0_0_60px_rgba(99,102,241,0.6)]">
                            <div className="w-32 h-32 rounded-full bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                                <Volume2 size={64} className="text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-40 h-40 rounded-full border-8 border-slate-800 border-t-indigo-500 animate-spin flex items-center justify-center">
                            <Loader2 size={64} className="animate-spin text-indigo-500" />
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">Performance Coaching</h3>
                    <p className="text-slate-400 font-medium">
                        {isConnected ? "Listening... Your coach is ready." : "Establishing secure link..."}
                    </p>
                </div>
                <div className="flex gap-6">
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-6 rounded-full transition-all border-4 ${isMuted ? 'bg-red-600 border-red-400 scale-110' : 'bg-slate-800 border-slate-700 hover:scale-110'}`}
                    >
                        {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                    <button onClick={stopVoiceSession} className="p-6 bg-slate-800 border-4 border-slate-700 rounded-full hover:bg-red-600 hover:border-red-400 transition-all">
                        <X size={32} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                        ${msg.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
                        {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className={`p-5 rounded-2xl shadow-md text-sm leading-relaxed font-medium
                        ${msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-black border border-slate-100 rounded-tl-none'}`}>
                        <MarkdownRenderer content={msg.text} className={msg.role === 'user' ? 'text-white' : ''} />
                    </div>
                    </div>
                </div>
                ))}
                {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-md border border-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for strategic advice or roleplay a scenario..."
                    className="w-full pl-8 pr-16 py-5 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 outline-none shadow-sm bg-white text-black font-bold transition-all text-lg"
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-3 top-3 bottom-3 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {isTyping ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                </button>
                </form>
            </div>
        </>
      )}

      {activeTab === 'script' && (
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
                        <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 text-xl uppercase tracking-tight">
                            <PenTool size={24} className="text-indigo-600" />
                            Performance Script Engine
                        </h3>
                        <form onSubmit={handleGenerateScript} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Outreach Scenario</label>
                                <select className={commonInputStyles} value={scriptParams.scenario} onChange={(e) => setScriptParams({...scriptParams, scenario: e.target.value})}>
                                    <option>Cold Email</option>
                                    <option>Cold Call (Opening)</option>
                                    <option>LinkedIn Outreach</option>
                                    <option>WhatsApp Outreach</option>
                                    <option>WhatsApp Message (Follow up)</option>
                                    <option>Follow-up (No Response)</option>
                                    <option>Objection Handling (Price)</option>
                                    <option>Gatekeeper Script</option>
                                </select>
                            </div>

                            {isWhatsApp ? (
                                <div className="space-y-5 animate-in slide-in-from-top-2 duration-300 bg-green-50/50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-2 text-green-700 font-bold text-sm mb-1">
                                        <Smartphone size={16} /> WhatsApp Strategy Mode
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Goal / Purpose of Writing</label>
                                        <input 
                                            className={commonInputStyles} 
                                            placeholder="e.g. Re-engage a cold lead" 
                                            value={scriptParams.goal} 
                                            onChange={(e) => setScriptParams({...scriptParams, goal: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Expected Outcome</label>
                                        <input 
                                            className={commonInputStyles} 
                                            placeholder="e.g. Get a quick 'Yes/No' response" 
                                            value={scriptParams.outcome} 
                                            onChange={(e) => setScriptParams({...scriptParams, outcome: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Call To Action (CTA)</label>
                                        <input 
                                            className={commonInputStyles} 
                                            placeholder="e.g. Can we chat at 2 PM?" 
                                            value={scriptParams.cta} 
                                            onChange={(e) => setScriptParams({...scriptParams, cta: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Target Audience</label>
                                        <input className={commonInputStyles} placeholder="e.g. CTO of a Mid-sized Enterprise" value={scriptParams.target} onChange={(e) => setScriptParams({...scriptParams, target: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Core Value Prop</label>
                                        <textarea className={`${commonInputStyles} h-28 resize-none`} placeholder="Key benefit or pain point solved..." value={scriptParams.valueProp} onChange={(e) => setScriptParams({...scriptParams, valueProp: e.target.value})} />
                                    </div>
                                </>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center justify-between text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                        Tone & Delivery
                                        <button type="button" onClick={() => setIsCustomTone(!isCustomTone)} className="text-indigo-600 hover:underline flex items-center gap-1">
                                            {isCustomTone ? 'Standard Tone' : 'Custom Tone...'}
                                        </button>
                                    </label>
                                    {isCustomTone ? (
                                        <div className="relative">
                                            <TypeIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                autoFocus
                                                className={`${commonInputStyles} pl-10`} 
                                                placeholder="e.g. Empathetic but firm"
                                                value={scriptParams.tone} 
                                                onChange={(e) => setScriptParams({...scriptParams, tone: e.target.value})} 
                                            />
                                        </div>
                                    ) : (
                                        <select className={commonInputStyles} value={scriptParams.tone} onChange={(e) => setScriptParams({...scriptParams, tone: e.target.value})}>
                                            <option>Professional</option>
                                            <option>Casual / Friendly</option>
                                            <option>Urgent / Direct</option>
                                            <option>Challenger (Provocative)</option>
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Variations</label>
                                    <div className="flex items-center gap-2">
                                        <Layers size={18} className="text-slate-400" />
                                        <select 
                                            className={commonInputStyles} 
                                            value={scriptParams.variations} 
                                            onChange={(e) => setScriptParams({...scriptParams, variations: parseInt(e.target.value)})}
                                        >
                                            <option value={1}>1 Version</option>
                                            <option value={2}>2 Versions</option>
                                            <option value={3}>3 Versions</option>
                                            <option value={5}>5 Versions</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isGeneratingScript || !isFormValid} className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-3">
                                {isGeneratingScript ? <Loader2 className="animate-spin" /> : <Sparkles size={20} className="text-amber-400" />}
                                Craft Outreach Intel
                            </button>
                        </form>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-100">
                        <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">The Output</h3>
                        {variations.length > 0 && (
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={12} /> {variations.length} Scenarios Generated
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6">
                        {isGeneratingScript ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                                <Loader2 className="animate-spin text-indigo-600" size={48} />
                                <p className="font-bold uppercase tracking-widest animate-pulse">Synthesizing multiple approaches...</p>
                            </div>
                        ) : variations.length > 0 ? (
                            variations.map((v, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => setSelectedVariationIdx(i)}
                                    className={`p-6 rounded-2xl border-2 transition-all relative group/v cursor-pointer ${selectedVariationIdx === i ? 'bg-indigo-50 border-indigo-400 shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${selectedVariationIdx === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>Option {i + 1}</span>
                                            {selectedVariationIdx === i && <Star size={12} className="text-amber-500 fill-amber-500 animate-bounce" />}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleCopyVariation(v, `v-${i}`); }}
                                            className="p-2 bg-white hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm border border-slate-100"
                                        >
                                            {copiedId === `v-${i}` ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className={`prose prose-slate prose-sm max-w-none text-black transition-opacity ${selectedVariationIdx === i ? 'opacity-100' : 'opacity-70 group-hover/v:opacity-100'}`}>
                                        <MarkdownRenderer content={v} />
                                    </div>
                                    {selectedVariationIdx === i && (
                                        <div className="absolute top-2 right-12 animate-in fade-in zoom-in duration-300">
                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-sm">Selected Approach</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
                                <PenTool size={64} className="opacity-10" />
                                <p className="text-center font-bold uppercase tracking-widest text-xs text-slate-400">Configure parameters to generate scripts</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
