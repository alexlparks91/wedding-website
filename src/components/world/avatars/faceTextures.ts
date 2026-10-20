import * as THREE from 'three';

export type FaceKind = 'tony' | 'alex';

/**
 * Paint a front-facing human face onto a canvas, then wrap as a Sphere UV map.
 * SphereGeometry UVs: front of the head sits near u ≈ 0.5.
 */
export function createFaceTexture(kind: FaceKind): THREE.CanvasTexture {
	const size = 1024;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	if (kind === 'tony') paintTony(ctx, size);
	else paintAlex(ctx, size);

	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 8;
	tex.needsUpdate = true;
	return tex;
}

export function createSkinRoughnessMap(kind: FaceKind): THREE.CanvasTexture {
	const size = 512;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// Higher roughness on cheeks / forehead variation
	ctx.fillStyle = '#b0b0b0';
	ctx.fillRect(0, 0, size, size);

	const g = ctx.createRadialGradient(size * 0.5, size * 0.42, 20, size * 0.5, size * 0.42, size * 0.35);
	g.addColorStop(0, '#888888'); // glossier T-zone / lips area
	g.addColorStop(1, '#c8c8c8');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, size, size);

	// Lips glossier
	ctx.fillStyle = '#666666';
	ellipse(ctx, size * 0.5, size * 0.62, size * 0.08, size * 0.03);
	ctx.fill();

	if (kind === 'tony') {
		// beard zone matte
		ctx.fillStyle = '#d8d8d8';
		ellipse(ctx, size * 0.5, size * 0.68, size * 0.22, size * 0.18);
		ctx.fill();
	}

	const tex = new THREE.CanvasTexture(canvas);
	tex.needsUpdate = true;
	return tex;
}

function paintTony(ctx: CanvasRenderingContext2D, size: number) {
	const skin = '#e2b892';
	const skinDeep = '#c8946e';
	const skinCheek = '#d9a484';

	ctx.fillStyle = skin;
	ctx.fillRect(0, 0, size, size);

	// Soft cheek warmth
	softBlob(ctx, size * 0.38, size * 0.48, size * 0.12, 'rgba(210,120,100,0.22)');
	softBlob(ctx, size * 0.62, size * 0.48, size * 0.12, 'rgba(210,120,100,0.22)');
	softBlob(ctx, size * 0.5, size * 0.55, size * 0.16, 'rgba(180,110,80,0.12)');

	// Forehead shade
	softBlob(ctx, size * 0.5, size * 0.28, size * 0.2, 'rgba(160,110,80,0.15)');

	// Jaw / under-beard skin tone
	softBlob(ctx, size * 0.5, size * 0.72, size * 0.22, 'rgba(140,90,60,0.2)');

	drawEyes(ctx, size, {
		iris: '#5a3a28',
		brow: '#1a1210',
		browThick: 14,
		eyeY: 0.42,
		eyeSpread: 0.11,
		eyeW: 0.055,
		eyeH: 0.028,
	});

	// Nose bridge + tip
	softBlob(ctx, size * 0.5, size * 0.5, size * 0.04, 'rgba(160,100,70,0.25)');
	softBlob(ctx, size * 0.5, size * 0.54, size * 0.035, 'rgba(120,70,45,0.3)');
	ctx.fillStyle = skinDeep;
	ellipse(ctx, size * 0.5, size * 0.545, size * 0.028, size * 0.022);
	ctx.fill();
	ctx.fillStyle = 'rgba(90,50,30,0.35)';
	ellipse(ctx, size * 0.47, size * 0.55, size * 0.01, size * 0.008);
	ctx.fill();
	ellipse(ctx, size * 0.53, size * 0.55, size * 0.01, size * 0.008);
	ctx.fill();

	// Lips (mostly covered by beard but visible)
	ctx.fillStyle = '#9a5a55';
	ellipse(ctx, size * 0.5, size * 0.62, size * 0.055, size * 0.018);
	ctx.fill();
	ctx.fillStyle = '#b87068';
	ellipse(ctx, size * 0.5, size * 0.615, size * 0.05, size * 0.01);
	ctx.fill();

	// Full dark beard painted onto face (no big 3D beard blobs in front)
	paintBeard(ctx, size);

	// Soft hairline only — keep forehead/eyes clear
	softBlob(ctx, size * 0.5, size * 0.06, size * 0.28, 'rgba(26,18,16,0.85)');
	softBlob(ctx, size * 0.28, size * 0.18, size * 0.12, 'rgba(26,18,16,0.55)');
	softBlob(ctx, size * 0.72, size * 0.18, size * 0.12, 'rgba(26,18,16,0.55)');

	void skinCheek;
}

