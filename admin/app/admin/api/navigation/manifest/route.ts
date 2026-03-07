import { NextRequest, NextResponse } from "next/server";
import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import { safeGenerateFile } from "@admin/lib/ast/safeGenerator";

const POLICY_FILE = path.resolve(process.cwd(), "../functions/src/rbac/policyEngine.ts");

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const project = new Project({
            tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
            skipAddingFilesFromTsConfig: true
        });

        const sourceFile = project.addSourceFileAtPath(POLICY_FILE);
        const navFn = sourceFile.getFunctionOrThrow("generateNavigationManifest");
        const switchStmt = navFn.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

        const rolesData: Record<string, Record<string, string>[]> = {};

        for (const clause of switchStmt.getClauses()) {
            if (clause.isKind(SyntaxKind.CaseClause)) {
                const role = clause.getExpression().getText().replace(/['"]/g, "");
                const retStmt = clause.getFirstDescendantByKind(SyntaxKind.ReturnStatement);

                if (retStmt) {
                    const arrayLit = retStmt.getExpressionIfKind(SyntaxKind.ArrayLiteralExpression);
                    if (arrayLit) {
                        const items = [];
                        for (const element of arrayLit.getElements()) {
                            if (element.isKind(SyntaxKind.ObjectLiteralExpression)) {
                                const item: Record<string, string> = {};
                                for (const prop of element.getProperties()) {
                                    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                                        const name = prop.getName();
                                        const init = prop.getInitializer();
                                        if (init) {
                                            let val = init.getText();
                                            if (val.startsWith("`") && val.endsWith("`")) {
                                                // Extract contents of template literal
                                                val = val.substring(1, val.length - 1);
                                            } else {
                                                val = val.replace(/['"]/g, "");
                                            }
                                            item[name] = val;
                                        }
                                    }
                                }
                                items.push(item);
                            }
                        }
                        rolesData[role] = items;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, manifests: rolesData });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role, items } = body;

        if (!role || !Array.isArray(items)) {
            return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
        }

        const project = new Project({
            tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
            skipAddingFilesFromTsConfig: true
        });

        const sourceFile = project.addSourceFileAtPath(POLICY_FILE);
        const navFn = sourceFile.getFunctionOrThrow("generateNavigationManifest");
        const switchStmt = navFn.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

        let modified = false;

        for (const clause of switchStmt.getClauses()) {
            if (clause.isKind(SyntaxKind.CaseClause)) {
                const clauseRole = clause.getExpression().getText().replace(/['"]/g, "");

                if (clauseRole === role) {
                    const retStmt = clause.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);
                    const arrayLit = retStmt.getExpressionIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

                    const newArrayContent = items.map(item => {
                        const pathStr = item.path.includes("${") ? `\`${item.path}\`` : `"${item.path}"`;
                        let s = `{ labelKey: "${item.labelKey}", path: ${pathStr}, icon: "${item.icon}"`;
                        if (item.matchPattern) {
                            const matchStr = item.matchPattern.includes("${") ? `\`${item.matchPattern}\`` : `"${item.matchPattern}"`;
                            s += `, matchPattern: ${matchStr}`;
                        }
                        s += ` }`;
                        return s;
                    }).join(',\n                ');

                    arrayLit.replaceWithText(`[\n                ${newArrayContent}\n            ]`);
                    modified = true;
                    break;
                }
            }
        }

        if (!modified) {
            return NextResponse.json({ success: false, error: "Role not found in switch statement" }, { status: 404 });
        }

        await sourceFile.save();
        await safeGenerateFile(POLICY_FILE, sourceFile.getFullText());

        return NextResponse.json({ success: true, message: "Manifest updated successfully" });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
