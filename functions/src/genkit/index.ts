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
        aiInstance = genkit({
            plugins: [googleAI({ apiKey: geminiApiKey.value() })],
            model: 'googleai/gemini-2.5-flash',
        });
    }
    return aiInstance;
};
