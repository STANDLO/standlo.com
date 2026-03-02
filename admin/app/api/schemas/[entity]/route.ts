import { NextRequest, NextResponse } from "next/server";
import { Project, SyntaxKind, ObjectLiteralExpression } from "ts-morph";
import path from "path";
import fs from "fs/promises";
import { safeGenerateFile } from "@admin/lib/ast/safeGenerator";

const SCHEMAS_DIR = path.resolve(process.cwd(), "../functions/src/schemas");
const REGISTRY_FILE = path.resolve(process.cwd(), "../functions/src/gateways/entityRegistry.ts");

export const dynamic = "force-dynamic";

function toPascalCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Inizializza project ts-morph
const getProject = () => {
    return new Project({
        tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
        skipAddingFilesFromTsConfig: true
    });
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
    try {
        const resolvedParams = await params;
        const entity = resolvedParams.entity;
        const filePath = path.join(SCHEMAS_DIR, `${entity}.ts`);
        const fileContent = await fs.readFile(filePath, "utf-8");

        const project = getProject();
        const sourceFile = project.createSourceFile("temp.ts", fileContent, { overwrite: true });

        const entityPascal = toPascalCase(entity);

        // 1. Estrai Schema Zod Property Names and Descriptions
        const schemaVar = sourceFile.getVariableDeclaration(`${entityPascal}Schema`);
        if (!schemaVar) throw new Error(`Schema ${entityPascal}Schema not found in file.`);

        const initializer = schemaVar.getInitializerIfKind(SyntaxKind.CallExpression);
        if (!initializer) throw new Error(`${entityPascal}Schema is not a CallExpression`);

        const arg0 = initializer.getArguments()[0];
        let objLiteral: ObjectLiteralExpression | undefined;
        if (arg0 && arg0.isKind(SyntaxKind.ObjectLiteralExpression)) {
            objLiteral = arg0;
        }

        const fields: Record<string, unknown>[] = [];
        if (objLiteral) {
            for (const prop of objLiteral.getProperties()) {
                if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                    const name = prop.getName();
                    const text = prop.getInitializer()?.getText() || "";

                    let meta = null;
                    const match = text.match(/\.describe\((.*)\)/);
                    if (match && match[1]) {
                        try {
                            const cleanJson = match[1].replace(/JSON\.stringify\((.*)\)/, "$1").trim();
                            meta = eval(`(${cleanJson})`);
                        } catch { }
                    }

                    // Basic Regex Parsing for Visual Editor
                    let zodType = "any";
                    if (text.startsWith("z.string()")) zodType = "string";
                    else if (text.startsWith("z.number()")) zodType = "number";
                    else if (text.startsWith("z.boolean()")) zodType = "boolean";
                    else if (text.startsWith("z.array(")) zodType = "array";
                    else if (text.startsWith("z.object(")) zodType = "object";
                    else if (text.includes("RoleIdSchema")) zodType = "roleId";
                    else if (text.includes("createUpdateSchema")) zodType = "system";

                    const isOptional = text.includes(".optional()");
                    const isRequired = !isOptional;

                    fields.push({
                        name,
                        code: text,
                        meta: meta || {},
                        zodType,
                        isRequired
                    });
                }
            }
        }

        // 2. Estrai logicamente le RBAC Policy Matrix keys (roles configurati e override fields)
        const policies: Record<string, string> = {};
        const matrixVar = sourceFile.getVariableDeclaration(`${entityPascal}PolicyMatrix`);
        if (matrixVar) {
            const matrixInit = matrixVar.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
            if (matrixInit) {
                for (const prop of matrixInit.getProperties()) {
                    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                        const roleName = prop.getName();
                        // Get the text representation
                        policies[roleName] = prop.getInitializer()?.getText() || "{}";
                    }
                }
            }
        }

        // 3. Estrai Entity Scope e Name dal file entityRegistry.ts
        const registryConfig = { scope: "tenant", collectionName: "" };
        try {
            const regSourceFile = project.addSourceFileAtPath(REGISTRY_FILE);
            const registryDecl = regSourceFile.getVariableDeclarationOrThrow("Registry");
            const regInitializer = registryDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            for (const prop of regInitializer.getProperties()) {
                if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                    if (prop.getName().replace(/['"]/g, '') === entity) {
                        const obj = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
                        if (obj) {
                            const scopeProp = obj.getProperty("scope");
                            const nameProp = obj.getProperty("name");
                            if (scopeProp && scopeProp.isKind(SyntaxKind.PropertyAssignment)) {
                                registryConfig.scope = scopeProp.getInitializer()?.getText().replace(/['"]/g, '') || "tenant";
                            }
                            if (nameProp && nameProp.isKind(SyntaxKind.PropertyAssignment)) {
                                registryConfig.collectionName = nameProp.getInitializer()?.getText().replace(/['"]/g, '') || "";
                            }
                        }
                        break;
                    }
                }
            }
        } catch (e) {
            console.warn("Could not parse entityRegistry.ts", e);
        }

        return NextResponse.json({ success: true, fields, policies, rawCode: fileContent, registryConfig });

    } catch (e: unknown) {
        if (e instanceof Error) {
            return NextResponse.json({ success: false, error: e.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
    try {
        const resolvedParams = await params;
        const entity = resolvedParams.entity;
        const body = await req.json();

        // This is where AST manipulation happens to safely rewrite the source.
        const filePath = path.join(SCHEMAS_DIR, `${entity}.ts`);
        const { rawCode, newScope, newCollectionName } = body; // MVP: We accept rawCode changes from a code editor, or we could surgically inject.

        // Update Registry if needed
        if (newScope && newCollectionName) {
            const project = getProject();
            const regSourceFile = project.addSourceFileAtPath(REGISTRY_FILE);
            const registryDecl = regSourceFile.getVariableDeclarationOrThrow("Registry");
            const regInitializer = registryDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            for (const prop of regInitializer.getProperties()) {
                if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                    if (prop.getName().replace(/['"]/g, '') === entity) {
                        const obj = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
                        if (obj) {
                            const scopeProp = obj.getProperty("scope");
                            const nameProp = obj.getProperty("name");
                            if (scopeProp && scopeProp.isKind(SyntaxKind.PropertyAssignment)) {
                                scopeProp.setInitializer(`"${newScope}"`);
                            }
                            if (nameProp && nameProp.isKind(SyntaxKind.PropertyAssignment)) {
                                nameProp.setInitializer(`"${newCollectionName}"`);
                            }
                        }
                        break;
                    }
                }
            }
            await regSourceFile.save();
            await safeGenerateFile(REGISTRY_FILE, regSourceFile.getFullText());
        }

        if (!rawCode) return NextResponse.json({ success: false, error: "rawCode missing" }, { status: 400 });

        // Pipe to Safe Generation (Validation AST + Prettier)
        const result = await safeGenerateFile(filePath, rawCode);

        if (!result.success) {
            return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "File compiled and formatted successfully" });

    } catch (e: unknown) {
        if (e instanceof Error) {
            return NextResponse.json({ success: false, error: e.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
    }
}
