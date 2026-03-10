import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
    const publicDir = path.join(process.cwd(), 'public');
    const iconBlackPath = path.join(publicDir, 'icon_black.png');

    const size = 512;
    const postitColor = '#55ff00';
    const stripHeight = Math.floor(size * 0.2); // 20% top strip

    // Create base green square
    const base = sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: postitColor
        }
    });

    // Create black strip
    const strip = Buffer.from(
        `<svg width="${size}" height="${stripHeight}"><rect width="${size}" height="${stripHeight}" fill="rgba(0,0,0,0.1)"/></svg>`
    );

    // Read and resize black icon
    const icon = await sharp(iconBlackPath)
        .resize(Math.floor(size * 0.6), Math.floor(size * 0.6), { fit: 'contain' })
        .toBuffer();

    const composited = await base
        .composite([
            { input: strip, gravity: 'northeast' },
            { input: icon, gravity: 'center' },
            { input: Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="4"/></svg>`), gravity: 'center' }
        ])
        .png()
        .toBuffer();

    // Save Apple Touch Icon (180x180)
    await sharp(composited).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
    // Save standard favicons
    await sharp(composited).resize(192, 192).toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    await sharp(composited).resize(512, 512).toFile(path.join(publicDir, 'android-chrome-512x512.png'));
    await sharp(composited).resize(32, 32).toFile(path.join(publicDir, 'favicon-32x32.png'));
    await sharp(composited).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));

    // favicon.ico
    await sharp(composited).resize(64, 64).toFile(path.join(publicDir, 'favicon.ico'));

    console.log('Favicons generated successfully.');
}

generate().catch(console.error);
