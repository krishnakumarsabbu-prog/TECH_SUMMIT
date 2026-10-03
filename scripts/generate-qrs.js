// Node.js script to generate QR codes for all 9 booths
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://krishnakumarsabbu-prog.github.io/TECH_SUMMIT/';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'qr-codes');
const ROOT_QR_DIR = path.join(__dirname, '..', 'qr-codes');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ROOT_QR_DIR)) {
  fs.mkdirSync(ROOT_QR_DIR, { recursive: true });
}

const BOOTHS = [
  { number: 1, title: 'Generative AI & LLMs' },
  { number: 2, title: 'Cloud Native & Kubernetes' },
  { number: 3, title: 'Cybersecurity & Zero Trust' },
  { number: 4, title: 'Data Engineering & Lakehouse' },
  { number: 5, title: 'DevOps, SRE & CI/CD' },
  { number: 6, title: 'Software Architecture & APIs' },
  { number: 7, title: 'IoT & Edge Computing' },
  { number: 8, title: 'Web3 & Distributed Ledgers' },
  { number: 9, title: 'Quantum & Emerging Horizons' },
];

async function generateAll() {
  console.log('Generating QR codes for 9 Booths...\n');

  for (const booth of BOOTHS) {
    const boothUrl = `${BASE_URL}?booth=${booth.number}`;
    const pngName = `booth-${booth.number}.png`;
    const svgName = `booth-${booth.number}.svg`;

    // High resolution PNG for standee printing (width 1024)
    const pngPathPublic = path.join(OUTPUT_DIR, pngName);
    const pngPathRoot = path.join(ROOT_QR_DIR, pngName);
    await QRCode.toFile(pngPathPublic, boothUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#B3192B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    fs.copyFileSync(pngPathPublic, pngPathRoot);

    // Vector SVG
    const svgPathPublic = path.join(OUTPUT_DIR, svgName);
    const svgPathRoot = path.join(ROOT_QR_DIR, svgName);
    await QRCode.toFile(svgPathPublic, boothUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#B3192B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    fs.copyFileSync(svgPathPublic, svgPathRoot);

    console.log(`✓ Booth ${booth.number}: ${booth.title} -> ${boothUrl}`);
  }

  console.log('\nAll 9 QR codes successfully generated in public/qr-codes/ and qr-codes/!');
}

generateAll().catch(console.error);
