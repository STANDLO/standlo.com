"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIFlows = void 0;
const exampleAnalysisFlow_1 = require("./exampleAnalysisFlow");
// A backend record mapping skill IDs to their executable Genkit flows.
// This mirrors the skillIds in the frontend's AIRegistry.
exports.AIFlows = {
    'ai_extract_hardware_parts': exampleAnalysisFlow_1.extractHardwarePartsFlow,
};
//# sourceMappingURL=index.js.map