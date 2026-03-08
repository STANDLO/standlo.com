import { spawn } from 'child_process';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { collectionName, documentId } = await req.json();

        if (!collectionName || !documentId) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const rootDir = path.resolve(process.cwd(), '..');

        return await new Promise<Response>((resolve) => {
            const child = spawn('npx', ['tsx', 'scripts/sync-single-doc.ts', collectionName, documentId], { cwd: rootDir });

            let output = '';
            child.stdout.on('data', (data) => output += data.toString());
            child.stderr.on('data', (data) => output += data.toString());

            child.on('close', (code) => {
                if (code === 0) {
                    resolve(NextResponse.json({ success: true, log: output }));
                } else {
                    resolve(NextResponse.json({ success: false, log: output }, { status: 500 }));
                }
            });
        });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