function paintAlex(ctx: CanvasRenderingContext2D, size: number) {
	const skin = '#f0d0ba';

	ctx.fillStyle = skin;
	ctx.fillRect(0, 0, size, size);

	// Rosy cheeks
	softBlob(ctx, size * 0.36, size * 0.5, size * 0.11, 'rgba(230,130,120,0.28)');
	softBlob(ctx, size * 0.64, size * 0.5, size * 0.11, 'rgba(230,130,120,0.28)');
	softBlob(ctx, size * 0.5, size * 0.58, size * 0.14, 'rgba(220,140,120,0.12)');

	drawEyes(ctx, size, {
		iris: '#4a7a9a',
		brow: '#6b3826',
		browThick: 9,
		eyeY: 0.43,
		eyeSpread: 0.105,
		eyeW: 0.052,
		eyeH: 0.03,
	});

	// Nose
	softBlob(ctx, size * 0.5, size * 0.51, size * 0.035, 'rgba(200,140,110,0.3)');
	softBlob(ctx, size * 0.5, size * 0.545, size * 0.03, 'rgba(170,110,85,0.28)');
	ctx.fillStyle = '#e0b49a';
	ellipse(ctx, size * 0.5, size * 0.55, size * 0.024, size * 0.018);
	ctx.fill();
	ctx.fillStyle = 'rgba(140,80,55,0.28)';
	ellipse(ctx, size * 0.475, size * 0.555, size * 0.009, size * 0.007);
	ctx.fill();
	ellipse(ctx, size * 0.525, size * 0.555, size * 0.009, size * 0.007);
	ctx.fill();

	// Fuller lips
	ctx.fillStyle = '#c45a68';
	ellipse(ctx, size * 0.5, size * 0.635, size * 0.07, size * 0.028);
	ctx.fill();
	ctx.fillStyle = '#e07a88';
	ellipse(ctx, size * 0.5, size * 0.628, size * 0.065, size * 0.014);
	ctx.fill();
	ctx.strokeStyle = 'rgba(120,40,50,0.35)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(size * 0.43, size * 0.635);
	ctx.quadraticCurveTo(size * 0.5, size * 0.645, size * 0.57, size * 0.635);
	ctx.stroke();

	// Freckles
	ctx.fillStyle = 'rgba(180,110,80,0.55)';
	const freckles = [
		[0.4, 0.5],
		[0.42, 0.53],
		[0.38, 0.52],
		[0.6, 0.5],
		[0.58, 0.53],
		[0.62, 0.52],
		[0.5, 0.56],
		[0.47, 0.54],
		[0.53, 0.54],
		[0.44, 0.48],
		[0.56, 0.48],
		[0.35, 0.48],
		[0.65, 0.49],
	];
	for (const [u, v] of freckles) {
		ellipse(ctx, size * u, size * v, 2.2 + Math.random() * 1.5, 2);
		ctx.fill();
	}

	// Soft hairline
	ctx.fillStyle = '#6b3826';
	ctx.beginPath();
	ctx.ellipse(size * 0.5, size * 0.05, size * 0.4, size * 0.12, 0, 0, Math.PI * 2);
	ctx.fill();
}

