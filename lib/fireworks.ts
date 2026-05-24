// ─── AutoAP — Fireworks.ai Invoice Parser ─────────────────────────
// Skill 2 from SKILLS.md — extracts structured data from invoice text.

import { ParsedInvoice } from './types';

export async function parseInvoice(rawText: string): Promise<ParsedInvoice> {
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
        throw new Error('FIREWORKS_API_KEY is not configured');
    }

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'accounts/fireworks/models/kimi-k2p6',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You are an expert invoice parser. Extract all invoice data and return ONLY valid JSON. 
                    No markdown, no explanation. If a field is not found, use null.
                    Always normalize amounts to numbers (no $ signs, no commas).
                    Always normalize dates to ISO 8601 format (YYYY-MM-DD).`,
                },
                {
                    role: 'user',
                    content: `Parse this invoice and return JSON matching this exact schema:
{
  "vendor_name": string,
  "invoice_number": string,
  "invoice_date": string,
  "due_date": string,
  "total_amount": number,
  "currency": string,
  "po_number": string | null,
  "line_items": [{"description": string, "quantity": number, "unit_price": number, "total": number}]
}

Invoice text:
${rawText}`,
                },
            ],
            temperature: 0.1,
            max_tokens: 1000,
        }),
    });

    if (!response.ok) {
        throw new Error(`Fireworks API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Strip any accidental markdown fences
    const clean = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    return { ...parsed, raw_text: rawText };
}
