import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { target } = body;

        let scriptName = "";
        if (target === "ai_skills") {
            scriptName = "seedLocalAISkills.mjs";
        } else if (target === "pipelines") {
            scriptName = "seedLocalPipelines.mjs";
        } else {
            return NextResponse.json({ success: false, error: "Unknown seed target" }, { status: 400 });
        }

        // We run the script from the root monorepo directory
        // The admin app is located at /standlo.com/admin, so we step up one directory
        const scriptPath = path.join(process.cwd(), "..", "scripts", scriptName);
        
        console.log(`Executing seed script: node ${scriptPath}`);
        const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
        
        console.log("Seed complete:", stdout);
        if (stderr) console.error("Seed stderr:", stderr);

        return NextResponse.json({ success: true, log: stdout });
    } catch (error: unknown) {
        console.error("Seed execution failed:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
