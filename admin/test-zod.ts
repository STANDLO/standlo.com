import { z } from "zod";

const schema = z.object({
    geometryType: z.enum(["box", "plane"]).default("box"),
});

let actualType: any = schema.shape.geometryType;
console.log("Initial constructor:", actualType.constructor.name);
console.log("Initial typeName:", actualType._def.typeName);

while (actualType && actualType._def && actualType._def.innerType) {
    console.log("Unwrapping:", actualType.constructor.name);
    actualType = actualType._def.innerType;
}

console.log("Final constructor:", actualType.constructor.name);
console.log("Final typeName:", actualType._def.typeName);
console.log("Final keys:", Object.keys(actualType));
console.log("Final _def keys:", Object.keys(actualType._def));
if (actualType._def.values) console.log("Final _def.values:", actualType._def.values);
else console.log("Final _def.values is undefined");

// Look deeper
console.dir(actualType._def, { depth: null });
