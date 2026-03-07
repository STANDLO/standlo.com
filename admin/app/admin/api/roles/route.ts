import { NextRequest, NextResponse } from "next/server";
import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import { SystemRoleOptions } from "@/../functions/src/schemas/primitives"; // Import real objects for GET

export async function GET() {
    return NextResponse.json(SystemRoleOptions);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, label } = body;

        if (!id || !label) {
            return NextResponse.json({ error: "id and label are required" }, { status: 400 });
        }

        const project = new Project({
            tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
        });

        const primitivesFile = project.getSourceFileOrThrow("primitives.ts");

        // 1. Add to SystemRoles array
        const systemRolesDecl = primitivesFile.getVariableDeclarationOrThrow("SystemRoles");
        const arrExpr = systemRolesDecl
            .getInitializerIfKindOrThrow(SyntaxKind.AsExpression)
            .getExpressionIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

        // Controlla se esiste già
        const existingRoles = arrExpr.getElements().map(e => e.getText().replace(/['"]/g, ""));
        if (existingRoles.includes(id)) {
            return NextResponse.json({ error: `Role ${id} already exists` }, { status: 400 });
        }

        // Aggiunge prima di 'other' se esiste
        const otherIndex = existingRoles.indexOf("other");
        if (otherIndex !== -1) {
            arrExpr.insertElement(otherIndex, `'${id}'`);
        } else {
            arrExpr.addElement(`'${id}'`);
        }

        // 2. Add to SystemRoleLabels Record
        const systemRoleLabelsDecl = primitivesFile.getVariableDeclarationOrThrow("SystemRoleLabels");
        const objExpr = systemRoleLabelsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        // Aggiunge la proprietà prima di 'other'
        const otherPropIndex = objExpr.getProperties().findIndex(p => p.getText().startsWith("other:"));
        if (otherPropIndex !== -1) {
            objExpr.insertPropertyAssignment(otherPropIndex, {
                name: id,
                initializer: `'${label}'`
            });
        } else {
            objExpr.addPropertyAssignment({
                name: id,
                initializer: `'${label}'`
            });
        }

        // 3. Inject empty policy into ALL PolicyMatrices in schemas/*.ts
        const schemaFiles = project.getSourceFiles("src/schemas/*.ts");
        let updatedMatrices = 0;

        for (const file of schemaFiles) {
            const variableDecls = file.getVariableDeclarations();
            for (const decl of variableDecls) {
                const typeNode = decl.getTypeNode();
                if (typeNode && typeNode.getText().includes("Record<RoleId, EntityPolicy>")) {
                    const initializer = decl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
                    if (initializer) {
                        const existingProp = initializer.getProperty(id);
                        if (!existingProp) {
                            initializer.addPropertyAssignment({
                                name: id,
                                initializer: "{ canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }"
                            });
                            updatedMatrices++;
                        }
                    }
                }
            }
        }

        // Save all changes
        await project.save();

        return NextResponse.json({
            success: true,
            message: `Role ${id} added successfully. Updated ${updatedMatrices} matrices.`
        });

    } catch (e: unknown) {
        console.error("Error generating role:", e);
        return NextResponse.json({ error: (e as Error).message || "Failed to create role" }, { status: 500 });
    }
}
