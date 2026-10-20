import * as THREE from 'three';

export type PersonKind = 'tony' | 'alex';

function canvasFromTexture(tex: THREE.Texture): {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
} | null {
	const img = tex.image as
		| HTMLImageElement
		| ImageBitmap
		| HTMLCanvasElement
		| OffscreenCanvas
		| undefined;
	if (!img) return null;
	const w = 'width' in img ? Number(img.width) : 0;
	const h = 'height' in img ? Number(img.height) : 0;
	if (!w || !h) return null;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return null;
	ctx.drawImage(img as CanvasImageSource, 0, 0);
	return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, template: THREE.Texture): THREE.CanvasTexture {
	const out = new THREE.CanvasTexture(canvas);
	out.colorSpace = THREE.SRGBColorSpace;
	out.flipY = template.flipY;
	out.wrapS = template.wrapS;
	out.wrapT = template.wrapT;
	out.needsUpdate = true;
	return out;
}

/** Green sweater (Tony) / black leather (Alex); keep jeans + skin. */
function recolorBody(ctx: CanvasRenderingContext2D, kind: PersonKind) {
	const { width: w, height: h } = ctx.canvas;
	const id = ctx.getImageData(0, 0, w, h);
	const d = id.data;

	for (let p = 0; p < d.length; p += 4) {
		const i = p / 4;
		const x = i % w;
		const y = Math.floor(i / w);
		const u = x / w;
		const v = y / h;

		const r = d[p];
		const g = d[p + 1];
		const b = d[p + 2];
		const a = d[p + 3];
		if (a < 10 || r + g + b < 25) continue;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const sat = max === 0 ? 0 : (max - min) / max;
		const lum = 0.3 * r + 0.59 * g + 0.11 * b;

		const isJeans = b > r + 6 && b > g && b > 40 && sat > 0.1;
		if (isJeans) continue;

		if (kind === 'tony') {
			if (v > 0.62 && (u < 0.32 || u > 0.68)) continue;
			if (v > 0.78 && u > 0.3 && u < 0.7) continue;
			if (r > g && r > 70) {
				d[p] = Math.min(255, lum * 0.28 + 12);
				d[p + 1] = Math.min(255, lum * 0.62 + 18);
				d[p + 2] = Math.min(255, lum * 0.3 + 10);
			}
		} else {
			if (v < 0.24 && (u < 0.3 || u > 0.7)) continue;
			if (v > 0.18 && v < 0.38 && (u < 0.22 || u > 0.78) && lum < 90) continue;
			if (lum > 50) {
				const leather = Math.min(255, lum * 0.12 + (lum > 170 ? 22 : 5));
				d[p] = leather;
				d[p + 1] = Math.min(255, leather * 0.9);
				d[p + 2] = Math.min(255, leather * 0.85);
			}
		}
	}

	ctx.putImageData(id, 0, 0);
}

/** Tint hair islands only — leave face features intact. */
function tintHair(ctx: CanvasRenderingContext2D, kind: PersonKind) {
	const { width: w, height: h } = ctx.canvas;
	const id = ctx.getImageData(0, 0, w, h);
	const d = id.data;

	for (let p = 0; p < d.length; p += 4) {
		const r = d[p];
		const g = d[p + 1];
		const b = d[p + 2];
		const a = d[p + 3];
		if (a < 20 || r + g + b < 30) continue;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const sat = max === 0 ? 0 : (max - min) / max;
		const lum = 0.3 * r + 0.59 * g + 0.11 * b;

		// Skip skin / lips / eyes
		const isSkin = r > 110 && g > 70 && r >= g && g > b && r - b > 25 && sat < 0.5;
		if (isSkin) continue;
		if (lum > 200) continue; // sclera / teeth

		const isHair =
			lum > 20 &&
			lum < 170 &&
			sat > 0.05 &&
			sat < 0.7 &&
			!(r > 140 && g < 90 && b < 90); // lips

		if (!isHair) continue;

		if (kind === 'tony') {
			// Dark brown wavy
			const base = lum * 0.32;
			d[p] = Math.min(255, base + 18);
			d[p + 1] = Math.min(255, base * 0.75 + 8);
			d[p + 2] = Math.min(255, base * 0.5);
		} else {
			// Auburn / warm brown
			d[p] = Math.min(255, lum * 0.85 + 45);
			d[p + 1] = Math.min(255, lum * 0.42 + 22);
			d[p + 2] = Math.min(255, lum * 0.22 + 8);
		}
	}

	ctx.putImageData(id, 0, 0);
}

