import * as THREE from 'three';

/**
 * Build a thickened, luminance-displaced mesh from a cutout image
 * so stylized art reads as a sculpted surface rather than a flat card.
 */
export function buildReliefGeometry(
	image: HTMLImageElement | ImageBitmap,
	planeW: number,
	planeH: number,
	thickness: number,
	segments = 48,
): THREE.BufferGeometry {
	const canvas = document.createElement('canvas');
	const tw = Math.min(256, Number(image.width) || 256);
	const th = Math.min(512, Number(image.height) || 512);
	canvas.width = tw;
	canvas.height = th;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.drawImage(image as CanvasImageSource, 0, 0, tw, th);
	const { data } = ctx.getImageData(0, 0, tw, th);

	const sample = (u: number, v: number) => {
		const x = Math.min(tw - 1, Math.max(0, Math.floor(u * (tw - 1))));
		const y = Math.min(th - 1, Math.max(0, Math.floor((1 - v) * (th - 1))));
		const i = (y * tw + x) * 4;
		const a = data[i + 3] / 255;
		const lum = (0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]) / 255;
		return { a, lum };
	};

	const segsX = segments;
	const segsY = Math.max(8, Math.round(segments * (planeH / planeW)));
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];

	const depthAt = (u: number, v: number) => {
		const { a, lum } = sample(u, v);
		if (a < 0.15) return null;
		return thickness * (0.35 + lum * 0.65) * a;
	};

	const idxOf = (ix: number, iy: number) => iy * (segsX + 1) + ix;
	const depthGrid: (number | null)[] = new Array((segsX + 1) * (segsY + 1));

	for (let iy = 0; iy <= segsY; iy++) {
		const v = iy / segsY;
		for (let ix = 0; ix <= segsX; ix++) {
			const u = ix / segsX;
			depthGrid[idxOf(ix, iy)] = depthAt(u, v);
		}
	}

	const dilated = depthGrid.slice();
	for (let iy = 0; iy <= segsY; iy++) {
		for (let ix = 0; ix <= segsX; ix++) {
			const i = idxOf(ix, iy);
			if (dilated[i] != null) continue;
			let best: number | null = null;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = ix + dx;
					const ny = iy + dy;
					if (nx < 0 || ny < 0 || nx > segsX || ny > segsY) continue;
					const d = depthGrid[idxOf(nx, ny)];
					if (d != null) best = best == null ? d * 0.45 : Math.max(best, d * 0.45);
				}
			}
			dilated[i] = best;
		}
	}

	const vertIndex: number[] = new Array((segsX + 1) * (segsY + 1)).fill(-1);
	let vertCount = 0;

	for (let iy = 0; iy <= segsY; iy++) {
		const v = iy / segsY;
		const y = (v - 0.5) * planeH;
		for (let ix = 0; ix <= segsX; ix++) {
			const u = ix / segsX;
			const d = dilated[idxOf(ix, iy)];
			if (d == null) continue;
			const x = (u - 0.5) * planeW;
			positions.push(x, y, d);
			uvs.push(u, v);
			vertIndex[idxOf(ix, iy)] = vertCount++;
		}
	}

	const addFace = (a: number, b: number, c: number) => {
		if (a < 0 || b < 0 || c < 0) return;
		indices.push(a, b, c);
	};

	for (let iy = 0; iy < segsY; iy++) {
		for (let ix = 0; ix < segsX; ix++) {
			const a = vertIndex[idxOf(ix, iy)];
			const b = vertIndex[idxOf(ix + 1, iy)];
			const c = vertIndex[idxOf(ix + 1, iy + 1)];
			const d = vertIndex[idxOf(ix, iy + 1)];
			addFace(a, b, d);
			addFace(b, c, d);
		}
	}

	const backStart = vertCount;
	const frontCount = vertCount;
	for (let i = 0; i < frontCount; i++) {
		positions.push(positions[i * 3], positions[i * 3 + 1], -thickness * 0.2);
		uvs.push(uvs[i * 2], uvs[i * 2 + 1]);
		vertCount++;
	}

	for (let iy = 0; iy < segsY; iy++) {
		for (let ix = 0; ix < segsX; ix++) {
			const a = vertIndex[idxOf(ix, iy)];
			const b = vertIndex[idxOf(ix + 1, iy)];
			const c = vertIndex[idxOf(ix + 1, iy + 1)];
			const d = vertIndex[idxOf(ix, iy + 1)];
			if (a < 0 || b < 0 || c < 0 || d < 0) continue;
			addFace(backStart + a, backStart + d, backStart + b);
			addFace(backStart + b, backStart + d, backStart + c);
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}
