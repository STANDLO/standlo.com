import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Project, SyntaxKind } from "ts-morph";

const SCHEMAS_DIR = path.resolve(process.cwd(), "../functions/src/schemas");
const REGISTRY_FILE = path.resolve(process.cwd(), "../functions/src/gateways/entityRegistry.ts");

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const project = new Project();
        const registrySource = project.addSourceFileAtPath(REGISTRY_FILE);
        const registryDecl = registrySource.getVariableDeclarationOrThrow("Registry");
        const initializer = registryDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        const entities = [];

        for (const property of initializer.getProperties()) {
            if (property.isKind(SyntaxKind.PropertyAssignment)) {
                const entityName = property.getName().replace(/['"]/g, '');
                const objValue = property.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

                if (objValue) {
                    const scopeProp = objValue.getProperty("scope");
                    const nameProp = objValue.getProperty("name");

                    let scope = "tenant";
                    let collectionName = "";

                    if (scopeProp && scopeProp.isKind(SyntaxKind.PropertyAssignment)) {
                        scope = scopeProp.getInitializer()?.getText().replace(/['"]/g, '') || "tenant";
                    }
                    if (nameProp && nameProp.isKind(SyntaxKind.PropertyAssignment)) {
                        collectionName = nameProp.getInitializer()?.getText().replace(/['"]/g, '') || "";
                    }

                    const schemaFilePath = path.join(SCHEMAS_DIR, `${entityName}.ts`);
                    let hasSchema = false;
                    try {
                        await fs.access(schemaFilePath);
                        hasSchema = true;
                    } catch {
                        hasSchema = false;
                    }

                    entities.push({
                        id: entityName,
                        scope,
                        collectionName,
                        hasSchema
                    });
                }
            }
        }

        return NextResponse.json({ success: true, entities });
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}
