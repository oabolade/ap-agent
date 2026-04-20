import { NextResponse } from 'next/server';
import * as core from 'composio-core';

export async function GET() {
    try {
        const notionToken = process.env.NOTION_API_KEY;
        const databaseId = process.env.NOTION_DB_ID;

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
                    'Invoice #': { title: [{ text: { content: 'TEST-123' } }] },
                    'Vendor': { rich_text: [{ text: { content: 'TEST' } }] },
                    'Amount': { number: 100 },
                    'Status': { select: { name: 'Pending Review' } },
                    'Confidence': { number: 100 },
                    'Processed at': { date: { start: new Date().toISOString() } }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ success: false, error: `Notion API Error: ${response.status} - ${errorText}` });
        }
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: String(e), stack: e.stack });
    }
}