/** Clothes + hair tint. Heads stay fully visible. */
export async function styleAvatar(root: THREE.Object3D, kind: PersonKind): Promise<void> {
	root.updateMatrixWorld(true);

	// Clean up any leftover overlay plates from earlier experiments
	for (const name of ['LikenessPlate', 'PhotoFace', 'TonyGlasses', 'StylizedBust']) {
		const old = root.getObjectByName(name);
		if (old) old.parent?.remove(old);
	}

	root.traverse((obj) => {
		const mesh = obj as THREE.Mesh;
		if (!mesh.isMesh) return;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.visible = true;

		const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
		const next = mats.map((mat) => {
			if (!mat) return mat;
			const m = (mat as THREE.MeshStandardMaterial).clone() as THREE.MeshStandardMaterial;
			const name = (m.name || '').toLowerCase();

			m.visible = true;
			m.opacity = 1;
			m.transparent = name.includes('opacity');
			m.depthWrite = !name.includes('opacity');

			if (name.includes('body') && m.map) {
				const drawn = canvasFromTexture(m.map);
				if (drawn) {
					recolorBody(drawn.ctx, kind);
					m.map = toTexture(drawn.canvas, m.map);
				}
				if (kind === 'alex') {
					m.roughness = 0.42;
					m.metalness = 0.2;
					m.envMapIntensity = 0.9;
				} else {
					m.roughness = 0.78;
					m.metalness = 0;
					m.envMapIntensity = 0.55;
				}
			}

			if ((name.includes('head') || name.includes('opacity')) && m.map) {
				const drawn = canvasFromTexture(m.map);
				if (drawn) {
					tintHair(drawn.ctx, kind);
					m.map = toTexture(drawn.canvas, m.map);
				}
				m.roughness = name.includes('head') ? 0.58 : 0.85;
				m.envMapIntensity = 0.55;
			}

			m.needsUpdate = true;
			return m;
		});

		mesh.material = Array.isArray(mesh.material) ? next : next[0];
	});
}

/** Round glasses on Tony's head bone. */
export function attachTonyGlasses(root: THREE.Object3D) {
	if (root.getObjectByName('TonyGlasses')) return;
	const head = root.getObjectByName('Bip01 Head');
	if (!head) return;

	const group = new THREE.Group();
	group.name = 'TonyGlasses';

	const lEye = root.getObjectByName('Bip01 LEye');
	const rEye = root.getObjectByName('Bip01 REye');
	const mid = new THREE.Vector3();
	if (lEye && rEye) {
		const a = new THREE.Vector3();
		const b = new THREE.Vector3();
		lEye.getWorldPosition(a);
		rEye.getWorldPosition(b);
		mid.addVectors(a, b).multiplyScalar(0.5);
		head.worldToLocal(mid);
		mid.z += 0.015;
		group.position.copy(mid);
	} else {
		group.position.set(0, 0.05, 0.09);
	}

	const frame = new THREE.MeshStandardMaterial({
		color: '#c4a35a',
		metalness: 0.8,
		roughness: 0.28,
	});
	const lens = new THREE.MeshPhysicalMaterial({
		color: '#c8d8e4',
		roughness: 0.05,
		transmission: 0.85,
		thickness: 0.15,
		transparent: true,
		opacity: 0.2,
		metalness: 0,
	});

	const r = 0.027;
	for (const side of [-1, 1] as const) {
		const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0022, 8, 24), frame);
		rim.position.set(side * 0.032, 0, 0);
		group.add(rim);
		const glass = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 20), lens);
		glass.position.set(side * 0.032, 0, 0.001);
		group.add(glass);
	}
	const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.0022, 0.0022), frame);
	group.add(bridge);

	head.add(group);
}
