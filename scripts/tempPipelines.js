const entities = ["sketch", "part", "assembly", "bundle", "design", "process", "tool", "task", "project"];
const pipelines = [];

entities.forEach(entity => {
  pipelines.push({
    "id": `${entity}-create`,
    "orgId": "system",
    "ownId": "system",
    "name": `${entity.charAt(0).toUpperCase() + entity.slice(1)} Create AI Pipeline`,
    "isActive": true,
    "nodes": [
      {
        "id": `trigger`,
        "type": "trigger",
        "position": { "x": 100, "y": 200 },
        "data": {
          "triggerType": "firestore_event",
          "collection": entity === "assembly" ? "assemblies" : entity === "process" ? "processes" : `${entity}s`,
          "triggerEvent": "create"
        }
      },
      {
        "id": "act_ai_metadata",
        "type": "action",
        "position": { "x": 400, "y": 200 },
        "data": {
          "actionType": "brain",
          "targetPath": "ai_metadata",
          "payload": `{\n  "document": "{{ data }}",\n  "type": "${entity}"\n}`
        }
      },
      {
        "id": "act_ai_dcode",
        "type": "action",
        "position": { "x": 700, "y": 200 },
        "data": {
          "actionType": "brain",
          "targetPath": "ai_dcode",
          "payload": `{\n  "document": "{{ nodes.act_ai_metadata.output.result }}"\n}`
        }
      },
      {
        "id": "act_ai_vectorize",
        "type": "action",
        "position": { "x": 1000, "y": 200 },
        "data": {
          "actionType": "brain",
          "targetPath": "ai_vectorize",
          "payload": `{\n  "document": "{{ nodes.act_ai_dcode.output.result }}"\n}`
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "trigger", "target": "act_ai_metadata" },
      { "id": "e2", "source": "act_ai_metadata", "target": "act_ai_dcode" },
      { "id": "e3", "source": "act_ai_dcode", "target": "act_ai_vectorize" }
    ],
    "createdAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  });
});

console.log(JSON.stringify(pipelines, null, 2));
