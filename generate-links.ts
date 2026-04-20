import { Composio } from 'composio-core';

async function generateLinks() {
    console.log("Initializing Composio with your API key...");
    const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    
    try {
        console.log("\nGenerating Notion connection link for 'default' entity...");
        const notionReq = await client.connectedAccounts.initiate({
            entityId: 'default',
            appName: 'notion',
            redirectUri: 'https://app.composio.dev/settings' 
        });
        console.log("👉 CLICK HERE FOR NOTION: ", notionReq.redirectUrl);
        
        console.log("\nGenerating Slack connection link for 'default' entity...");
        const slackReq = await client.connectedAccounts.initiate({
            entityId: 'default',
            appName: 'slack',
            redirectUri: 'https://app.composio.dev/settings'
        });
        console.log("👉 CLICK HERE FOR SLACK: ", slackReq.redirectUrl);
        
    } catch (e) {
        console.error("Failed to generate links:", e);
    }
}

generateLinks();
