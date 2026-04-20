// ─── AutoAP — ElevenLabs Voice Summary ────────────────────────────
// Generates an audio summary of daily AP activity.
// Called on-demand from the dashboard (play button).
//
// Required env: ELEVENLABS_API_KEY

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — neutral, professional
const MODEL_ID = 'eleven_monolingual_v1';
const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export interface DailyStats {
    invoiceCount: number;
    vendorCount: number;
    totalAmount: number;
    exceptionCount: number;
    averageConfidence: number;
    timeSavedMinutes: number;
}

function buildScript(stats: DailyStats): string {
    const exceptionLine = stats.exceptionCount > 0
        ? `${stats.exceptionCount} invoice${stats.exceptionCount > 1 ? 's' : ''} require your attention.`
        : 'All invoices were automatically approved.';

    return [
        `Good morning.`,
        `AutoAP processed ${stats.invoiceCount} invoice${stats.invoiceCount !== 1 ? 's' : ''} yesterday`,
        `across ${stats.vendorCount} vendor${stats.vendorCount !== 1 ? 's' : ''},`,
        `totalling $${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        exceptionLine,
        stats.averageConfidence > 0
            ? `Average dual-source confidence score was ${stats.averageConfidence}%.`
            : '',
        `Estimated time saved: ${stats.timeSavedMinutes} minutes.`,
    ].filter(Boolean).join(' ');
}

export async function generateDailySummary(stats: DailyStats): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY not set');
    }

    const script = buildScript(stats);
    console.log(`[ElevenLabs] Generating summary: "${script.slice(0, 80)}..."`);

    const response = await fetch(`${API_URL}/${VOICE_ID}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
            text: script,
            model_id: MODEL_ID,
            voice_settings: {
                stability: 0.6,
                similarity_boost: 0.8,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Export the script builder for testing
export { buildScript };
