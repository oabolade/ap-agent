#!/usr/bin/env npx tsx
// ─── AutoAP — AgentMail Webhook Setup ─────────────────────────────
// Creates or updates a webhook in AgentMail pointing to your ngrok URL.
// Usage: npx tsx scripts/setup-webhook.ts <ngrok-url>
//
// Prerequisites:
//   1. AGENTMAIL_API_KEY set in .env
//   2. ngrok running: ~/bin/ngrok http 3000
//   3. Copy the https://xxx.ngrok-free.app URL

import { config } from 'dotenv';
config();

const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;
const INBOX_ADDRESS = process.env.AGENTMAIL_INBOX_ADDRESS || 'autoap@agentmail.to';
const API_BASE = 'https://api.agentmail.to/v0';

if (!AGENTMAIL_API_KEY) {
    console.error('❌ AGENTMAIL_API_KEY is not set in .env');
    process.exit(1);
}

const ngrokUrl = process.argv[2];
if (!ngrokUrl) {
    console.error('❌ Usage: npx tsx scripts/setup-webhook.ts <ngrok-url>');
    console.error('   Example: npx tsx scripts/setup-webhook.ts https://abc123.ngrok-free.app');
    process.exit(1);
}

const webhookUrl = `${ngrokUrl.replace(/\/$/, '')}/api/webhooks/agentmail`;

const headers = {
    'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
    'Content-Type': 'application/json',
};

async function listInboxes() {
    const res = await fetch(`${API_BASE}/inboxes`, { headers });
    if (!res.ok) throw new Error(`Failed to list inboxes: ${res.status} ${await res.text()}`);
    return res.json();
}

async function listWebhooks() {
    const res = await fetch(`${API_BASE}/webhooks`, { headers });
    if (!res.ok) throw new Error(`Failed to list webhooks: ${res.status} ${await res.text()}`);
    return res.json();
}

async function deleteWebhook(webhookId: string) {
    const res = await fetch(`${API_BASE}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error(`Failed to delete webhook: ${res.status} ${await res.text()}`);
}

async function createWebhook(url: string, inboxId?: string) {
    const body: Record<string, unknown> = {
        url,
        event_types: ['message.received'],
    };
    if (inboxId) {
        body.inbox_ids = [inboxId];
    }

    const res = await fetch(`${API_BASE}/webhooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to create webhook: ${res.status} ${await res.text()}`);
    return res.json();
}

async function main() {
    console.log('\n🔧 AutoAP — AgentMail Webhook Setup\n');
    console.log(`   Inbox:   ${INBOX_ADDRESS}`);
    console.log(`   Webhook: ${webhookUrl}\n`);

    // Step 1: Find the inbox
    console.log('📬 Looking up inbox...');
    const inboxes = await listInboxes();
    const inbox = inboxes.inboxes?.find(
        (ib: { inbox_id: string; display_name?: string }) =>
            ib.inbox_id === INBOX_ADDRESS ||
            ib.display_name?.includes('autoap') ||
            ib.inbox_id?.includes('autoap')
    );

    if (inbox) {
        console.log(`   ✓ Found inbox: ${inbox.inbox_id}`);
    } else {
        console.log(`   ⚠ Inbox "${INBOX_ADDRESS}" not found in API response.`);
        console.log(`   Available inboxes:`);
        inboxes.inboxes?.forEach((ib: { inbox_id: string }) => {
            console.log(`     - ${ib.inbox_id}`);
        });
        console.log(`\n   Proceeding without inbox filter (webhook will receive all events).\n`);
    }

    // Step 2: Clean up existing AutoAP webhooks
    console.log('🧹 Checking existing webhooks...');
    const existing = await listWebhooks();
    const autoApWebhooks = existing.webhooks?.filter(
        (wh: { url: string }) => wh.url.includes('/api/webhooks/agentmail')
    ) || [];

    if (autoApWebhooks.length > 0) {
        console.log(`   Found ${autoApWebhooks.length} existing AutoAP webhook(s). Removing...`);
        for (const wh of autoApWebhooks) {
            await deleteWebhook(wh.webhook_id);
            console.log(`   ✓ Removed: ${wh.url}`);
        }
    } else {
        console.log('   No existing AutoAP webhooks found.');
    }

    // Step 3: Create new webhook
    console.log('\n🔗 Creating webhook...');
    const webhook = await createWebhook(webhookUrl, inbox?.inbox_id);

    console.log(`   ✓ Webhook created!`);
    console.log(`   ID:     ${webhook.webhook_id}`);
    console.log(`   URL:    ${webhook.url}`);
    console.log(`   Secret: ${webhook.secret}`);
    console.log(`   Events: ${webhook.event_types?.join(', ')}`);

    // Step 4: Remind to update .env
    if (webhook.secret) {
        console.log(`\n📝 ACTION REQUIRED: Add the webhook secret to your .env file:`);
        console.log(`   AGENTMAIL_WEBHOOK_SECRET=${webhook.secret}\n`);
    }

    console.log('✅ Done! Your webhook is now active.\n');
    console.log('   To test, send an email to: autoap@agentmail.to');
    console.log('   The webhook will POST to: ' + webhookUrl);
    console.log('   Make sure ngrok + dev server are running.\n');
}

main().catch((err) => {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
});
