// ─── AutoAP — Observability (AgentOps + Axiom) ────────────────────
// AgentOps: session-based event tracking for pipeline trace visualization
// Axiom: structured log ingestion (optional)

import { randomUUID } from 'crypto';

interface LogEvent {
    invoiceId: string;
    action: string;
    detail: string;
    level?: 'info' | 'warning' | 'error';
}

// ─── AgentOps Session Management ──────────────────────────────────

interface AgentOpsSession {
    jwt: string;
    sessionId: string;
    expiresAt: number;
}

let cachedSession: AgentOpsSession | null = null;

async function getAgentOpsSession(): Promise<AgentOpsSession | null> {
    const apiKey = process.env.AGENTOPS_API_KEY;
    if (!apiKey) return null;

    // Reuse session if still valid (refresh every 20 hours)
    if (cachedSession && Date.now() < cachedSession.expiresAt) {
        return cachedSession;
    }

    try {
        const sessionId = randomUUID();
        const res = await fetch('https://api.agentops.ai/v2/create_session', {
            method: 'POST',
            headers: {
                'X-Agentops-Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session: {
                    session_id: sessionId,
                    tags: ['autoap', 'invoice-pipeline'],
                    host_env: {
                        project: 'AutoAP',
                    },
                    init_timestamp: new Date().toISOString(),
                },
            }),
        });

        if (!res.ok) {
            console.error(`[AgentOps] Session creation failed: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();
        cachedSession = {
            jwt: data.jwt || data.token || '',
            sessionId,
            expiresAt: Date.now() + 20 * 60 * 60 * 1000, // 20 hours
        };

        console.log(`[AgentOps] ✓ Session created: ${sessionId.slice(0, 8)}...`);
        return cachedSession;
    } catch (error) {
        console.error('[AgentOps] Session creation error:', error);
        return null;
    }
}

export async function logToAgentOps(event: LogEvent): Promise<void> {
    const apiKey = process.env.AGENTOPS_API_KEY;
    if (!apiKey) {
        console.log(`[AgentOps] ${event.action}: ${event.detail}`);
        return;
    }

    const session = await getAgentOpsSession();
    if (!session) {
        // Fallback — log locally
        console.log(`[AgentOps:local] ${event.action}: ${event.detail}`);
        return;
    }

    try {
        await fetch('https://api.agentops.ai/v2/create_events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.jwt}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                events: [{
                    event_type: event.level === 'error' ? 'errors' : 'actions',
                    params: {
                        action_type: event.action,
                        logs: event.detail,
                        invoice_id: event.invoiceId,
                    },
                    init_timestamp: new Date().toISOString(),
                    end_timestamp: new Date().toISOString(),
                }],
            }),
        });
    } catch (error) {
        console.error('[AgentOps] Event log failed:', error);
    }
}

// ─── Axiom Structured Event Logging ───────────────────────────────
// Phase 2: All pipeline events use a consistent schema.
// Required events:
//   invoice.received, extraction.started, fireworks.completed,
//   portal.scraped, reconciliation.completed, qb.bill_created,
//   qb.payment_scheduled, exception.flagged, pipeline.completed

export interface AxiomEvent {
    event: string;
    invoiceId: string;
    timestamp: string;
    success: boolean;
    duration_ms?: number;
    vendor_id?: string;
    confidence_score?: number;
    recommendation?: string;
    flag_type?: string;
    severity?: string;
    qb_bill_id?: string;
    amount?: number;
    payment_date?: string;
    total_duration_ms?: number;
    error?: string;
    [key: string]: unknown;
}

export async function emitAxiomEvent(axiomEvent: AxiomEvent): Promise<void> {
    const token = process.env.AXIOM_API_TOKEN;
    const dataset = process.env.AXIOM_DATASET || 'autoap-prod';

    if (!token) {
        const icon = axiomEvent.success ? '✓' : '✗';
        console.log(`[Axiom] ${icon} ${axiomEvent.event} | invoice=${axiomEvent.invoiceId} ${axiomEvent.duration_ms ? `(${axiomEvent.duration_ms}ms)` : ''}`);
        return;
    }

    try {
        await fetch(`https://api.axiom.co/v1/datasets/${dataset}/ingest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
                _time: axiomEvent.timestamp,
                ...axiomEvent,
            }]),
        });
    } catch (error) {
        console.error(`[Axiom] Failed to emit ${axiomEvent.event}:`, error);
    }
}

// Legacy adapter — keep existing logToAxiom calls working
export async function logToAxiom(event: LogEvent): Promise<void> {
    await emitAxiomEvent({
        event: `pipeline.${event.action.toLowerCase()}`,
        invoiceId: event.invoiceId,
        timestamp: new Date().toISOString(),
        success: event.level !== 'error',
        error: event.level === 'error' ? event.detail : undefined,
    });
}

// ─── Convenience: log to all services at once ─────────────────────

export async function logObservability(event: LogEvent): Promise<void> {
    await Promise.all([
        logToAgentOps(event),
        logToAxiom(event),
    ]);
}

