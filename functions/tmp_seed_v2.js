const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const app = initializeApp({
    projectId: "standlo",
});

const firestore = getFirestore(app, "standlo");

async function seedPDMPipeline() {
    const pdmPipeline = {
        id: "pdm_orchestration_example",
        name: "Complete PDM Orchestration Flow",
        description: "Generates a full PDM hierarchy: Mesh -> Part -> Assembly (with Process) -> Bundle -> Stand.",
        isActive: true,
        nodes: [
            {
                id: "trigger_start",
                type: "trigger",
                position: { x: 50, y: 150 },
                data: { label: "Start PDM Generation", triggerType: "webhook" }
            },
            // 1. Create Mesh
            {
                id: "create_mesh",
                type: "action",
                position: { x: 300, y: 150 },
                data: {
                    label: "[1] Create Base Mesh",
                    actionType: "orchestrator_create",
                    targetPath: "mesh",
                    payload: "{\n  \"name\": \"Standard Profile 100x100\",\n  \"type\": \"extrusion\",\n  \"geometry\": {}\n}"
                }
            },
            // 2. Create Part referencing Mesh
            {
                id: "create_part",
                type: "action",
                position: { x: 550, y: 150 },
                data: {
                    label: "[2] Create Derived Part",
                    actionType: "orchestrator_create",
                    targetPath: "part",
                    payload: "{\n  \"name\": \"Cut Profile 2.5m\",\n  \"meshId\": \"{{ nodes.create_mesh.output.result.data.id }}\",\n  \"type\": \"component\",\n  \"cost\": 15.50\n}"
                }
            },
            // 3. Create Assembly referencing Part and including a Process
            {
                id: "create_assembly",
                type: "action",
                position: { x: 800, y: 150 },
                data: {
                    label: "[3] Create Pillar Assembly",
                    actionType: "orchestrator_create",
                    targetPath: "assembly",
                    payload: "{\n  \"name\": \"Main Support Pillar\",\n  \"type\": \"structural\",\n  \"parts\": [\n    { \"partId\": \"{{ nodes.create_part.output.result.data.id }}\", \"quantity\": 1 }\n  ],\n  \"processes\": [\n    { \"name\": \"Welding\", \"durationMinutes\": 30, \"costPerHour\": 45 }\n  ]\n}"
                }
            },
            // 4. Create Bundle referencing Assembly
            {
                id: "create_bundle",
                type: "action",
                position: { x: 1050, y: 150 },
                data: {
                    label: "[4] Create Frame Bundle",
                    actionType: "orchestrator_create",
                    targetPath: "bundle",
                    payload: "{\n  \"name\": \"Basic Frame Kit\",\n  \"assemblies\": [\n    { \"assemblyId\": \"{{ nodes.create_assembly.output.result.data.id }}\", \"quantity\": 4 }\n  ]\n}"
                }
            },
            // 5. Create Stand referencing Bundle
            {
                id: "create_stand",
                type: "action",
                position: { x: 1300, y: 150 },
                data: {
                    label: "[5] Create Fair Stand",
                    actionType: "orchestrator_create",
                    targetPath: "stand",
                    payload: "{\n  \"name\": \"Milan Expo Stand 4x4\",\n  \"fairId\": \"milan2026\",\n  \"bundles\": [\n    { \"bundleId\": \"{{ nodes.create_bundle.output.result.data.id }}\", \"quantity\": 1 }\n  ]\n}"
                }
            }
        ],
        edges: [
            { id: "e1", source: "trigger_start", target: "create_mesh", animated: true },
            { id: "e2", source: "create_mesh", target: "create_part", animated: true },
            { id: "e3", source: "create_part", target: "create_assembly", animated: true },
            { id: "e4", source: "create_assembly", target: "create_bundle", animated: true },
            { id: "e5", source: "create_bundle", target: "create_stand", animated: true }
        ],
        createdAt: new Date().toISOString(),
        createdBy: "system",
        updatedAt: new Date().toISOString(),
        updatedBy: "system",
        deletedAt: null,
        isArchived: false,
        orgId: null,
        ownId: "system"
    };

    await firestore.collection("pipelines").doc(pdmPipeline.id).set(pdmPipeline);
    console.log(`Seeded Full PDM Pipeline successfully to database standlo.`);

    // Also seed the other example pipelines!

    const conditionalPipeline = {
        id: "routing_example_1",
        name: "Conditional Logic Demo",
        description: "An example showing conditional branches based on variable values.",
        isActive: false,
        nodes: [
            { id: "n1", type: "trigger", position: { x: 50, y: 100 }, data: { label: "Trigger Request", triggerType: "webhook" } },
            { id: "n2", type: "logic", position: { x: 300, y: 100 }, data: { label: "Amount > 5", logicType: "conditional", conditionPath: "{{ request.payload.amount }} > 5" } },
            { id: "n3", type: "action", position: { x: 550, y: 0 }, data: { label: "Log Approval", actionType: "http_request", targetPath: "https://httpbin.org/post", payload: "{\"status\": \"approved\"}" } },
            { id: "n4", type: "action", position: { x: 550, y: 200 }, data: { label: "Log Rejection", actionType: "http_request", targetPath: "https://httpbin.org/post", payload: "{\"status\": \"rejected\"}" } }
        ],
        edges: [
            { id: "e1", source: "n1", target: "n2" },
            { id: "e2", source: "n2", target: "n3", sourceHandle: "true" },
            { id: "e3", source: "n2", target: "n4", sourceHandle: "false" }
        ],
        createdAt: new Date().toISOString(),
        createdBy: "system",
        updatedAt: new Date().toISOString(),
        updatedBy: "system",
        deletedAt: null,
        isArchived: false,
        orgId: null,
        ownId: "system"
    };

    await firestore.collection("pipelines").doc(conditionalPipeline.id).set(conditionalPipeline);
    console.log(`Seeded Conditional Pipeline to database standlo.`);

}

seedPDMPipeline().catch(console.error);
