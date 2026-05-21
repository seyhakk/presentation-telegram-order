import { useState } from 'react';
import { login } from '../lib/auth';
import { Store, ArrowRight, Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(username.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        onLogin(result.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30 mb-4">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage your restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="username">Username</label>
            <input
              id="username" type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter username" required autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-[background-color,transform,box-shadow,opacity]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password" required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-[background-color,transform,box-shadow,opacity]"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary-500 text-white py-2.5 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-[background-color,transform,box-shadow,opacity] flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}