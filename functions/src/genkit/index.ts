import { genkit, Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { geminiApiKey } from '../core/secrets';

// Enable Firebase telemetry for observability in Google Cloud
enableFirebaseTelemetry();

let aiInstance: Genkit | null = null;

// Initialize the Genkit instance lazily inside the function execution
export const getAi = () => {
    if (!aiInstance) {
        const apiKey = geminiApiKey.value();
        console.log(`[GENKIT AUTH] Preparing AI instance. API Key provided length: ${apiKey ? apiKey.length : 0}, starts with: ${apiKey ? apiKey.substring(0, 5) : 'EMPTY'}`);
        
        aiInstance = genkit({
            plugins: [googleAI({ apiKey })],
            model: 'googleai/gemini-2.5-flash',
        });
    }
    return aiInstance;
};
