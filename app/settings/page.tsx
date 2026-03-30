'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, AlertCircle } from 'lucide-react';
import { Settings as SettingsType } from '@/lib/types';

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editValues, setEditValues] = useState<Partial<SettingsType>>({});

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setSettings(data.data);
                    setEditValues(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editValues),
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.data);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ height: '300px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', opacity: 0.3, animation: 'pulse-cyan 1.5s ease-in-out infinite' }} />
            </div>
        );
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontFamily: 'var(--font-mono)',
        outline: 'none',
        transition: 'border-color 0.15s ease',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={20} /> Agent Configuration
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Configure AutoAP integrations, matching rules, and notifications.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px',
                        background: saved ? 'var(--accent-success)' : 'var(--accent-cyan)',
                        color: 'var(--bg-base)',
                        border: 'none', borderRadius: 'var(--radius-sm)',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Inbox Connection */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>AP Inbox (AgentMail)</h3>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Inbox Address</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="text"
                                value={editValues.agentmail_inbox || ''}
                                onChange={e => setEditValues({ ...editValues, agentmail_inbox: e.target.value })}
                                style={inputStyle}
                            />
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                background: 'var(--accent-success-dim)',
                                border: '1px solid color-mix(in srgb, var(--accent-success) 30%, transparent)',
                                whiteSpace: 'nowrap', fontSize: '11px', fontFamily: 'var(--font-mono)',
                                color: 'var(--accent-success)',
                            }}>
                                <Check size={12} /> Connected
                            </div>
                        </div>
                    </div>
                </div>

                {/* QuickBooks */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>QuickBooks Online</h3>

                    {/* Success/Error banners from OAuth callback */}
                    {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('qb_connected') === 'true' && (
                        <div style={{
                            padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent-success-dim)',
                            border: '1px solid color-mix(in srgb, var(--accent-success) 30%, transparent)',
                            color: 'var(--accent-success)', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            <Check size={14} /> QuickBooks connected successfully!
                        </div>
                    )}
                    {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('qb_error') && (
                        <div style={{
                            padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-sm)',
                            background: 'color-mix(in srgb, var(--accent-error) 10%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--accent-error) 30%, transparent)',
                            color: 'var(--accent-error)', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            <AlertCircle size={14} /> QuickBooks connection failed. Please try again.
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Company ID</label>
                            <input
                                type="text"
                                value={editValues.qb_company_id || ''}
                                readOnly
                                placeholder="Connected via OAuth"
                                style={{ ...inputStyle, opacity: 0.7 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>OAuth Status</label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 12px', background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                                fontSize: '13px', fontFamily: 'var(--font-mono)',
                            }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: settings?.qb_access_token ? 'var(--accent-success)' : 'var(--accent-error)' }} />
                                <span style={{ color: settings?.qb_access_token ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                                    {settings?.qb_access_token ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {settings?.qb_token_expires_at && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                            Token expires: {new Date(settings.qb_token_expires_at).toLocaleString()}
                        </div>
                    )}

                    <div style={{ marginTop: '14px' }}>
                        {settings?.qb_access_token ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.location.href = '/api/auth/quickbooks'}
                                style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                Reconnect QuickBooks
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.location.href = '/api/auth/quickbooks'}
                                style={{
                                    padding: '10px 20px',
                                    background: '#2CA01C',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#fff',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                Connect QuickBooks
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Matching Rules */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Matching Rules</h3>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Match Tolerance (%)</label>
                            <input
                                type="number"
                                value={editValues.match_tolerance_percent ?? 2}
                                onChange={e => setEditValues({ ...editValues, match_tolerance_percent: Number(e.target.value) })}
                                min={0}
                                max={100}
                                step={0.5}
                                style={inputStyle}
                            />
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Invoice amounts within this % of PO are auto-matched.
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Auto-Approve Max ($)</label>
                            <input
                                type="number"
                                value={editValues.auto_approve_max ?? 10000}
                                onChange={e => setEditValues({ ...editValues, auto_approve_max: Number(e.target.value) })}
                                min={0}
                                step={100}
                                style={inputStyle}
                            />
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Invoices above this amount require manual approval.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Notifications</h3>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Slack Webhook URL</label>
                        <input
                            type="text"
                            value={editValues.slack_webhook_url || ''}
                            onChange={e => setEditValues({ ...editValues, slack_webhook_url: e.target.value })}
                            placeholder="https://hooks.slack.com/services/..."
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Alert Email</label>
                        <input
                            type="email"
                            value={editValues.alert_email || ''}
                            onChange={e => setEditValues({ ...editValues, alert_email: e.target.value })}
                            placeholder="founder@company.com"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Danger Zone */}
                <div style={{
                    background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '24px',
                    border: '1px solid color-mix(in srgb, var(--accent-error) 30%, transparent)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <AlertCircle size={16} color="var(--accent-error)" />
                        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--accent-error)' }}>Demo Data</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                        Clean up stale test invoices (empty vendors, DB tests, $0 amounts).
                    </p>
                    <button
                        onClick={async () => {
                            if (!confirm('Remove stale test invoices from the database?')) return;
                            try {
                                const res = await fetch('/api/demo/reset', { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                    alert(`✓ ${data.data.message}`);
                                } else {
                                    alert(`Error: ${data.error}`);
                                }
                            } catch (err) {
                                alert(`Failed: ${err}`);
                            }
                        }}
                        style={{
                            padding: '8px 16px', background: 'transparent',
                            border: '1px solid var(--accent-error)', borderRadius: 'var(--radius-sm)',
                            color: 'var(--accent-error)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Clean Test Data
                    </button>
                </div>
            </div>
        </div>
    );
}