function drawEyes(
	ctx: CanvasRenderingContext2D,
	size: number,
	opts: {
		iris: string;
		brow: string;
		browThick: number;
		eyeY: number;
		eyeSpread: number;
		eyeW: number;
		eyeH: number;
	},
) {
	const { iris, brow, browThick, eyeY, eyeSpread, eyeW, eyeH } = opts;

	for (const side of [-1, 1]) {
		const cx = size * (0.5 + side * eyeSpread);
		const cy = size * eyeY;

		// Socket shade
		softBlob(ctx, cx, cy, size * 0.06, 'rgba(120,80,60,0.18)');

		// Sclera
		ctx.fillStyle = '#f4f0ea';
		ellipse(ctx, cx, cy, size * eyeW, size * eyeH);
		ctx.fill();

		// Iris
		const ig = ctx.createRadialGradient(cx, cy, 1, cx, cy, size * eyeW * 0.55);
		ig.addColorStop(0, '#1a1a1a');
		ig.addColorStop(0.35, iris);
		ig.addColorStop(0.75, iris);
		ig.addColorStop(1, '#1a1a1a');
		ctx.fillStyle = ig;
		ellipse(ctx, cx, cy + 1, size * eyeW * 0.55, size * eyeH * 0.85);
		ctx.fill();

		// Pupil
		ctx.fillStyle = '#0a0a0a';
		ellipse(ctx, cx, cy + 1, size * 0.012, size * 0.012);
		ctx.fill();

		// Specular catchlight
		ctx.fillStyle = 'rgba(255,255,255,0.9)';
		ellipse(ctx, cx - size * 0.01, cy - size * 0.008, 3.5, 3.5);
		ctx.fill();
		ctx.fillStyle = 'rgba(255,255,255,0.45)';
		ellipse(ctx, cx + size * 0.008, cy + size * 0.006, 2, 2);
		ctx.fill();

		// Upper lid
		ctx.strokeStyle = 'rgba(60,30,20,0.55)';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.ellipse(cx, cy, size * eyeW, size * eyeH, 0, Math.PI * 1.05, Math.PI * 1.95);
		ctx.stroke();

		// Lower lid soft
		ctx.strokeStyle = 'rgba(160,100,80,0.35)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.ellipse(cx, cy, size * eyeW, size * eyeH, 0, 0.15, Math.PI * 0.85);
		ctx.stroke();

		// Brow
		ctx.strokeStyle = brow;
		ctx.lineWidth = browThick;
		ctx.lineCap = 'round';
		ctx.beginPath();
		const browY = cy - size * 0.045;
		ctx.moveTo(cx - side * size * 0.01 - size * 0.04, browY + 2);
		ctx.quadraticCurveTo(cx, browY - 4, cx + side * size * 0.02 + size * 0.04, browY + 3);
		ctx.stroke();
	}
}

function paintBeard(ctx: CanvasRenderingContext2D, size: number) {
	const hair = '#1c1410';
	const hairLight = '#2a2018';

	// Main beard mass
	ctx.fillStyle = hair;
	ctx.beginPath();
	ctx.moveTo(size * 0.28, size * 0.52);
	ctx.quadraticCurveTo(size * 0.22, size * 0.62, size * 0.28, size * 0.78);
	ctx.quadraticCurveTo(size * 0.5, size * 0.92, size * 0.72, size * 0.78);
	ctx.quadraticCurveTo(size * 0.78, size * 0.62, size * 0.72, size * 0.52);
	ctx.quadraticCurveTo(size * 0.62, size * 0.58, size * 0.5, size * 0.56);
	ctx.quadraticCurveTo(size * 0.38, size * 0.58, size * 0.28, size * 0.52);
	ctx.fill();

	// Mustache
	ctx.beginPath();
	ctx.moveTo(size * 0.38, size * 0.58);
	ctx.quadraticCurveTo(size * 0.5, size * 0.64, size * 0.62, size * 0.58);
	ctx.quadraticCurveTo(size * 0.58, size * 0.68, size * 0.5, size * 0.7);
	ctx.quadraticCurveTo(size * 0.42, size * 0.68, size * 0.38, size * 0.58);
	ctx.fill();

	// Strand noise
	ctx.strokeStyle = hairLight;
	ctx.lineWidth = 1.2;
	for (let i = 0; i < 80; i++) {
		const x = size * (0.3 + Math.random() * 0.4);
		const y = size * (0.55 + Math.random() * 0.3);
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + (Math.random() - 0.5) * 8, y + 6 + Math.random() * 10);
		ctx.stroke();
	}

	// Keep mouth gap slightly open in beard
	ctx.fillStyle = '#9a5a55';
	ellipse(ctx, size * 0.5, size * 0.655, size * 0.04, size * 0.012);
	ctx.fill();
}

function softBlob(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	r: number,
	color: string,
) {
	const g = ctx.createRadialGradient(x, y, 0, x, y, r);
	g.addColorStop(0, color);
	g.addColorStop(1, 'rgba(0,0,0,0)');
	ctx.fillStyle = g;
	ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function ellipse(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	rx: number,
	ry: number,
) {
	ctx.beginPath();
	ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}
