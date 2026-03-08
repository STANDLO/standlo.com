import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
    const { command } = await req.json();

    if (command !== "sync:local" && command !== "sync:production") {
        return new Response("Invalid command", { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Poichè admin si trova in ./admin, la root di progetto è un livello su
            const rootDir = path.resolve(process.cwd(), '..');

            const child = spawn('npm', ['run', command], { cwd: rootDir });

            child.stdout.on('data', (data) => {
                controller.enqueue(encoder.encode(data.toString()));
            });

            child.stderr.on('data', (data) => {
                controller.enqueue(encoder.encode(data.toString()));
            });

            child.on('close', (code) => {
                controller.enqueue(encoder.encode(`\n[Process exited with code ${code}]\n`));
                controller.close();
            });

            child.on('error', (err) => {
                controller.enqueue(encoder.encode(`\n[Error: ${err.message}]\n`));
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        }
    });
}
