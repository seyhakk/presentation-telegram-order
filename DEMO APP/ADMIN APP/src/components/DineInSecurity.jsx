import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import { Shield, Copy, Check, RotateCcw, Save, Send } from 'lucide-react';

const BOT_TOKEN = '8707616318:AAHZydCWkN1L5KLf3SbBBHgH8nSf5L8JpSw';
const GROUP_ID = '-5102051806';

function generateRandomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function DineInSecurity() {
  const [code, setCode] = useState('');
  const [savedCode, setSavedCode] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTodayCode();
  }, []);

  async function fetchTodayCode() {
    const { data, error } = await supabase.rpc('get_today_access_code');
    if (error) {
      console.error('Failed to fetch today code:', error);
      return;
    }
    if (data && data.length > 0) {
      const row = data[0];
      setCode(row.display_hint || '');
      setSavedCode(row.display_hint || '');
      setUpdatedAt(row.updated_at);
      setUpdatedBy(row.updated_by || '');
    }
  }

  async function handleSave() {
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter a code' });
      return;
    }
    if (code.trim().length < 4 || code.trim().length > 6) {
      setMessage({ type: 'error', text: 'Code must be 4-6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const user = getCurrentUser();
    const adminName = user?.full_name || user?.username || '';

    const { error } = await supabase.rpc('save_daily_access_code', {
      input_code: code.trim(),
      admin_name: adminName,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save: ' + error.message });
      setSaving(false);
      return;
    }

    setSavedCode(code.trim());
    setMessage({ type: 'success', text: 'Today\'s table code saved successfully' });
    await fetchTodayCode();
    await sendCodeToGroup(code.trim(), adminName);

    setSaving(false);
  }

  async function sendCodeToGroup(codeToSend, adminName) {
    setSending(true);
    try {
      const text = `<b>🔐 Today's Dine-In Table Code Updated</b>\n\nCode: <code>${codeToSend}</code>\nSet by: ${adminName}\nDate: ${new Date().toLocaleDateString()}\n\nShare this code with dine-in customers when they order.`;
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: GROUP_ID, text, parse_mode: 'HTML' }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: 'success', text: 'Code sent to Telegram group' });
      }
    } catch (err) {
      console.warn('Failed to send code to group:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleSendToGroup() {
    if (!savedCode) {
      setMessage({ type: 'error', text: 'No code saved yet. Save a code first.' });
      return;
    }
    const user = getCurrentUser();
    const adminName = user?.full_name || user?.username || '';
    await sendCodeToGroup(savedCode, adminName);
  }

  function handleGenerate() {
    setCode(generateRandomCode());
    setMessage(null);
  }

  function handleRegenerate() {
    handleGenerate();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to copy' });
    }
  }

  const hasUnsaved = code !== savedCode;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dine-In Security</h2>
          <p className="text-sm text-slate-500 mt-1">Manage Today's Table Code for dine-in QR ordering</p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Today's Table Code
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Customers must enter this code before placing their first dine-in order.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 4-6 digit code"
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg font-mono font-bold text-slate-800 tracking-[0.25em] outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-all"
          >
            <Shield className="h-4 w-4" />
            Generate Random Code
          </button>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsaved}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              saving || !hasUnsaved
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/30'
            }`}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleSendToGroup}
            disabled={sending || !savedCode}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              sending || !savedCode
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-sky-500 text-white hover:bg-sky-600 shadow-md shadow-sky-500/30'
            }`}
          >
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : 'Send to Group'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Current Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Today's Saved Code</p>
            <p className="text-lg font-mono font-bold text-slate-800 tracking-wider">
              {savedCode || 'Not set'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Status</p>
            <p className={`text-sm font-semibold ${savedCode ? 'text-emerald-600' : 'text-amber-600'}`}>
              {savedCode ? 'Active' : 'No code set for today'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Last Updated</p>
            <p className="text-sm font-semibold text-slate-700">
              {updatedAt ? new Date(updatedAt).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Updated By</p>
            <p className="text-sm font-semibold text-slate-700">
              {updatedBy || '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-amber-800 mb-2">How it works</h4>
        <ul className="text-xs text-amber-700 space-y-1.5">
          <li>• Set a daily code for dine-in customers to access table ordering</li>
          <li>• Default generated codes are 4-digit numeric for easy staff communication</li>
          <li>• You can manually edit the code before saving (e.g. 2580, 1234)</li>
          <li>• The code is stored hashed and verified server-side for security</li>
          <li>• If no code is set by 1pm, a random one auto-generates and is sent to the Telegram group</li>
          <li>• A new code should be set each day for security</li>
        </ul>
      </div>
    </div>
  );
}
