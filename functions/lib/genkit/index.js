"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAi = void 0;
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
const firebase_1 = require("@genkit-ai/firebase");
const secrets_1 = require("../core/secrets");
// Enable Firebase telemetry for observability in Google Cloud
(0, firebase_1.enableFirebaseTelemetry)();
let aiInstance = null;
// Initialize the Genkit instance lazily inside the function execution
const getAi = () => {
    if (!aiInstance) {
        aiInstance = (0, genkit_1.genkit)({
            plugins: [(0, google_genai_1.googleAI)({ apiKey: secrets_1.geminiApiKey.value() })],
            model: 'googleai/gemini-2.5-flash',
        });
    }
    return aiInstance;
};
exports.getAi = getAi;
//# sourceMappingURL=index.js.map