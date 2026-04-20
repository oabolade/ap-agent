import { config } from 'dotenv';
config({ path: '.env' });

const TINYFISH_SSE_URL = 'https://agent.tinyfish.ai/v1/automation/run-sse';

async function main() {
    const url = "https://unremedied-unbridled-argelia.ngrok-free.dev/vendor-portal";
    const goal = "You are on a vendor portal. Extract the details.";
    const apiKey = process.env.TINYFISH_API_KEY;

    console.log("Starting TinyFish SSE test...");
    
    const response = await fetch(TINYFISH_SSE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey || '',
        },
        body: JSON.stringify({
            url,
            goal,
            browser_profile: 'lite',
        }),
    });

    if (!response.ok) {
        console.error("HTTP Error:", response.status, await response.text());
        return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;
    
    const decoder = new TextDecoder();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log(decoder.decode(value, { stream: true }));
    }
}
main().catch(console.error);
