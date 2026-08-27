import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Shield, HeartPulse, Activity, Bell, Users, ShieldCheck, ArrowRight, Zap, Droplet, Sun, Moon, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import MedicalChatbot from '../components/MedicalChatbot';

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLoginClick = (role) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body text-ink dark:text-slate-100 selection:bg-saline selection:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-saline p-1.5 rounded-lg shadow-sm">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-ink dark:text-white">SamvedSync</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-saline transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-saline transition-colors">How It Works</a>
            <a href="#about" className="hover:text-saline transition-colors">About</a>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <button 
              onClick={() => handleLoginClick('doctor')}
              className="bg-ink dark:bg-saline text-white px-5 py-2 rounded-full hover:bg-ink-surface dark:hover:bg-saline-dim transition-colors shadow-sm font-semibold"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-display font-bold text-ink dark:text-white leading-tight mb-6">
                Smart IV Monitoring.<br />
                <span className="text-saline">Safer Patient Care.</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg leading-relaxed">
                An intelligent IV monitoring platform that tracks <strong>IV line drop rates</strong>, detects <strong>reverse blood flow</strong> in real time, and alerts healthcare teams instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => handleLoginClick('doctor')}
                  className="bg-saline hover:bg-saline-dim text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-saline/25"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 px-8 py-3 rounded-full font-medium transition-colors">
                  Explore Platform
                </button>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Dashboard Monitor Frame */}
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl shadow-slate-200/80 dark:shadow-none border border-slate-200/80 dark:border-slate-800 z-10 overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-mono text-slate-400">SamvedSync Monitor v4.0</span>
                </div>
                <div className="bg-saline/10 text-saline px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-saline animate-pulse" />
                  Live IoT Sensor
                </div>
              </div>

              {/* Monitor Inner UI with Drop Rate & Reverse Flow Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">IV Drop Rate</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-white">15.0 <span className="text-xs text-slate-400 font-normal">gtt/min</span></span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Flow</span>
                  <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Normal (No Backflow)
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">IV Level</span>
                  <span className="text-lg font-bold text-saline">78% <span className="text-xs text-slate-400 font-normal">Saline</span></span>
                </div>
              </div>

              {/* Live Waveform SVG */}
              <div className="bg-slate-900 rounded-2xl p-4 mb-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Bed 3B-01 ECG & Drip Signal</span>
                  <span className="text-emerald-400 font-mono">NORMAL</span>
                </div>
                <div className="h-20 w-full relative flex items-center">
                  <svg viewBox="0 0 500 80" className="w-full h-full">
                    <path d="M 0 40 L 100 40 L 110 10 L 120 70 L 130 40 L 220 40 L 230 20 L 240 60 L 250 40 L 350 40 L 360 5 L 370 75 L 380 40 L 500 40" fill="none" stroke="#4FB8AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <animate attributeName="stroke-dasharray" values="0, 1000; 1000, 0" dur="4s" repeatCount="indefinite" />
                    </path>
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { name: "Rahul Sharma", bed: "Bed 101", level: "78%", status: "Normal", bg: "bg-saline/10 text-saline" },
                  { name: "Sneha Patil", bed: "Bed 305", level: "12%", status: "Critical Low", bg: "bg-pulse/10 text-pulse" }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.bg}`} />
                      <span className="font-semibold text-slate-700">{p.name}</span>
                      <span className="text-slate-400">({p.bed})</span>
                    </div>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${p.bg}`}>{p.level} - {p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Realistic IV Bottle & Stand floating on the right */}
            <div className="absolute -right-6 md:-right-12 -top-10 z-20 w-36 md:w-44 drop-shadow-2xl">
              <svg viewBox="0 0 160 320" className="w-full h-full">
                {/* IV Metallic Stand */}
                <path d="M 80 0 L 80 40 M 60 10 L 80 0 L 100 10" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 80 20 L 80 60" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Hanger Strap */}
                <path d="M 72 35 Q 80 25 88 35 L 88 55 L 72 55 Z" fill="#64748B" />

                {/* IV Bag Container Body */}
                <rect x="40" y="55" width="80" height="150" rx="30" fill="url(#ivGlassGrad)" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
                
                {/* Liquid Inside Bag */}
                <path d="M 42 105 Q 80 110 118 105 L 118 180 Q 80 198 42 180 Z" fill="url(#salineLiquidGrad)" opacity="0.85">
                  <animate attributeName="d" values="M 42 105 Q 80 110 118 105 L 118 180 Q 80 198 42 180 Z; M 42 108 Q 80 103 118 108 L 118 180 Q 80 198 42 180 Z; M 42 105 Q 80 110 118 105 L 118 180 Q 80 198 42 180 Z" dur="4s" repeatCount="indefinite" />
                </path>

                {/* Liquid Level Lines & Measurement Scale */}
                <line x1="50" y1="80" x2="65" y2="80" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="50" y1="100" x2="65" y2="100" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="50" y1="120" x2="70" y2="120" stroke="#4FB8AE" strokeWidth="2" />
                <line x1="50" y1="140" x2="65" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="50" y1="160" x2="65" y2="160" stroke="#94A3B8" strokeWidth="1.5" />

                {/* Bag Highlight Gloss */}
                <path d="M 48 65 Q 45 130 50 190" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />

                {/* Drip Chamber Connector */}
                <rect x="70" y="205" width="20" height="15" fill="#475569" rx="3" />
                
                {/* Drip Chamber Clear Cylinder */}
                <rect x="73" y="220" width="14" height="35" fill="rgba(255,255,255,0.7)" stroke="#CBD5E1" strokeWidth="1.5" rx="4" />
                {/* Drip Liquid Level in Chamber */}
                <rect x="74" y="240" width="12" height="14" fill="#4FB8AE" opacity="0.7" rx="2" />
                
                {/* Falling Drip Animation */}
                <circle cx="80" cy="225" r="2.5" fill="#4FB8AE">
                  <animate attributeName="cy" values="223;241;223" keyTimes="0;0.7;1" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.65;0.7;1" dur="1.4s" repeatCount="indefinite" />
                </circle>

                {/* Tubing */}
                <path d="M 80 255 Q 85 290 50 300 T 90 320" stroke="#93C5FD" strokeWidth="3" fill="none" opacity="0.8" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="ivGlassGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#F8FAFC" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="salineLiquidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6FD4C9" />
                    <stop offset="100%" stopColor="#2E7069" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Background Glows */}
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-saline/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </main>

      {/* Role Login Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-ink mb-4">Choose Your Portal</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Secure access tailored to your specific role in the hospital.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: 'doctor',
                icon: Stethoscope,
                title: "Doctor Login",
                desc: "Manage patients, admins, nurses and hospital-wide monitoring.",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                role: 'admin',
                icon: Shield,
                title: "Admin Login",
                desc: "Manage patients, nurses and day-to-day hospital operations.",
                color: "text-purple-600",
                bg: "bg-purple-50"
              },
              {
                role: 'nurse',
                icon: HeartPulse,
                title: "Nurse Login",
                desc: "Monitor assigned patients and receive real-time IV alerts.",
                color: "text-rose-600",
                bg: "bg-rose-50"
              }
            ].map((card, i) => (
              <FadeIn delay={i * 0.15} key={i}>
                <div 
                  onClick={() => handleLoginClick(card.role)}
                  className="group relative p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden block text-center"
                >
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${card.bg} ${card.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink mb-3">{card.title}</h3>
                  <p className="text-sm text-slate-500 mb-8">{card.desc}</p>
                  
                  <div className="inline-flex items-center gap-2 font-medium text-sm text-white bg-ink px-6 py-2.5 rounded-full group-hover:bg-saline transition-colors">
                    Login as {card.title.split(' ')[0]}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-ink mb-4">Why SamvedSync?</h2>
              <p className="text-slate-600">Built to empower healthcare teams with actionable intelligence.</p>
            </div>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Activity, title: "Real-Time Monitoring", desc: "Monitor IV conditions continuously without manual bedside checks." },
              { icon: Bell, title: "Smart Alerts", desc: "Identify abnormal conditions quickly before they become critical." },
              { icon: Users, title: "Role-Based Access", desc: "Doctors, admins, and nurses see tools relevant to their responsibilities." },
              { icon: ShieldCheck, title: "Patient Safety", desc: "Help healthcare teams respond faster to IV-related issues." },
            ].map((feature, i) => (
              <FadeIn delay={i * 0.1} key={i}>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-saline/10 text-saline flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-lg text-ink mb-2">{feature.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-ink mb-4">How It Works</h2>
              <p className="text-slate-600">Simple steps for smarter patient care</p>
            </div>
          </FadeIn>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-slate-100">
              <motion.div 
                className="h-full bg-saline"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.2 }}
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { step: "01", title: "Connect", desc: "Patient IV monitoring device collects readings in real-time." },
                { step: "02", title: "Monitor", desc: "SamvedSync processes and displays monitoring data." },
                { step: "03", title: "Alert", desc: "Staff receives alerts & takes action quickly." }
              ].map((item, i) => (
                <FadeIn delay={i * 0.3} key={i}>
                  <div className="relative text-center z-10">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-slate-50 rounded-full shadow-lg flex items-center justify-center mb-6 transition-transform hover:scale-110">
                      <span className="font-display text-2xl font-bold text-saline">{item.step}</span>
                    </div>
                    <h4 className="font-semibold text-xl text-ink mb-2">{item.title}</h4>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-400 tracking-widest uppercase mb-8">Built With Modern Technology</p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700"><Zap className="w-6 h-6" /> ESP32</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700"><Activity className="w-6 h-6 text-blue-500" /> React</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700"><Shield className="w-6 h-6 text-green-500" /> Supabase</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700"><Activity className="w-6 h-6 text-sky-500" /> ThingSpeak</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Droplet className="w-6 h-6 text-saline" />
              <span className="font-display font-bold text-xl">SamvedSync</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">
              Smart IV Monitoring. Safer Patient Care.<br />
              Empowering hospitals with real-time intelligence.
            </p>
          </div>
          <div>
            <h5 className="font-semibold mb-4 text-slate-100">Quick Links</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><button onClick={() => handleLoginClick('doctor')} className="hover:text-white transition-colors">Login</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-4 text-slate-100">Contact</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>support@samvedsync.com</li>
              <li>+91 (0) 000 000 0000</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} SamvedSync. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* IBM watsonx.ai Medical Assistant Chatbot */}
      <MedicalChatbot />
    </div>
  );
}
