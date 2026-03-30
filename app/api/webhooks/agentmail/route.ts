// ─── AutoAP — AgentMail Webhook Receiver ──────────────────────────
// Pipeline entry point: receives invoice emails from AgentMail.

import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/agentmail';
import { createInvoice } from '@/lib/mongodb';
import { logToAxiom } from '@/lib/observability';
import { runInvoicePipeline } from '@/pipeline/invoice.pipeline';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-agentmail-signature') || '';

        console.log('[AgentMail Webhook] Received POST');
        console.log('[AgentMail Webhook] Signature header:', signature ? 'present' : 'missing');

        // Validate webhook signature (warn-only for debugging)
        const sigValid = validateWebhookSignature(body, signature);
        if (!sigValid) {
            console.warn('[AgentMail Webhook] ⚠️ Signature mismatch — allowing for debug');
        }

        const rawPayload = JSON.parse(body);
        console.log('[AgentMail Webhook] Payload keys:', Object.keys(rawPayload));

        // AgentMail wraps the message inside a data/event structure
        // Try multiple possible payload shapes
        const message = rawPayload.data?.message
            || rawPayload.data
            || rawPayload.message
            || rawPayload;

        const from = message.from || message.sender || '';
        const subject = message.subject || '';
        const bodyText = message.body_text
            || message.text
            || message.preview
            || message.body
            || subject
            || '';

        console.log('[AgentMail Webhook] Parsed — from:', from, 'subject:', subject);

        // Create invoice in RECEIVED state
        const invoice = await createInvoice({
            status: 'RECEIVED',
            vendor_email: from,
            raw_email: bodyText,
            raw_pdf_url: null,
            agent_log: [
                {
                    timestamp: new Date().toISOString(),
                    action: 'EMAIL_DETECTED',
                    detail: `Invoice received from ${from} — ${subject}`,
                    level: 'info',
                },
            ],
        });

        console.log('[AgentMail Webhook] ✅ Invoice created:', invoice._id);

        await logToAxiom({
            invoiceId: invoice._id,
            action: 'WEBHOOK_RECEIVED',
            detail: `New invoice from ${from}`,
            level: 'info',
        });

        // 🚀 Trigger the pipeline asynchronously (don't block the webhook response)
        runInvoicePipeline(invoice._id).catch(err => {
            console.error(`[Pipeline] Error for ${invoice._id}:`, err);
        });

        return NextResponse.json({
            success: true,
            data: { invoice_id: invoice._id },
        });

    } catch (error) {
        console.error('[AgentMail Webhook Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
