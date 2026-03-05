import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Send, 
  Briefcase, 
  Linkedin, 
  Mail, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  ChevronRight,
  UserCircle,
  Upload,
  FileUp,
  X
} from 'lucide-react';
import Markdown from 'react-markdown';
import { AppPhase, CVProfile, JobAnalysis, ApplicationRoute } from './types';
import { 
  analyzeCV, 
  tailorCV, 
  generateOutreach, 
  generateCoverLetter, 
  generatePortalAnswers 
} from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.ONBOARDING);
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [jd, setJd] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  
  const [route, setRoute] = useState<'MAIL' | 'PORTAL' | null>(null);
  const [routeInput, setRouteInput] = useState('');
  const [routeResult, setRouteResult] = useState<string | null>(null);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setCvFile({
          data: base64,
          mimeType: file.type,
          name: file.name
        });
        setCvText(''); // Clear text if file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboarding = async () => {
    if (!cvText.trim() && !cvFile) return;
    setIsAnalyzing(true);
    try {
      const input = cvFile ? { data: cvFile.data, mimeType: cvFile.mimeType } : cvText;
      const analysis = await analyzeCV(input);
      setCvProfile({
        rawText: cvFile ? `File: ${cvFile.name}` : cvText,
        analysis: analysis || '',
        formatting: 'Standard'
      });
      setPhase(AppPhase.EXECUTION);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleJobAnalysis = async () => {
    if (!jd.trim() || !cvProfile) return;
    setIsTailoring(true);
    setJobAnalysis(null);
    setRoute(null);
    setRouteResult(null);
    try {
      const tailored = await tailorCV(cvProfile.analysis, jd);
      const outreach = await generateOutreach(tailored || '', jd);
      setJobAnalysis({
        jd,
        tailoredCV: tailored || '',
        linkedinMessage: outreach || ''
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleRouteExecution = async () => {
    if (!jobAnalysis || !route) return;
    setIsGeneratingRoute(true);
    try {
      let result = '';
      if (route === 'MAIL') {
        result = await generateCoverLetter(jobAnalysis.tailoredCV, jd, routeInput) || '';
      } else {
        result = await generatePortalAnswers(jobAnalysis.tailoredCV, routeInput) || '';
      }
      setRouteResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Briefcase size={18} />
            </div>
            <span className="font-bold tracking-tight text-lg">CareerTailor AI</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-black/60">
            <div className={cn("flex items-center gap-1.5", phase === AppPhase.ONBOARDING && "text-emerald-600")}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
              Onboarding
            </div>
            <ChevronRight size={14} />
            <div className={cn("flex items-center gap-1.5", phase === AppPhase.EXECUTION && "text-emerald-600")}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
              Execution
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {phase === AppPhase.ONBOARDING ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to Onboarding</h1>
                <p className="text-black/60 text-lg">
                  I need to learn your professional profile to tailor your applications with 100% precision.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* File Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                      cvFile ? "border-emerald-500 bg-emerald-50" : "border-black/10 hover:border-emerald-500 hover:bg-emerald-50/30"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                    {cvFile ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <FileUp size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-emerald-700 truncate max-w-[200px]">{cvFile.name}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                            className="text-[10px] font-bold uppercase text-red-500 mt-1 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-black/5 text-black/40 rounded-full flex items-center justify-center">
                          <Upload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold">Upload PDF CV</p>
                          <p className="text-[10px] text-black/40 uppercase tracking-wider">Drag & drop or click</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Text Area */}
                  <div className="flex flex-col">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-2">
                      Or paste text
                    </label>
                    <textarea
                      value={cvText}
                      onChange={(e) => { setCvText(e.target.value); setCvFile(null); }}
                      placeholder="Paste your CV content here..."
                      className="flex-1 w-full p-4 bg-[#F9F9F8] border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={handleOnboarding}
                  disabled={isAnalyzing || (!cvText.trim() && !cvFile)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Learning your profile...
                    </>
                  ) : (
                    <>
                      Start Onboarding
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="execution"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Job Analysis Input */}
              <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Job Analysis</h2>
                    <p className="text-sm text-black/50">Provide the job description you're targeting</p>
                  </div>
                </div>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the Job Description here..."
                  className="w-full h-48 p-4 bg-[#F9F9F8] border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-sm"
                />
                <button
                  onClick={handleJobAnalysis}
                  disabled={isTailoring || !jd.trim()}
                  className="mt-4 bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-black/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isTailoring ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Tailor Materials
                </button>
              </section>

              {/* Results */}
              {jobAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Tailored CV */}
                  <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-black/5 flex flex-col"
                  >
                    <div className="p-6 border-b border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="text-emerald-500" size={18} />
                        Tailored CV
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(jobAnalysis.tailoredCV)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="p-6 overflow-auto max-h-[600px] text-sm leading-relaxed text-black/80 space-y-4 markdown-content">
                      <Markdown>{jobAnalysis.tailoredCV}</Markdown>
                    </div>
                  </motion.section>

                  <div className="space-y-8">
                    {/* LinkedIn Outreach */}
                    <motion.section 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-2xl shadow-sm border border-black/5 p-6"
                    >
                      <div className="flex items-center gap-2 font-bold mb-4">
                        <Linkedin className="text-blue-600" size={18} />
                        LinkedIn Outreach
                      </div>
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm italic text-blue-900">
                        {jobAnalysis.linkedinMessage}
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(jobAnalysis.linkedinMessage)}
                        className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                      >
                        Copy Message
                      </button>
                    </motion.section>

                    {/* Route Selection */}
                    <motion.section 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-sm border border-black/5 p-6"
                    >
                      <h3 className="font-bold mb-4">Application Route</h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                          onClick={() => { setRoute('MAIL'); setRouteResult(null); setRouteInput(''); }}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                            route === 'MAIL' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-black/5 hover:border-black/20"
                          )}
                        >
                          <Mail size={24} />
                          <span className="text-sm font-semibold">Mail</span>
                        </button>
                        <button
                          onClick={() => { setRoute('PORTAL'); setRouteResult(null); setRouteInput(''); }}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                            route === 'PORTAL' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-black/5 hover:border-black/20"
                          )}
                        >
                          <Globe size={24} />
                          <span className="text-sm font-semibold">Portal</span>
                        </button>
                      </div>

                      {route && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-black/60">
                            {route === 'MAIL' ? "Recruiter Email (Optional)" : "Paste Application Questions"}
                          </label>
                          <textarea
                            value={routeInput}
                            onChange={(e) => setRouteInput(e.target.value)}
                            placeholder={route === 'MAIL' ? "recruiter@company.com" : "1. Why do you want to work here?\n2. Describe a challenge..."}
                            className="w-full p-3 bg-[#F9F9F8] border border-black/5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            rows={route === 'PORTAL' ? 6 : 1}
                          />
                          <button
                            onClick={handleRouteExecution}
                            disabled={isGeneratingRoute || (route === 'PORTAL' && !routeInput.trim())}
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isGeneratingRoute ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            Generate {route === 'MAIL' ? 'Cover Letter' : 'Answers'}
                          </button>
                        </div>
                      )}

                      {routeResult && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase text-emerald-700">Result</span>
                            <button 
                              onClick={() => navigator.clipboard.writeText(routeResult)}
                              className="text-[10px] font-bold uppercase text-emerald-600"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="text-sm leading-relaxed text-black/80 space-y-4 markdown-content">
                            <Markdown>{routeResult}</Markdown>
                          </div>
                        </motion.div>
                      )}
                    </motion.section>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Profile Summary Tooltip/Sidebar (Optional) */}
      {cvProfile && phase === AppPhase.EXECUTION && (
        <div className="fixed bottom-6 right-6">
          <button 
            className="w-12 h-12 bg-white shadow-lg border border-black/5 rounded-full flex items-center justify-center text-emerald-600 hover:scale-110 transition-transform"
            title="View Learned Profile"
          >
            <UserCircle size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
