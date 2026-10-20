import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type PersonKind = 'tony' | 'alex';

const SPRITES: Record<PersonKind, string> = {
	tony: '/avatars/refs/tony-full.png',
	alex: '/avatars/refs/alex-full.png',
};

/** Intrinsic pixel aspect (width/height) of the cutouts. */
const ASPECT: Record<PersonKind, number> = {
	tony: 395 / 1024,
	alex: 395 / 1024, // keep in sync with public/avatars/refs/*-full.png
};

type Props = {
	kind: PersonKind;
	height: number;
	selected?: boolean;
	onSelect?: () => void;
	idle?: boolean;
	paused?: boolean;
	showLabel?: boolean;
	label: { title: string; sub: string };
	phase?: number;
};

/**
 * Build a thickened, luminance-displaced mesh from a cutout so the stylized
 * art reads as a sculpted 3D avatar rather than a flat card.
 */
function buildReliefGeometry(
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
		// v=0 at top of texture in our sampling for head-up geometry
		const y = Math.min(th - 1, Math.max(0, Math.floor((1 - v) * (th - 1))));
		const i = (y * tw + x) * 4;
		const a = data[i + 3] / 255;
		const lum = (0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]) / 255;
		return { a, lum };
	};

	const segsX = segments;
	const segsY = Math.round(segments * (planeH / planeW));
	const positions: number[] = [];
	const normals: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];

	const depthAt = (u: number, v: number) => {
		const { a, lum } = sample(u, v);
		if (a < 0.15) return null;
		// Center pops forward; darker folds sink slightly — soft relief
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

	// Dilate depth so silhouette edges have neighbors for a rim
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
					if (d != null) best = best == null ? d * 0.4 : Math.max(best, d * 0.4);
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
			// provisional normal; recompute after
			normals.push(0, 0, 1);
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

	// Back cap (flat) for thickness when orbiting
	const backStart = vertCount;
	const frontCount = vertCount;
	for (let i = 0; i < frontCount; i++) {
		const x = positions[i * 3];
		const y = positions[i * 3 + 1];
		positions.push(x, y, -thickness * 0.15);
		uvs.push(uvs[i * 2], uvs[i * 2 + 1]);
		normals.push(0, 0, -1);
		vertCount++;
	}

	for (let iy = 0; iy < segsY; iy++) {
		for (let ix = 0; ix < segsX; ix++) {
			const a = vertIndex[idxOf(ix, iy)];
			const b = vertIndex[idxOf(ix + 1, iy)];
			const c = vertIndex[idxOf(ix + 1, iy + 1)];
			const d = vertIndex[idxOf(ix, iy + 1)];
			if (a < 0 || b < 0 || c < 0 || d < 0) continue;
			// back faces winding reversed
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

/**
 * Sculpted 3D avatar built from the stylized reference art.
 */
export function StylizedPerson({
	kind,
	height,
	selected,
	onSelect,
	idle = false,
	paused = false,
	showLabel = true,
	label,
	phase = 0,
}: Props) {
	const group = useRef<THREE.Group>(null);
	const { camera } = useThree();
	const map = useTexture(SPRITES[kind]);
	const [hovered, setHovered] = useState(false);

	useLayoutEffect(() => {
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		map.needsUpdate = true;
	}, [map]);

	const planeW = height * ASPECT[kind];
	const thickness = height * 0.12;
	const outline = !idle && (selected || hovered);

	const geometry = useMemo(() => {
		const img = map.image as HTMLImageElement | ImageBitmap | undefined;
		if (!img || !('width' in img)) {
			return new THREE.PlaneGeometry(planeW, height, 1, 1);
		}
		return buildReliefGeometry(img, planeW, height, thickness, 56);
	}, [map, map.image, planeW, height, thickness]);

	useFrame(({ clock }) => {
		if (!group.current) return;

		if (!idle) {
			const parent = group.current.parent;
			const camPos = new THREE.Vector3();
			const worldPos = new THREE.Vector3();
			camera.getWorldPosition(camPos);
			group.current.getWorldPosition(worldPos);
			const dx = camPos.x - worldPos.x;
			const dz = camPos.z - worldPos.z;
			const worldYaw = Math.atan2(dx, dz);

			if (parent) {
				const parentEuler = new THREE.Euler().setFromQuaternion(
					parent.getWorldQuaternion(new THREE.Quaternion()),
					'YXZ',
				);
				group.current.rotation.set(0, worldYaw - parentEuler.y, 0);
			} else {
				group.current.rotation.set(0, worldYaw, 0);
			}
		}

		if (idle || paused) {
			group.current.position.y = 0;
			group.current.rotation.z = 0;
		} else {
			const step = clock.elapsedTime * 3.2 + phase;
			const bob = Math.abs(Math.sin(step)) * 0.028;
			group.current.position.y = bob;
			// Subtle sway so the relief reads as walking, not sliding
			group.current.rotation.z = Math.sin(step) * 0.025;
		}
	});

	return (
		<group
			onClick={(e) => {
				e.stopPropagation();
				onSelect?.();
			}}
			onPointerOver={(e) => {
				if (idle) return;
				e.stopPropagation();
				document.body.style.cursor = 'pointer';
				setHovered(true);
			}}
			onPointerOut={() => {
				if (idle) return;
				document.body.style.cursor = 'auto';
				setHovered(false);
			}}
		>
			<group ref={group}>
				<mesh position={[0, height / 2, 0]} geometry={geometry} castShadow>
					<meshStandardMaterial
						map={map}
						transparent
						alphaTest={0.2}
						roughness={0.55}
						metalness={0.05}
						side={THREE.DoubleSide}
						envMapIntensity={0.6}
					/>
				</mesh>
			</group>

			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
				<circleGeometry args={[planeW * 0.38, 24]} />
				<meshBasicMaterial color="#1a1a1a" transparent opacity={0.25} />
			</mesh>

			{outline && (
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[planeW * 0.42, planeW * 0.55, 40]} />
					<meshBasicMaterial
						color={selected ? '#f0e6c8' : '#dfe8e2'}
						transparent
						opacity={0.9}
					/>
				</mesh>
			)}

			{showLabel && (
				<Html
					position={[0, height + 0.28, 0]}
					center
					distanceFactor={12}
					style={{ pointerEvents: 'none', userSelect: 'none' }}
				>
					<div className={`poi-label${selected ? ' is-selected' : ''}`}>
						<span className="poi-label__title">{label.title}</span>
						<span className="poi-label__sub">{label.sub}</span>
					</div>
				</Html>
			)}
		</group>
	);
}

useTexture.preload(SPRITES.tony);
useTexture.preload(SPRITES.alex);
