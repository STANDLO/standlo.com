import { Project, SyntaxKind } from "ts-morph";
import path from "path";

async function main() {
    const project = new Project({
        tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
    });

    const primitivesFile = project.getSourceFileOrThrow("primitives.ts");

    // estrai ruoli
    const systemRolesDecl = primitivesFile.getVariableDeclarationOrThrow("SystemRoles");
    const arrExpr = systemRolesDecl.getInitializerIfKindOrThrow(SyntaxKind.AsExpression).getExpressionIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
    const systemRoles = arrExpr.getElements().map(e => e.getText().replace(/['"]/g, ""));

    let updatedCount = 0;

    const sourceFiles = [
        ...project.getSourceFiles("../functions/src/schemas/*.ts"),
        project.getSourceFileOrThrow("../functions/src/rbac/policyEngine.ts")
    ];
    console.log(`Found ${sourceFiles.length} files to check.`);

    for (const file of sourceFiles) {
        // Cerca dichiarazioni di tipo Record<RoleId, EntityPolicy> (o simili)
        const variableDecls = file.getVariableDeclarations();
        for (const decl of variableDecls) {
            const typeNode = decl.getTypeNode();
            if (typeNode && typeNode.getText().includes("Record<RoleId")) {
                const initializer = decl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
                if (initializer) {
                    console.log(`Checking ${decl.getName()} in ${file.getBaseName()}`);
                    let modified = false;
                    for (const role of systemRoles) {
                        const prop = initializer.getProperty(role);
                        if (!prop) {
                            console.log(`  - Injecting missing role: ${role}`);
                            initializer.addPropertyAssignment({
                                name: role,
                                initializer: "{ canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }"
                            });
                            modified = true;
                        }
                    }
                    if (modified) {
                        updatedCount++;
                    }
                }
            }
        }
    }

    if (updatedCount > 0) {
        console.log(`Saving ${updatedCount} modified files...`);
        await project.save();
        console.log("Done.");
    } else {
        console.log("No missing roles found.");
    }
}

main().catch(console.error);
