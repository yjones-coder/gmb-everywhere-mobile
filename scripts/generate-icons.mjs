import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sizes = [16, 32, 48, 128];
const color = '#4285f4'; // Google blue

for (const size of sizes) {
    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: color
        }
    })
        .png()
        .toFile(path.join(__dirname, '..', 'extension', 'icons', `icon${size}.png`));
}

console.log('Icons generated successfully');