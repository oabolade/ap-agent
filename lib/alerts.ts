// ─── AutoAP — Exception Alerts (Slack + Email) ────────────────────

import { sendSlackExceptionAlert as composioSlackAlert, ExceptionAlertParams as ComposioAlertParams } from './composio';

interface ExceptionAlertParams {
    invoiceId: string;
    vendor?: string;
    invoiceAmount?: number;
    poAmount?: number;
    delta?: number;
    error?: string;
}

export async function sendExceptionAlert(params: ExceptionAlertParams): Promise<void> {
    await Promise.all([
        sendSlackAlert(params),
        sendEmailAlert(params),
    ]);
}

async function sendSlackAlert(params: ExceptionAlertParams): Promise<void> {
    // Map the old alert params to the new Composio alert format
    const composioParams: ComposioAlertParams = {
        invoiceId: params.invoiceId,
        vendor: params.vendor,
        invoiceAmount: params.invoiceAmount,
        error: params.error,
        discrepancyType: params.delta ? `Amount difference: $${params.delta.toFixed(2)}` : undefined,
    };
    
    await composioSlackAlert(composioParams);
}

async function sendEmailAlert(params: ExceptionAlertParams): Promise<void> {
    const alertEmail = process.env.ALERT_EMAIL;
    if (!alertEmail) {
        return; // Email alerts not configured
    }

    // Placeholder: In production, use a transactional email service (Resend, SendGrid, etc.)
    console.log(`[Email Alert] Would send to ${alertEmail}:`, params);
}
