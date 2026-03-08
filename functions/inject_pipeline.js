const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "standlo";

const app = initializeApp();
const db = getFirestore(app, "standlo");

const pipelineDef = {
    "id": "onboard-warehouse-pipeline",
    "orgId": "system",
    "ownId": "system",
    "name": "Organization Provisioning (Place & Warehouse)",
    "isActive": true,
    "nodes": [
        {
            "id": "trigger_org_create",
            "type": "trigger",
            "position": { "x": 100, "y": 100 },
            "data": {
                "triggerType": "firestore_event",
                "collection": "organizations",
                "triggerEvent": "create"
            }
        },
        {
            "id": "act_create_place",
            "type": "action",
            "position": { "x": 400, "y": 100 },
            "data": {
                "actionType": "firestore_create",
                "targetPath": "places",
                "payload": {
                    "address": "{{ data.place.address }}",
                    "city": "{{ data.place.city }}",
                    "province": "{{ data.place.province }}",
                    "zipCode": "{{ data.place.zipCode }}",
                    "country": "{{ data.place.country }}",
                    "googlePlaceId": "{{ data.place.googlePlaceId }}"
                }
            }
        },
        {
            "id": "act_update_org_place",
            "type": "action",
            "position": { "x": 700, "y": 100 },
            "data": {
                "actionType": "firestore_update",
                "targetPath": "organizations",
                "payload": {
                    "id": "{{ docId }}",
                    "placeId": "{{ nodes.act_create_place.output.result.data.id }}"
                }
            }
        },
        {
            "id": "act_create_warehouse",
            "type": "action",
            "position": { "x": 1000, "y": 100 },
            "data": {
                "actionType": "firestore_create",
                "targetPath": "warehouses",
                "payload": {
                    "code": "{{ data.place.country }}-{{ data.place.zipCode }}-{{ data.vatNumber }}",
                    "name": "Sede Operativa",
                    "type": "materials",
                    "placeId": "{{ nodes.act_create_place.output.result.data.id }}",
                    "orgId": "{{ docId }}"
                }
            }
        },
        {
            "id": "act_update_org_headquarter",
            "type": "action",
            "position": { "x": 1300, "y": 100 },
            "data": {
                "actionType": "firestore_update",
                "targetPath": "organizations",
                "payload": {
                    "id": "{{ docId }}",
                    "headquarterId": "{{ nodes.act_create_warehouse.output.result.data.id }}"
                }
            }
        }
    ],
    "edges": [
        { "id": "e1", "source": "trigger_org_create", "target": "act_create_place" },
        { "id": "e2", "source": "act_create_place", "target": "act_update_org_place" },
        { "id": "e3", "source": "act_update_org_place", "target": "act_create_warehouse" },
        { "id": "e4", "source": "act_create_warehouse", "target": "act_update_org_headquarter" }
    ],
    "createdAt": new Date().toISOString(),
    "createdBy": "system",
    "updatedAt": new Date().toISOString(),
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
};

async function main() {
    await db.collection("pipelines").doc(pipelineDef.id).set(pipelineDef);
    console.log("Pipeline onboard-warehouse-pipeline injected into database standlo.");
    process.exit(0);
}
main().catch(console.error);
