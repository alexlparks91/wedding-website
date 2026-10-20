/**
 * Crop Tony / Alex face+hair stills from the couple selfie for avatar likeness.
 * Run: node scripts/crop-portraits.mjs
 */
import { execFileSync } from 'child_process';
import { mkdirSync } from 'fs';

mkdirSync('public/avatars/refs', { recursive: true });

const src = 'public/avatars/refs/couple-face.jpg';
// Source is 1024×768. Crops include hair volume (Tony) and long hair (Alex).
const crops = [
	// Tony — left: hair crown through beard
	{ out: 'public/avatars/refs/tony-portrait.jpg', x: 70, y: 20, w: 400, h: 560 },
	// Alex — right: long wavy hair through chin
	{ out: 'public/avatars/refs/alex-portrait.jpg', x: 500, y: 10, w: 420, h: 620 },
];

for (const c of crops) {
	execFileSync('sips', [
		'-c',
		String(c.h),
		String(c.w),
		'--cropOffset',
		String(c.y),
		String(c.x),
		src,
		'--out',
		c.out,
	]);
	console.log('wrote', c.out);
}
