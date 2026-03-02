import { NextRequest, NextResponse } from "next/server";
import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs/promises";
import { safeGenerateFile } from "@admin/lib/ast/safeGenerator";

function toPascalCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { oldEntity, newEntity } = body;

        if (!oldEntity || !newEntity) {
            return NextResponse.json({ success: false, error: "Missing oldEntity or newEntity" }, { status: 400 });
        }

        const oldPascal = toPascalCase(oldEntity);
        const newPascal = toPascalCase(newEntity);

        const SCHEMAS_DIR = path.resolve(process.cwd(), "../functions/src/schemas");
        const INDEX_FILE = path.join(SCHEMAS_DIR, "index.ts");
        const REGISTRY_FILE = path.resolve(process.cwd(), "../functions/src/gateways/entityRegistry.ts");

        const oldFilePath = path.join(SCHEMAS_DIR, `${oldEntity}.ts`);
        const newFilePath = path.join(SCHEMAS_DIR, `${newEntity}.ts`);

        // Check if Old File Exists
        try {
            await fs.access(oldFilePath);
        } catch {
            return NextResponse.json({ success: false, error: `Entity file ${oldEntity}.ts not found` }, { status: 404 });
        }

        // Initialize ts-morph wrapper
        const project = new Project({
            tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
            skipAddingFilesFromTsConfig: true
        });

        // 1. Rename physical file
        await fs.rename(oldFilePath, newFilePath);

        // 2. Update schemas/index.ts
        const indexSource = project.addSourceFileAtPath(INDEX_FILE);
        let indexUpdated = false;
        indexSource.getExportDeclarations().forEach(exportDecl => {
            const moduleSpecifier = exportDecl.getModuleSpecifierValue();
            if (moduleSpecifier === `./${oldEntity}`) {
                exportDecl.setModuleSpecifier(`./${newEntity}`);
                indexUpdated = true;
            }
        });
        if (indexUpdated) {
            await indexSource.save();
            await safeGenerateFile(INDEX_FILE, indexSource.getFullText());
        }

        // 3. Update entityRegistry.ts
        const regSource = project.addSourceFileAtPath(REGISTRY_FILE);
        const registryDecl = regSource.getVariableDeclarationOrThrow("Registry");
        const regInitializer = registryDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        let registryUpdated = false;

        for (const prop of regInitializer.getProperties()) {
            if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                if (prop.getName().replace(/['"]/g, '') === oldEntity) {
                    // Rename the key
                    prop.rename(newEntity);
                    const obj = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
                    if (obj) {
                        // Update Schema Reference
                        const schemaProp = obj.getProperty("schema");
                        if (schemaProp && schemaProp.isKind(SyntaxKind.PropertyAssignment)) {
                            schemaProp.setInitializer(`schemas.${newPascal}Schema`);
                        }
                    }
                    registryUpdated = true;
                    break;
                }
            }
        }
        if (registryUpdated) {
            await regSource.save();
            await safeGenerateFile(REGISTRY_FILE, regSource.getFullText());
        }

        // 4. Update the schema files AST identifiers
        const schemaSource = project.addSourceFileAtPath(newFilePath);
        let schemaUpdated = false;

        // Try to rename Schema Variable
        const schemaVar = schemaSource.getVariableDeclaration(`${oldPascal}Schema`);
        if (schemaVar) {
            schemaVar.rename(`${newPascal}Schema`);
            schemaUpdated = true;
        }

        // Try to rename Policy Matrix
        const policyVar = schemaSource.getVariableDeclaration(`${oldPascal}PolicyMatrix`);
        if (policyVar) {
            policyVar.rename(`${newPascal}PolicyMatrix`);
            schemaUpdated = true;
        }

        // Try to rename Base Type Interface
        const typeAlias = schemaSource.getTypeAlias(oldPascal);
        if (typeAlias) {
            typeAlias.rename(newPascal);
            // Replace z.infer reference inside
            const oldInferTxt = `z.infer<typeof ${oldPascal}Schema>`;
            const newInferTxt = `z.infer<typeof ${newPascal}Schema>`;
            if (typeAlias.getText().includes(oldInferTxt)) {
                typeAlias.setType(typeAlias.getTypeNode()!.getText().replace(oldInferTxt, newInferTxt));
            }
            schemaUpdated = true;
        }

        if (schemaUpdated) {
            await schemaSource.save();
            await safeGenerateFile(newFilePath, schemaSource.getFullText());
        }

        // 5. Update policyEngine.ts
        const POLICY_FILE = path.resolve(process.cwd(), "../functions/src/rbac/policyEngine.ts");
        const policySource = project.addSourceFileAtPath(POLICY_FILE);
        let policySourceUpdated = false;

        // Update Import Declaration
        policySource.getImportDeclarations().forEach(imp => {
            const moduleSpecifier = imp.getModuleSpecifierValue();
            if (moduleSpecifier === `../schemas/${oldEntity}`) {
                imp.setModuleSpecifier(`../schemas/${newEntity}`);
                // Rename specific imported name
                const namedImports = imp.getNamedImports();
                namedImports.forEach(ni => {
                    if (ni.getName() === `${oldPascal}PolicyMatrix`) {
                        ni.renameAlias(`${newPascal}PolicyMatrix`);
                        ni.setName(`${newPascal}PolicyMatrix`);
                        if (ni.getAliasNode()) {
                            ni.removeAlias(); // Clean up if it just says Old as New
                        }
                    }
                });
                policySourceUpdated = true;
            }
        });

        // Update PolicyMatrices Record
        const matricesDecl = policySource.getVariableDeclaration("PolicyMatrices");
        if (matricesDecl) {
            const initializer = matricesDecl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
            if (initializer) {
                for (const prop of initializer.getProperties()) {
                    if (prop.isKind(SyntaxKind.PropertyAssignment) && prop.getName().replace(/['"]/g, '') === oldEntity) {
                        prop.rename(newEntity);
                        const init = prop.getInitializer();
                        if (init && init.getText() === `${oldPascal}PolicyMatrix`) {
                            prop.setInitializer(`${newPascal}PolicyMatrix`);
                        }
                        policySourceUpdated = true;
                        break;
                    }
                }
            }
        }

        if (policySourceUpdated) {
            await policySource.save();
            await safeGenerateFile(POLICY_FILE, policySource.getFullText());
        }

        return NextResponse.json({ success: true, message: `Entity successfully renamed to ${newEntity}` });

    } catch (e: unknown) {
        if (e instanceof Error) {
            return NextResponse.json({ success: false, error: e.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
    }
}
