import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

try {
    initializeApp({ projectId: "standlo" });
} catch {
    // App already initialized
}

const db = getFirestore();
try { db.settings({ databaseId: "standlo" }); } catch {}

const pipelines = [
  {
    "id": "warehouse-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Warehouse Create Sub-Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger_internal",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 100
        },
        "data": {
          "triggerType": "webhook",
          "webhookSecret": ""
        }
      },
      {
        "id": "act_create_warehouse",
        "type": "action",
        "position": {
          "x": 400,
          "y": 100
        },
        "data": {
          "actionType": "orchestrator_create",
          "targetPath": "warehouse",
          "payload": "{\n  \"code\": \"{{ place.country }}-{{ place.zipCode }}-{{ vatNumber }}\",\n  \"name\": \"Sede Operativa\",\n  \"type\": \"materials\",\n  \"placeId\": \"{{ placeId }}\",\n  \"orgId\": \"{{ orgId }}\"\n}"
        }
      },
      {
        "id": "act_update_org_headquarter",
        "type": "action",
        "position": {
          "x": 700,
          "y": 100
        },
        "data": {
          "actionType": "orchestrator_update",
          "targetPath": "organization",
          "payload": "{\n  \"id\": \"{{ orgId }}\",\n  \"headquarterId\": \"{{ nodes.act_create_warehouse.output.result.data.id }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger_internal",
        "target": "act_create_warehouse"
      },
      {
        "id": "e2",
        "source": "act_create_warehouse",
        "target": "act_update_org_headquarter"
      }
    ],
    "createdAt": "2026-03-01T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-01T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "organization-user-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Organization User Create",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger_manual",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "manual"
        }
      },
      {
        "id": "act_create_org_user",
        "type": "action",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "actionType": "orchestrator_create",
          "targetPath": "organizationUser",
          "payload": "{{ data }}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger_manual",
        "target": "act_create_org_user"
      }
    ],
    "createdAt": "2026-03-08T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-08T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "organization-user-suspend",
    "orgId": "system",
    "ownId": "system",
    "name": "Organization User Suspend",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger_manual",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "manual"
        }
      },
      {
        "id": "act_suspend_org_user",
        "type": "action",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "actionType": "orchestrator_update",
          "targetPath": "organizationUser",
          "payload": "{{ data }}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger_manual",
        "target": "act_suspend_org_user"
      }
    ],
    "createdAt": "2026-03-08T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-08T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "organization-onboarding",
    "orgId": "system",
    "ownId": "system",
    "name": "Organization Onboarding",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger_org_create",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "organizations",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_create_place",
        "type": "action",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "actionType": "orchestrator_create",
          "targetPath": "place",
          "payload": "{\n  \"address\": \"{{ data.place.address }}\",\n  \"city\": \"{{ data.place.city }}\",\n  \"province\": \"{{ data.place.province }}\",\n  \"zipCode\": \"{{ data.place.zipCode }}\",\n  \"country\": \"{{ data.place.country }}\",\n  \"googlePlaceId\": \"{{ data.place.googlePlaceId }}\"\n}"
        }
      },
      {
        "id": "act_update_org_place",
        "type": "action",
        "position": {
          "x": 700,
          "y": 100
        },
        "data": {
          "actionType": "orchestrator_update",
          "targetPath": "organization",
          "payload": "{\n  \"id\": \"{{ docId }}\",\n  \"placeId\": \"{{ nodes.act_create_place.output.result.data.id }}\"\n}"
        }
      },
      {
        "id": "act_run_pipeline_warehouse_create",
        "type": "action",
        "position": {
          "x": 700,
          "y": 300
        },
        "data": {
          "actionType": "run_pipeline",
          "targetPath": "warehouse-create",
          "payload": "{\n  \"orgId\": \"{{ docId }}\",\n  \"vatNumber\": \"{{ data.vatNumber }}\",\n  \"placeId\": \"{{ nodes.act_create_place.output.result.data.id }}\",\n  \"place\": {\n    \"country\": \"{{ data.place.country }}\",\n    \"zipCode\": \"{{ data.place.zipCode }}\"\n  }\n}"
        }
      },
      {
        "id": "act_run_pipeline_org_user_create",
        "type": "action",
        "position": {
          "x": 700,
          "y": 500
        },
        "data": {
          "actionType": "run_pipeline",
          "targetPath": "organization-user-create",
          "payload": "{\n  \"orgId\": \"{{ docId }}\",\n  \"userId\": \"{{ data.createdBy }}\",\n  \"type\": \"ADMIN\",\n  \"skipAuthCreation\": true\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger_org_create",
        "target": "act_create_place"
      },
      {
        "id": "e2",
        "source": "act_create_place",
        "target": "act_update_org_place"
      },
      {
        "id": "e3",
        "source": "act_create_place",
        "target": "act_run_pipeline_warehouse_create"
      },
      {
        "id": "e4",
        "source": "act_create_place",
        "target": "act_run_pipeline_org_user_create"
      }
    ],
    "createdAt": "2026-03-01T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-01T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "organization-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Organization Create",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger_manual",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "manual"
        }
      },
      {
        "id": "act_create_org",
        "type": "action",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "actionType": "orchestrator_create",
          "targetPath": "organization",
          "payload": "{{ data }}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger_manual",
        "target": "act_create_org"
      }
    ],
    "createdAt": "2026-03-08T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-08T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "sketch-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Sketch Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "sketchs",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"sketch\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "part-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Part Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "parts",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"part\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "assembly-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Assembly Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "assemblies",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"assembly\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "bundle-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Bundle Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "bundles",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"bundle\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "design-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Design Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "designs",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"design\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "process-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Process Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "processes",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"process\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "tool-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Tool Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "tools",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"tool\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "task-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Task Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "tasks",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"task\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "project-create",
    "orgId": "system",
    "ownId": "system",
    "name": "Project Create AI Pipeline",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "position": {
          "x": 100,
          "y": 200
        },
        "data": {
          "triggerType": "firestore_event",
          "collection": "projects",
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "brain",
        "position": {
          "x": 400,
          "y": 200
        },
        "data": {
          "label": "ai_metadata",
          "skillId": "ai_metadata",
          "payload": "{\n  \"document\": \"{{ data }}\",\n  \"type\": \"project\"\n}"
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "brain",
        "position": {
          "x": 700,
          "y": 200
        },
        "data": {
          "label": "ai_dcode",
          "skillId": "ai_dcode",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_metadata.output.result }}\"\n}"
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "brain",
        "position": {
          "x": 1000,
          "y": 200
        },
        "data": {
          "label": "ai_vectorize",
          "skillId": "ai_vectorize",
          "payload": "{\n  \"document\": \"{{ nodes.act_ai_dcode.output.result }}\"\n}"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger",
        "target": "act_ai_metadata"
      },
      {
        "id": "e2",
        "source": "act_ai_metadata",
        "target": "act_ai_dcode"
      },
      {
        "id": "e3",
        "source": "act_ai_dcode",
        "target": "act_ai_vectorize"
      }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  }
];

async function seed() {
  console.log("🚀 Starting Local Seeding for Pipelines...");
  const batch = db.batch();
  for (const pip of pipelines) {
    batch.set(db.collection("pipelines").doc(pip.id), pip);
  }
  await batch.commit();
  console.log("✅ Seeded " + pipelines.length + " pipelines successfully.");
}

seed().catch(console.error);
