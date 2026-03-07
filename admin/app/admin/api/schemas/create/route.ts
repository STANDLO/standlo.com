import { NextRequest, NextResponse } from "next/server";
import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs/promises";
import { safeGenerateFile } from "@admin/lib/ast/safeGenerator";

const SCHEMAS_DIR = path.resolve(process.cwd(), "../functions/src/schemas");
const REGISTRY_FILE = path.resolve(process.cwd(), "../functions/src/gateways/entityRegistry.ts");
const INDEX_FILE = path.resolve(process.cwd(), "../functions/src/schemas/index.ts");

function toPascalCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { entityName } = body; // Must be camelCase, e.g. "product"

        if (!entityName || !/^[a-z][a-zA-Z0-9]*$/.test(entityName)) {
            return NextResponse.json({ success: false, error: "Invalid entity name. Must be camelCase." }, { status: 400 });
        }

        const project = new Project({
            tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
            skipAddingFilesFromTsConfig: true
        });

        // 1. Update entityRegistry.ts
        const regSourceFile = project.addSourceFileAtPath(REGISTRY_FILE);
        const registryDecl = regSourceFile.getVariableDeclarationOrThrow("Registry");
        const regInitializer = registryDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        // Check if exists
        let exists = false;
        for (const prop of regInitializer.getProperties()) {
            if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                if (prop.getName().replace(/['"]/g, '') === entityName) {
                    exists = true;
                    break;
                }
            }
        }

        if (exists) {
            return NextResponse.json({ success: false, error: "Entity already exists in Registry." }, { status: 400 });
        }

        const entityPascal = toPascalCase(entityName);
        const defaultCollectionName = `${entityName}s`;

        // Inject new property into Registry
        regInitializer.addPropertyAssignment({
            name: `"${entityName}"`,
            initializer: `{ scope: "tenant", name: "${defaultCollectionName}", schema: schemas.${entityPascal}Schema }`
        });

        await regSourceFile.save();
        await safeGenerateFile(REGISTRY_FILE, regSourceFile.getFullText());

        // 2. Create the boilerplate schema file
        const schemaFilePath = path.join(SCHEMAS_DIR, `${entityName}.ts`);
        const boilerplateCode = `import { z } from "zod";
import { IdSchema, createUpdateSchema } from "./base";

export const ${entityPascal}Schema = createUpdateSchema(
    z.object({
        name: z.string().describe(JSON.stringify({ type: "text", label: "Name" })),
    })
);

export type ${entityPascal}Doc = z.infer<typeof ${entityPascal}Schema>;

export const ${entityPascal}PolicyMatrix = {
    admin: { allowedFields: "*" },
};
`;

        await safeGenerateFile(schemaFilePath, boilerplateCode);

        // 3. Update schemas/index.ts to export the new schema
        let indexContent = await fs.readFile(INDEX_FILE, "utf-8");
        if (!indexContent.includes(`export * from "./${entityName}";`)) {
            indexContent += `\nexport * from "./${entityName}";\n`;
            await fs.writeFile(INDEX_FILE, indexContent, "utf-8");
        }

        return NextResponse.json({ success: true, message: "Entity created successfully" });

    } catch (e: unknown) {
        if (e instanceof Error) {
            return NextResponse.json({ success: false, error: e.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
    }
}
