// ─── AutoAP — Composio Integration (Slack + Notion) ──────────────
// Uses Composio SDK for Slack alerts and Notion approval logging.
// Replaces direct Slack webhook calls with Composio actions.
//
// Required env vars:
//   COMPOSIO_API_KEY
//   SLACK_CHANNEL_ID (optional — falls back to console log)
//   NOTION_DB_ID (optional — falls back to console log)

import { Composio } from 'composio-core';

// ─── Client Singleton ─────────────────────────────────────────────

let _client: Composio | null = null;

function getClient(): Composio | null {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) return null;
    if (!_client) {
        _client = new Composio({ apiKey });
    }
    return _client;
}

// ─── Slack Exception Alert ────────────────────────────────────────

export interface ExceptionAlertParams {
    invoiceId: string;
    vendor?: string;
    invoiceAmount?: number;
    confidenceScore?: number;
    discrepancyType?: string;
    error?: string;
}

export async function sendSlackExceptionAlert(params: ExceptionAlertParams): Promise<void> {
    const client = getClient();
    const channelId = process.env.SLACK_CHANNEL_ID;

    const message = params.error
        ? `🚨 *AutoAP Pipeline Error*\nInvoice: \`${params.invoiceId}\`\nError: ${params.error}`
        : [
            `⚠️ *AutoAP — Invoice Exception*`,
            `• Vendor: *${params.vendor || 'Unknown'}*`,
            `• Amount: $${params.invoiceAmount?.toFixed(2) || 'N/A'}`,
            params.confidenceScore != null ? `• Confidence: ${params.confidenceScore}%` : null,
            params.discrepancyType ? `• Flag: \`${params.discrepancyType}\`` : null,
            `• <${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/exceptions?id=${params.invoiceId}|View in Dashboard>`,
        ].filter(Boolean).join('\n');

    if (!client || !channelId) {
        console.log(`[Composio/Slack] Alert (no client/channel):`, message);
        return;
    }

    try {
        await client.connectedAccounts.list({});
        // Execute Slack send_message action
        const toolset = await client.getEntity('default');
        await toolset.execute({
            actionName: 'SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL',
            params: {
                channel: channelId,
                text: message,
            }
        });
        console.log(`[Composio/Slack] Alert sent for invoice ${params.invoiceId}`);
    } catch (error) {
        console.error('[Composio/Slack] Failed to send alert:', error);
        // Fallback: log to console so pipeline doesn't break
    }
}

// ─── Notion Approval Log ──────────────────────────────────────────

export interface ApprovalLogParams {
    invoiceId: string;
    invoiceNumber: string;
    vendor: string;
    amount: number;
    status: 'Approved' | 'Exception' | 'Pending Review';
    confidenceScore?: number;
    processedAt: string;
}

export async function logApprovalToNotion(params: ApprovalLogParams): Promise<void> {
    const client = getClient();
    const databaseId = process.env.NOTION_DB_ID;

    if (!client || !databaseId) {
        console.log(`[Composio/Notion] Would log:`, params);
        return;
    }

    try {
        // Bypassing Composio for Notion due to upstream Action string regressions and 
        // 401 invalid token issues inside v0.5.39. We use the standard Notion Integration!
        let notionToken = process.env.NOTION_API_KEY;
        
        // Gracefully read from .env directly if Next.js hasn't hot-reloaded the env vars
        if (!notionToken) {
            try {
                const fs = require('fs');
                const envFile = fs.readFileSync('.env', 'utf8');
                const match = envFile.match(/^NOTION_API_KEY=(.+)$/m);
                if (match) notionToken = match[1].trim();
            } catch(e) {}
        }
        
        if (!notionToken) {
            throw new Error("Missing NOTION_API_KEY in .env! Please create a Notion Internal Integration and add the API Key.");
        }

        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { database_id: databaseId },
                properties: {
                    'Invoice #': { title: [{ text: { content: params.invoiceNumber } }] },
                    'Vendor': { rich_text: [{ text: { content: params.vendor } }] },
                    'Amount': { number: params.amount },
                    'Status': { select: { name: params.status } },
                    'Confidence': { number: params.confidenceScore || 0 },
                    'Processed at': { date: { start: params.processedAt } },
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Notion API Error: ${response.status} - ${errorText}`);
        }
        
        console.log(`[Composio/Notion] Logged approval for ${params.invoiceNumber}`);
    } catch (error) {
        console.error('[Composio/Notion] Failed to log:', error);
    }
}
