import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerNurseAccount } from '../lib/dashboardData';
import { Droplet, Activity, ArrowLeft, Shield, UserPlus, LogIn, CheckCircle2, Clock, Key, Stethoscope, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = location.state?.role || null;

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Nurse Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWard, setRegWard] = useState('ICU Ward 1A');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState(null);

  const demoAccounts = [
    { role: 'Doctor', email: 'doctor@samvedsync.com', pass: 'doctor123', icon: Stethoscope, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { role: 'Admin', email: 'admin@samvedsync.com', pass: 'admin123', icon: Shield, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { role: 'Nurse', email: 'nurse1@samvedsync.com', pass: 'nurse123', icon: HeartPulse, color: 'text-saline bg-saline/10 border-saline/20' }
  ];

  function fillDemo(acc) {
    setMode('login');
    setEmail(acc.email);
    setPassword(acc.pass);
    setError('');
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const profile = await signIn(cleanEmail, password);
      
      if (defaultRole && profile.role.toLowerCase() !== defaultRole.toLowerCase()) {
        await signOut();
        setError(`Access denied. You are attempting to log in via the ${defaultRole.toUpperCase()} portal, but your account is registered as a ${profile.role.toUpperCase()}.`);
        setBusy(false);
        return;
      }
      
      if (profile.role === 'nurse' && profile.nurseStatus === 'pending') {
        await signOut();
        setError('Your registration request has been submitted. Your account will become active after verification by the hospital administrator.');
        setBusy(false);
        return;
      }

      if (profile.role === 'nurse' && profile.nurseStatus === 'rejected') {
        await signOut();
        setError('Your nurse registration request was rejected by the hospital administrator.');
        setBusy(false);
        return;
      }

      navigate(`/${profile.role}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your details and try again.');
    } fontally: {
      setBusy(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError('');
    setRegSuccessMsg(null);
    const cleanEmail = regEmail.trim();
    const cleanName = regName.trim();
    
    if (!cleanName || !cleanEmail || !regPassword) {
      setError('Name, valid email, and password are required.');
      return;
    }
    
    // Basic email pattern check
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid complete email address (e.g. nurse2@gmail.com or nurse2@samvedsync.com).');
      return;
    }

    setBusy(true);
    try {
      await registerNurseAccount({
        name: cleanName,
        email: cleanEmail,
        password: regPassword,
        phone: regPhone.trim(),
        ward: regWard.trim(),
        employeeId: regEmployeeId.trim()
      });

      setRegSuccessMsg("Your registration request has been submitted. Your account will become active after verification by the hospital administrator or attending doctor.");
      setRegName(''); setRegEmail(''); setRegPassword(''); setRegPhone(''); setRegEmployeeId('');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-body selection:bg-saline selection:text-white">
      {/* Brand panel - Left Side */}
      <div className="flex-1 md:basis-1/2 bg-ink text-white flex flex-col justify-between p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-saline/10 via-ink to-ink pointer-events-none -z-10" />
        
        <div className="z-10 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-saline p-2 rounded-lg">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">SamvedSync</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-white/60 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>

        <div className="max-w-xl z-10 my-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
              Smart IV Monitoring.<br />
              <span className="text-saline">Safer Patient Care.</span>
            </h1>
            <p className="text-sm md:text-base text-white/70 leading-relaxed mb-8">
              Technology that cares. Monitoring that saves. SamvedSync empowers hospital staff with real-time IV insights to respond faster.
            </p>
          </motion.div>

          {/* Quick Demo Credentials Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 sm:p-6 rounded-2xl space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-400">
              <Key className="w-4 h-4 shrink-0" /> Hackathon Quick Access Credentials
            </div>
            <p className="text-xs text-white/80">Click any role card below to auto-fill login details:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {demoAccounts.map((acc, i) => {
                const IconComp = acc.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="p-3.5 rounded-xl border border-white/15 hover:border-saline/70 bg-white/10 hover:bg-white/20 transition-all text-left group flex flex-col justify-between shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white group-hover:text-saline-bright">
                        <IconComp className="w-4 h-4 text-saline shrink-0" /> {acc.role}
                      </div>
                      <div className="text-xs text-slate-200 font-mono mt-2 break-all font-medium leading-tight">{acc.email}</div>
                    </div>
                    <div className="text-xs text-saline-bright font-mono font-bold mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase font-sans font-normal">Pass:</span> {acc.pass}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="z-10 font-mono text-xs text-white/50">
          © {new Date().getFullYear()} SamvedSync. Secure Healthcare.
        </div>
      </div>

      {/* Form panel - Right Side */}
      <div className="flex-1 md:basis-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200/60">
            <button
              onClick={() => { setMode('login'); setError(''); setRegSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'login' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setRegSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'register' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4 text-saline" /> Nurse Join / Register
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-ink mb-1">Welcome Back</h2>
                <p className="text-slate-500 text-sm">Sign in to your hospital portal</p>
              </div>

              {defaultRole && (
                <div className="mb-6 flex justify-center">
                  <div className="bg-saline/10 text-saline text-sm font-medium px-4 py-1.5 rounded-full capitalize flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-saline inline-block" />
                    Logging in as {defaultRole}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-pulse/10 text-pulse border border-pulse/20 rounded-2xl px-4 py-3.5 text-xs sm:text-sm mb-6 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-pulse shrink-0 mt-1.5" />
                  <div className="flex-1 leading-relaxed">{error}</div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@samvedsync.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline transition-all placeholder:text-slate-400 text-ink text-sm font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline transition-all placeholder:text-slate-400 text-ink text-sm font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-ink text-white font-semibold py-3.5 rounded-xl hover:bg-ink-surface focus:outline-none focus:ring-4 focus:ring-ink/10 disabled:opacity-70 transition-all shadow-lg shadow-ink/20 mt-4 text-sm"
                >
                  {busy ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-ink mb-1">Nurse Registration</h2>
                <p className="text-slate-500 text-sm">Submit your account request for Doctor or Admin verification</p>
              </div>

              {regSuccessMsg ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl text-center space-y-3 mb-6">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                  <p className="text-sm font-semibold text-emerald-800 leading-relaxed">
                    {regSuccessMsg}
                  </p>
                  <button
                    onClick={() => { setMode('login'); setRegSuccessMsg(null); }}
                    className="text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Go to Sign In
                  </button>
                </motion.div>
              ) : (
                <>
                  {error && (
                    <div className="bg-pulse/10 text-pulse border border-pulse/20 rounded-2xl px-4 py-3 text-xs mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pulse shrink-0" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        placeholder="Nurse Full Name"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Email</label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          placeholder="nurse2@gmail.com"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone</label>
                        <input
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 98765..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Ward / Unit</label>
                        <input
                          type="text"
                          value={regWard}
                          onChange={(e) => setRegWard(e.target.value)}
                          placeholder="ICU Ward 1A"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Employee ID</label>
                        <input
                          type="text"
                          value={regEmployeeId}
                          onChange={(e) => setRegEmployeeId(e.target.value)}
                          placeholder="N003"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        placeholder="Set a password"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saline/20 focus:border-saline text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-saline hover:bg-saline-dim text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-saline/20 mt-3 text-sm flex items-center justify-center gap-2"
                    >
                      {busy ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Submit Registration Request
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4" /> Role-based authorization & verified encryption.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
