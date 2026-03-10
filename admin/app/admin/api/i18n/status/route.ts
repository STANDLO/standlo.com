import { NextResponse } from "next/server";
import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs/promises";

const FUNCTIONS_INDEX = path.resolve(process.cwd(), "../functions/src/index.ts");
const MESSAGES_DIR = path.resolve(process.cwd(), "../messages");

export const dynamic = "force-dynamic";

function flattenObject(ob: Record<string, unknown>): Record<string, string> {
    const toReturn: Record<string, string> = {};
    for (const i in ob) {
        if (!Object.prototype.hasOwnProperty.call(ob, i)) continue;
        if ((typeof ob[i]) === 'object' && ob[i] !== null) {
            const flatObject = flattenObject(ob[i] as Record<string, unknown>);
            for (const x in flatObject) {
                if (!Object.prototype.hasOwnProperty.call(flatObject, x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = String(ob[i]);
        }
    }
    return toReturn;
}

function unflattenObject(ob: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in ob) {
        const parts = key.split('.');
        let current: Record<string, unknown> = result;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = ob[key];
            } else {
                current[part] = (current[part] as Record<string, unknown>) || {};
                current = current[part] as Record<string, unknown>;
            }
        }
    }
    return result;
}

export async function GET() {
    try {
        const project = new Project({
            tsConfigFilePath: path.resolve(process.cwd(), "../functions/tsconfig.json"),
            skipAddingFilesFromTsConfig: true
        });

        // 1. Extract Locales
        const sourceFile = project.addSourceFileAtPath(FUNCTIONS_INDEX);
        const localesVar = sourceFile.getVariableDeclarationOrThrow("systemLocales");
        const initializer = localesVar.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

        const locales: { code: string; nativeLabel: string; flag: string }[] = [];
        for (const element of initializer.getElements()) {
            if (element.isKind(SyntaxKind.ObjectLiteralExpression)) {
                let code, nativeLabel, flag;
                for (const prop of element.getProperties()) {
                    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                        const name = prop.getName();
                        const val = prop.getInitializer()?.getText().replace(/['"]/g, '');
                        if (name === "code") code = val;
                        if (name === "nativeLabel") nativeLabel = val;
                        if (name === "flag") flag = val;
                    }
                }
                if (code && nativeLabel && flag) {
                    locales.push({ code, nativeLabel, flag });
                }
            }
        }

        // 2. Load US base translations
        const usPath = path.join(MESSAGES_DIR, "us.json");
        let usBase: Record<string, unknown> = {};
        try {
            const usRaw = await fs.readFile(usPath, "utf-8");
            usBase = JSON.parse(usRaw);
        } catch {
            return NextResponse.json({ success: false, error: "us.json not found or invalid" }, { status: 500 });
        }

        const flatUs = flattenObject(usBase);
        const usKeys = Object.keys(flatUs);
        const totalKeys = usKeys.length;

        // 3. Compare with other locales
        const analysis = await Promise.all(locales.map(async (locale) => {
            const localePath = path.join(MESSAGES_DIR, `${locale.code}.json`);
            let localeBase: Record<string, unknown> = {};
            let isFound = true;
            try {
                const localeRaw = await fs.readFile(localePath, "utf-8");
                localeBase = JSON.parse(localeRaw);
            } catch {
                isFound = false;
            }

            const flatLocale = flattenObject(localeBase);
            const missingKeysPayload: Record<string, string> = {};
            let missingCount = 0;

            if (locale.code !== "us") {
                usKeys.forEach(k => {
                    if (flatLocale[k] === undefined) {
                        missingKeysPayload[k] = `[MISSING: ${locale.code.toUpperCase()}] ${flatUs[k]}`;
                        missingCount++;
                    }
                });
            }

            // Provide unflattened export for copy pasting
            const exportData = unflattenObject(missingKeysPayload);

            return {
                ...locale,
                isFound,
                missingCount: locale.code === "us" ? 0 : missingCount,
                exportData: Object.keys(exportData).length > 0 ? JSON.stringify(exportData, null, 2) : null
            };
        }));

        return NextResponse.json({ success: true, baseKeysCount: totalKeys, analysis });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
