import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Headphones,
  Globe,
  Sparkles,
  Shield,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Role } from '../types/index.js';
import { getErrorMessage } from '../api/client.js';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@ops.local');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
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
    <div className="min-h-screen w-screen flex bg-white text-zinc-900 font-sans antialiased overflow-hidden">
      {/* ── LEFT SIDE: CLEAN USER-FRIENDLY LOGIN FORM ── */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 z-10 bg-white overflow-y-auto">
        {/* Top Header / Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-1">
                <span>ops</span>
                <span className="text-orange-500">.</span>
                <span>flow</span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                Enterprise Mini ERP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-medium text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>v2.4 Live</span>
          </div>
        </div>

        {/* Main Form Center Box */}
        <div className="my-auto py-8 max-w-md w-full mx-auto">
          {/* Welcome Text */}
          <div className="mb-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-medium mb-3 border border-orange-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Operations & Inventory Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              The heart of your operations
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Sign in to manage inventory, sales challans, and customer relationships.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Authentication failed: </span>
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Email <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Password <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-400 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For demo access, all roles use password: Password123!');
                }}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-zinc-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Log in</span>
                  <ArrowRight className="w-4 h-4 text-orange-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluator Role Switcher */}
          <div className="mt-8 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
              <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                <span>Demo Quick Fill (1-Click Fill):</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-400">Password123!</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('ADMIN', 'admin@ops.local')}
                className="text-left px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:border-orange-500/50 hover:bg-orange-50/40 hover:shadow-sm transition-all group"
              >
                <div className="font-semibold text-xs text-zinc-900 group-hover:text-orange-600">
                  Admin Role
                </div>
                <div className="text-[11px] text-zinc-500 truncate font-mono">admin@ops.local</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('SALES', 'sales@ops.local')}
                className="text-left px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:border-orange-500/50 hover:bg-orange-50/40 hover:shadow-sm transition-all group"
              >
                <div className="font-semibold text-xs text-zinc-900 group-hover:text-orange-600">
                  Sales Role
                </div>
                <div className="text-[11px] text-zinc-500 truncate font-mono">sales@ops.local</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('WAREHOUSE', 'warehouse@ops.local')}
                className="text-left px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:border-orange-500/50 hover:bg-orange-50/40 hover:shadow-sm transition-all group"
              >
                <div className="font-semibold text-xs text-zinc-900 group-hover:text-orange-600">
                  Warehouse Role
                </div>
                <div className="text-[11px] text-zinc-500 truncate font-mono">
                  warehouse@ops.local
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('ACCOUNTS', 'accounts@ops.local')}
                className="text-left px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:border-orange-500/50 hover:bg-orange-50/40 hover:shadow-sm transition-all group"
              >
                <div className="font-semibold text-xs text-zinc-900 group-hover:text-orange-600">
                  Accounts Role
                </div>
                <div className="text-[11px] text-zinc-500 truncate font-mono">
                  accounts@ops.local
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-800">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>English (US)</span>
            </div>
            <a
              href="#support"
              onClick={(e) => {
                e.preventDefault();
                alert('Support: ops-support@enterprise.local | Internal extension #4102');
              }}
              className="flex items-center gap-1 hover:text-orange-600 transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-zinc-400" />
              <span>Get Support</span>
            </a>
          </div>

          <div className="text-[11px] text-zinc-400">
            Terms of Service & Privacy Policy applied
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: HERO BANNER WITH ORGANIC CURVE DIVIDER ── */}
      <div className="hidden lg:block lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-zinc-950">
        {/* The background photo */}
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop"
          alt="Modern Warehouse Operations"
          className="w-full h-full object-cover object-center transform scale-105"
        />

        {/* Dynamic Dark Gradient Overlay with subtle warm orange accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/40 to-zinc-950/80 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />

        {/* Organic Curved Wave Divider on the left (matches reference image aesthetic) */}
        <div className="absolute inset-y-0 left-0 w-24 xl:w-32 pointer-events-none">
          <svg
            className="h-full w-full fill-white"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C30,35 60,65 0,100 Z" />
          </svg>
        </div>

        {/* Content Floating on the Image */}
        <div className="absolute inset-0 p-12 xl:p-16 flex flex-col justify-between text-white z-10">
          {/* Top Tag */}
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Wholesale Depot Dispatch</span>
            </div>
          </div>

          {/* Bottom Showcase Card */}
          <div className="max-w-xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono text-xs font-semibold">
                OPERATIONAL EXCELLENCE
              </span>
              <span className="text-xs text-zinc-400">Hub: Depot B-04</span>
            </div>

            <h2 className="text-xl xl:text-2xl font-bold tracking-tight text-white mb-2">
              Next-generation inventory ledger & dispatch automation
            </h2>
            <p className="text-xs xl:text-sm text-zinc-300 leading-relaxed">
              Atomic transactional stock guarantees prevent overselling. Sequential challan
              generation, point-in-time pricing snapshots, and multi-role access controls.
            </p>

            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white tabular-nums font-mono">100%</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Atomic Safety</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-400 tabular-nums font-mono">&lt; 150ms</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Response Time</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums font-mono">4 Roles</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">RBAC Security</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
