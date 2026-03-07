"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooks = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const app_check_1 = require("firebase-admin/app-check");
const auth_1 = require("firebase-admin/auth");
const pipeline_1 = require("../orchestrator/pipeline");
const secrets_1 = require("../core/secrets");
// Using the same enterprise named database
const db = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
exports.webhooks = (0, https_1.onRequest)({
    region: "europe-west4",
    secrets: [secrets_1.geminiApiKey],
    cors: true
}, async (req, res) => {
    var _a;
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        // URL format: /pipelines/webhook?id=pipeline_id
        const pipelineId = req.query.id;
        if (!pipelineId) {
            res.status(400).send("Bad Request: Missing pipeline 'id' query parameter.");
            return;
        }
        // 1. Load Pipeline to retrieve configs (secrets, active status)
        const pipelineDoc = await db.collection("pipelines").doc(pipelineId).get();
        if (!pipelineDoc.exists) {
            res.status(404).send("Pipeline not found.");
            return;
        }
        const pipeline = pipelineDoc.data();
        if (!pipeline.isActive) {
            res.status(400).send("Pipeline is inactive.");
            return;
        }
        // We check if the pipeline has a trigger node of type webhook
        const triggerNode = pipeline.nodes.find(n => { var _a; return n.type === "trigger" && ((_a = n.data) === null || _a === void 0 ? void 0 : _a.triggerType) === "webhook"; });
        if (!triggerNode) {
            res.status(400).send("Pipeline is not configured for webhook triggers.");
            return;
        }
        const webhookSecret = (_a = triggerNode.data) === null || _a === void 0 ? void 0 : _a.webhookSecret;
        let authorizedUid = "system"; // Default executor
        // 2. Authentication Strategy Bifurcation
        const authHeader = req.headers.authorization;
        const appCheckHeader = req.headers['x-firebase-appcheck'];
        const queryToken = req.query.token;
        // PATH A: Internal App Call (Auth + AppCheck)
        if (authHeader && authHeader.startsWith('Bearer ') && appCheckHeader) {
            try {
                // Verify AppCheck token
                if (process.env.FUNCTIONS_EMULATOR !== "true") {
                    await (0, app_check_1.getAppCheck)((0, app_1.getApp)()).verifyToken(appCheckHeader);
                }
                // Verify Firebase Auth Token
                const idToken = authHeader.split('Bearer ')[1];
                const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(idToken);
                authorizedUid = decodedToken.uid;
                // Note: The RBAC Policy Matrix verification implies checking if this user has canUpdate/canCreate.
                // For a webhook, as long as it's triggered internally by an authenticated user, we can assume
                // it's an internal execution. Proper RBAC check can be added if we pull the user's role.
            }
            catch (authErr) {
                console.error("Internal Auth validation failed:", authErr);
                res.status(401).send("Unauthorized: Invalid Auth or AppCheck token.");
                return;
            }
        }
        // PATH B: External Webhook (Secret Match)
        else if (webhookSecret) {
            if (queryToken !== webhookSecret) {
                res.status(401).send("Unauthorized: Invalid webhook secret token.");
                return;
            }
        }
        // PATH C: No Auth provided
        else {
            res.status(401).send("Unauthorized: Missing authentication headers or tokens.");
            return;
        }
        // 3. Execution Phase
        // Pass the body payload to the pipeline execution context
        const executionContext = {
            request: {
                payload: req.body
            }
        };
        console.log(`[Webhook] Triggering Pipeline ${pipelineId} by ${authorizedUid}`);
        await (0, pipeline_1.runPipeline)(authorizedUid, pipelineId, executionContext, false);
        res.status(200).json({ status: "success", message: "Pipeline workflow triggered successfully." });
    }
    catch (error) {
        console.error(`[Webhook Error] Pipeline ${req.query.id}:`, error);
        res.status(500).json({ status: "error", message: "Internal Server Error", details: error.message });
    }
});
//# sourceMappingURL=webhooks.js.map