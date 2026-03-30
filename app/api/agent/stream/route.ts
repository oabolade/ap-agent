// ─── AutoAP — Agent Activity SSE Stream (Live) ───────────────────
// Streams real agent_log entries from MongoDB invoices via SSE.
// Polls every 2s for new log entries from recently active invoices.

import { NextRequest } from 'next/server';
import { getInvoices } from '@/lib/mongodb';
import { AgentLogEntry } from '@/lib/types';

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let lastSentCount = 0;
            let lastSentTimestamp = '';

            // Send initial batch of recent logs
            try {
                const logs = await getRecentLogs();
                for (const entry of logs) {
                    const data = `data: ${JSON.stringify(entry)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                }
                lastSentCount = logs.length;
                lastSentTimestamp = logs.length > 0
                    ? String(logs[logs.length - 1].timestamp)
                    : '';
            } catch (err) {
                console.error('[SSE] Initial log fetch failed:', err);
            }

            // Poll for new entries every 2s
            const pollInterval = setInterval(async () => {
                try {
                    const logs = await getRecentLogs();

                    // Find entries newer than what we already sent
                    const newEntries = lastSentTimestamp
                        ? logs.filter(e => String(e.timestamp) > lastSentTimestamp)
                        : logs.slice(lastSentCount);

                    for (const entry of newEntries) {
                        const data = `data: ${JSON.stringify(entry)}\n\n`;
                        try {
                            controller.enqueue(encoder.encode(data));
                        } catch {
                            clearInterval(pollInterval);
                            return;
                        }
                    }

                    if (newEntries.length > 0) {
                        lastSentTimestamp = String(newEntries[newEntries.length - 1].timestamp);
                        lastSentCount += newEntries.length;
                    }
                } catch (err) {
                    console.error('[SSE] Poll error:', err);
                }
            }, 2000);

            // Heartbeat every 15s
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': ping\n\n'));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 15000);

            req.signal.addEventListener('abort', () => {
                clearInterval(pollInterval);
                clearInterval(heartbeat);
                try { controller.close(); } catch { /* already closed */ }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

/**
 * Get the most recent agent_log entries across all recent invoices.
 * Returns a flat, sorted array of entries with invoice context added.
 */
async function getRecentLogs(): Promise<AgentLogEntry[]> {
    const invoices = await getInvoices({ limit: 10 });

    const allEntries: AgentLogEntry[] = [];
    for (const inv of invoices) {
        if (!inv.agent_log || inv.agent_log.length === 0) continue;
        for (const entry of inv.agent_log) {
            allEntries.push({
                ...entry,
                // Add invoice context to the detail if not already present
                detail: entry.detail.includes(inv.vendor_name || '')
                    ? entry.detail
                    : `[${inv.vendor_name || inv.invoice_number || 'Unknown'}] ${entry.detail}`,
            });
        }
    }

    // Sort by timestamp ascending
    allEntries.sort((a, b) =>
        new Date(String(a.timestamp)).getTime() - new Date(String(b.timestamp)).getTime()
    );

    // Return last 50 entries
    return allEntries.slice(-50);
}
