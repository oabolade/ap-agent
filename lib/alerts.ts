// ─── AutoAP — Exception Alerts (Slack + Email) ────────────────────

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
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log(`[Slack Alert] Exception for invoice ${params.invoiceId}:`, params);
        return;
    }

    const message = params.error
        ? `🚨 *AutoAP Pipeline Error*\nInvoice: \`${params.invoiceId}\`\nError: ${params.error}`
        : `⚠️ *AutoAP — Invoice Exception*\nVendor: ${params.vendor}\nInvoice: $${params.invoiceAmount?.toFixed(2)}\nPO: $${params.poAmount?.toFixed(2)}\nDelta: $${params.delta?.toFixed(2)}`;

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
        });
    } catch (error) {
        console.error('[Slack] Failed to send alert:', error);
    }
}

async function sendEmailAlert(params: ExceptionAlertParams): Promise<void> {
    const alertEmail = process.env.ALERT_EMAIL;
    if (!alertEmail) {
        return; // Email alerts not configured
    }

    // Placeholder: In production, use a transactional email service (Resend, SendGrid, etc.)
    console.log(`[Email Alert] Would send to ${alertEmail}:`, params);
}
