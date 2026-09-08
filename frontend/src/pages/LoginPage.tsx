import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Warehouse, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Role } from '../types/index.js';
import { getErrorMessage } from '../api/client.js';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@ops.local');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRole = (role: Role, roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-ops-950 industrial-grid flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-bright mb-3">
            <Warehouse className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Wholesale Operations Console
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-1">
            Mini ERP + CRM Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-ops-900 border border-ops-800 rounded-lg p-6 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 rounded bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ops.local"
                  className="w-full bg-ops-950 border border-ops-700/80 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-bright focus:ring-1 focus:ring-amber-bright transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-ops-950 border border-ops-700/80 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-bright focus:ring-1 focus:ring-amber-bright transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-accent hover:bg-amber-bright text-ops-950 font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In To Workstation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Evaluator 1-Click Role Switcher */}
          <div className="mt-6 pt-5 border-t border-ops-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Demo / Evaluator Quick Fill:</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-bright" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('ADMIN', 'admin@ops.local')}
                className="text-left px-2.5 py-1.5 rounded border border-ops-700/60 bg-ops-950/60 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-xs"
              >
                <div className="font-semibold text-purple-300">Admin Role</div>
                <div className="text-[10px] text-slate-400 font-mono">admin@ops.local</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('SALES', 'sales@ops.local')}
                className="text-left px-2.5 py-1.5 rounded border border-ops-700/60 bg-ops-950/60 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-xs"
              >
                <div className="font-semibold text-blue-300">Sales Role</div>
                <div className="text-[10px] text-slate-400 font-mono">sales@ops.local</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('WAREHOUSE', 'warehouse@ops.local')}
                className="text-left px-2.5 py-1.5 rounded border border-ops-700/60 bg-ops-950/60 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-xs"
              >
                <div className="font-semibold text-amber-300">Warehouse Role</div>
                <div className="text-[10px] text-slate-400 font-mono">warehouse@ops.local</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('ACCOUNTS', 'accounts@ops.local')}
                className="text-left px-2.5 py-1.5 rounded border border-ops-700/60 bg-ops-950/60 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all text-xs"
              >
                <div className="font-semibold text-teal-300">Accounts Role</div>
                <div className="text-[10px] text-slate-400 font-mono">accounts@ops.local</div>
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-mono text-center mt-2.5">
              Default password for all accounts: <code className="text-amber-glow font-bold">Password123!</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
