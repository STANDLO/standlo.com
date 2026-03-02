import { Project, ScriptTarget } from "ts-morph";
import * as prettier from "prettier";
import fs from "fs/promises";
import path from "path";

export interface SafeGenerationResult {
    success: boolean;
    formattedCode?: string;
    errors?: string[];
}

/**
 * Validates a virtual TypeScript snippet using ts-morph.
 * Formats it with Prettier.
 * If there are no syntax errors, it writes to the physical file.
 * Returns the result.
 */
export async function safeGenerateFile(absoluteFilePath: string, sourceCode: string): Promise<SafeGenerationResult> {
    try {
        // 1. Format with Prettier
        const prettierConfig = await prettier.resolveConfig(absoluteFilePath) || {
            parser: "typescript",
            printWidth: 120,
            tabWidth: 4,
            useTabs: false,
            semi: true,
            singleQuote: false,
            trailingComma: "all",
            bracketSpacing: true,
        };
        // Ensure parser is typescript
        prettierConfig.parser = "typescript";

        let formattedCode = sourceCode;
        try {
            formattedCode = await prettier.format(sourceCode, prettierConfig);
        } catch (formatError: unknown) {
            return {
                success: false,
                errors: [`Prettier Formatting Error: ${formatError instanceof Error ? formatError.message : String(formatError)}`]
            };
        }

        // 2. Virtual AST Validation using ts-morph
        const project = new Project({
            compilerOptions: {
                target: ScriptTarget.ESNext,
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true
            },
            skipAddingFilesFromTsConfig: true
        });

        // We create a virtual source file in memory
        const virtualFilePath = path.join(path.dirname(absoluteFilePath), `virtual_${path.basename(absoluteFilePath)}`);
        const sourceFile = project.createSourceFile(virtualFilePath, formattedCode, { overwrite: true });

        // Retrieve diagnostic errors
        const diagnostics = sourceFile.getPreEmitDiagnostics();

        // Filter out warnings/suggestions, keep only hard syntax/semantic errors
        // Note: Without the full project context some imports might complain about "Cannot find module".
        // To be a true SAFE GENERATION for SYNTAX, we can filter for category 1 (Error) and code that belongs to syntax.
        // Or we can just include the actual `tsconfig.json` of the functions folder.

        // As a simpler MVP, we just check for basic parse errors
        // (DiagnosticCategory 1 = Error)
        const fatalErrors = diagnostics.filter(d => d.getCategory() === 1);

        // For a full AST compile we really just want to ensure we didn't miss brackets or mess up syntax strings.
        // Since it's isolated, semantic errors about missing imports from `../base` might happen if we don't load the whole project.
        const syntaxErrors = fatalErrors.filter(d => {
            const code = d.getCode();
            // Ignore semantic missing references: 
            // 2307: Cannot find module
            // 2304: Cannot find name
            // 2552: Cannot find name (did you mean?)
            // 2792: Cannot find module (moduleResolution related)
            if ([2307, 2304, 2552, 2792].includes(code)) return false;
            return true;
        });

        if (syntaxErrors.length > 0) {
            const errorMessages = syntaxErrors.map(d => {
                const message = d.getMessageText();
                const text = typeof message === 'string' ? message : message.getMessageText();
                const line = d.getLineNumber();
                return `Line ${line}: TS${d.getCode()} - ${text}`;
            });

            return {
                success: false,
                errors: ["AST Compilation Failed (Syntax/Structure Errors):", ...errorMessages]
            };
        }

        // 3. Physical Save
        await fs.writeFile(absoluteFilePath, formattedCode, "utf-8");

        return {
            success: true,
            formattedCode
        };

    } catch (e: unknown) {
        return {
            success: false,
            errors: [`Internal Pipeline Error: ${e instanceof Error ? e.message : String(e)}`]
        };
    }
}
