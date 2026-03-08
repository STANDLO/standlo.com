import { extractHardwarePartsFlow } from './exampleAnalysisFlow';

// A backend record mapping skill IDs to their executable Genkit flows.
// This mirrors the skillIds in the frontend's AIRegistry.
export const AIFlows: Record<string, unknown> = {
    'ai_extract_hardware_parts': extractHardwarePartsFlow,
};
