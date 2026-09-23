import { useState, useRef, useEffect } from 'react';
import { askWatsonX } from '../lib/watsonx';
import { Bot, MessageSquare, X, Send, Sparkles, RefreshCw, Activity, Droplet, User, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedicalChatbot({ patients = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! 👋 I am **SamvedSync IV Assistant**.\n\nI can help you with IV drop rate calculations, reverse blood flow protocols, ESP32 Wi-Fi hardware telemetry, hospital alerts, and active patient monitoring status.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clean speech synthesis cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (text, idx) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for natural speech synthesis
    const cleanText = text
      .replace(/[*_~`#|>]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg = {
      sender: 'user',
      text: q.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setThinking(true);

    // Build system context from current hospital patient data
    const patientContext = patients.length > 0 
      ? `Currently tracking ${patients.length} patients: ${patients.map(p => `${p.name} (Bed ${p.bed_number}, Age ${p.age || '—'}, ${p.ward || 'ICU'})`).join(', ')}.`
      : 'Currently tracking active ICU and Ward patients.';

    const botAnswer = await askWatsonX(q, patientContext);

    setThinking(false);
    setMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        text: botAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    "How to calculate IV drop rate?",
    "Reverse blood flow protocol",
    "Hardware Wi-Fi telemetry",
    "AI Risk Analysis rules"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="group bg-gradient-to-r from-saline to-saline-dim text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:shadow-saline/30 hover:scale-105 transition-all duration-300 flex items-center gap-3 relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-2.5 font-semibold text-sm px-1">
              <img 
                src="/chatbot-logo.jpg" 
                alt="ChatBot" 
                className="w-7 h-7 rounded-full object-cover border border-white/60 shadow-sm"
              />
              <span className="hidden sm:inline">SamvedSync Assistant</span>
            </div>
            <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-[92vw] sm:w-[430px] h-[600px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-ink to-slate-900 text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-0.5 overflow-hidden">
                  <img 
                    src="/chatbot-logo.jpg" 
                    alt="SamvedSync IV Assistant" 
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    SamvedSync IV Assistant
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-saline-bright flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Smart Infusion Telemetry & Safety
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setSpeakingIndex(null);
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm relative group ${
                      m.sender === 'user'
                        ? 'bg-saline text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {/* Speaker Button for Bot Messages */}
                    {m.sender === 'bot' && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                        <button
                          onClick={() => handleSpeak(m.text, idx)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                            speakingIndex === idx
                              ? 'bg-saline text-white font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                          title="Read out response"
                        >
                          {speakingIndex === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" /> Stop Voice
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-saline" /> Listen Voice
                            </>
                          )}
                        </button>

                        {speakingIndex === idx && (
                          <div className="flex items-center gap-1 px-1">
                            <span className="w-1 h-3 bg-saline rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-saline rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-saline rounded-full animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl w-fit text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-saline" />
                  Processing response...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="whitespace-nowrap text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-saline/10 hover:text-saline dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700 transition-colors shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about IV drip rate, reverse blood flow, alerts, telemetry..."
                className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 text-ink dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || thinking}
                className="p-2.5 bg-saline hover:bg-saline-dim text-white rounded-xl disabled:opacity-50 transition-all shadow-md shadow-saline/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
