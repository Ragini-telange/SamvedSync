import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock, LogOut, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ allowedRole, children }) {
  const { session, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-saline border-t-transparent rounded-full animate-spin" />
          Verifying security credentials...
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== allowedRole) {
    // Logged in, but wrong role for this route — bounce to their real dashboard
    return <Navigate to={`/${profile.role}`} replace />;
  }

  // Check Nurse Verification Status
  if (profile.role === 'nurse' && profile.nurseStatus === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-body">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white mb-3 font-display">Registration Pending</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            "Your registration request has been submitted. Your account will become active after verification by the hospital administrator."
          </p>
          <div className="text-xs text-slate-400 mb-6">
            Please contact your hospital admin if you need urgent activation.
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (profile.role === 'nurse' && profile.nurseStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-body">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white mb-3 font-display">Access Rejected</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 bg-rose-500/5 text-rose-700 dark:text-rose-400 p-4 rounded-2xl border border-rose-500/20">
            Your nurse registration request was reviewed and could not be verified by the hospital administrator.
          </p>
          <button
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return children;
}
