// ─── AutoAP — AgentMail Webhook Validation ────────────────────────
import { createHmac } from 'crypto';

export function validateWebhookSignature(
    payload: string,
    signature: string,
    secret?: string
): boolean {
    const webhookSecret = secret || process.env.AGENTMAIL_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn('AGENTMAIL_WEBHOOK_SECRET not set — skipping validation');
        return true; // Allow in dev mode
    }

    const expectedSig = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

    return signature === expectedSig;
}

export interface AgentMailPayload {
    id: string;
    from: string;
    to: string;
    subject: string;
    body_text: string;
    body_html?: string;
    attachments: Array<{
        filename: string;
        content_type: string;
        url: string;
    }>;
    received_at: string;
}

export function parseAgentMailPayload(body: unknown): AgentMailPayload {
    const data = body as AgentMailPayload;
    if (!data.id || !data.from || !data.body_text) {
        throw new Error('Invalid AgentMail payload: missing required fields');
    }
    return data;
}
