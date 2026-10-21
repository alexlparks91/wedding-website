import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { FT, PLAN } from './condoLayout';
import { DOOR } from './LivingDining';

export type CatId = 'olive' | 'neil';

export type CatFocus = {
	id: CatId;
	position: [number, number, number];
	height: number;
};

type CatKind = {
	id: CatId;
	name: string;
	sub: string;
	body: string;
	white: string;
	accent: string;
	ear: string;
	nose: string;
	phase: number;
	speed: number;
};

const CATS: CatKind[] = [
	{
		id: 'olive',
		name: 'Olive',
		sub: 'Tuxedo · Unit 2F',
		body: '#1a1a1c',
		white: '#f2f0eb',
		accent: '#2a2a2e',
		ear: '#f0c4c8',
		nose: '#e8a0a8',
		phase: 0.3,
		speed: 0.55,
	},
	{
		id: 'neil',
		name: 'Neil',
		sub: 'Tabby · Unit 2F',
		body: '#6b4423',
		white: '#c4b49a',
		accent: '#3d2410',
		ear: '#a07060',
		nose: '#8a5048',
		phase: 1.7,
		speed: 0.48,
	},
];

const CAT_HEIGHT = 0.38;

function CatMesh({
	kind,
	walking,
	selected,
}: {
	kind: CatKind;
	walking: boolean;
	selected: boolean;
}) {
	const body = useRef<THREE.Group>(null);
	const legFL = useRef<THREE.Mesh>(null);
	const legFR = useRef<THREE.Mesh>(null);
	const legBL = useRef<THREE.Mesh>(null);
	const legBR = useRef<THREE.Mesh>(null);
	const tail = useRef<THREE.Mesh>(null);

	useFrame(({ clock }) => {
		const t = clock.elapsedTime;
		const gait = walking ? Math.sin(t * 10 + kind.phase) : Math.sin(t * 2 + kind.phase) * 0.15;
		if (body.current) {
			body.current.position.y = walking ? 0.02 + Math.abs(gait) * 0.015 : 0.02;
		}
		const swing = walking ? gait * 0.55 : gait * 0.08;
		if (legFL.current) legFL.current.rotation.x = swing;
		if (legBR.current) legBR.current.rotation.x = swing;
		if (legFR.current) legFR.current.rotation.x = -swing;
		if (legBL.current) legBL.current.rotation.x = -swing;
		if (tail.current) {
			tail.current.rotation.z = 0.4 + Math.sin(t * 2.2 + kind.phase) * 0.35;
			tail.current.rotation.y = Math.sin(t * 1.4 + kind.phase) * 0.25;
		}
	});

	const isOlive = kind.id === 'olive';
	const s = 0.85;

	return (
		<group scale={s}>
			<group ref={body}>
				<mesh position={[0, 0.16, 0]} castShadow>
					<boxGeometry args={[0.22, 0.14, 0.34]} />
					<meshStandardMaterial color={kind.body} roughness={0.85} />
				</mesh>
				<mesh position={[0, 0.11, 0.02]} castShadow>
					<boxGeometry args={[0.16, 0.08, 0.26]} />
					<meshStandardMaterial color={kind.white} roughness={0.9} />
				</mesh>
				{isOlive && (
					<mesh position={[0, 0.15, 0.12]} castShadow>
						<boxGeometry args={[0.1, 0.1, 0.08]} />
						<meshStandardMaterial color={kind.white} roughness={0.9} />
					</mesh>
				)}
				{!isOlive &&
					[-0.08, 0, 0.08].map((z, i) => (
						<mesh key={i} position={[0, 0.235, z]} castShadow>
							<boxGeometry args={[0.2, 0.02, 0.04]} />
							<meshStandardMaterial color={kind.accent} roughness={0.85} />
						</mesh>
					))}

				<mesh position={[0, 0.26, 0.2]} castShadow>
					<boxGeometry args={[0.16, 0.14, 0.14]} />
					<meshStandardMaterial color={kind.body} roughness={0.85} />
				</mesh>
				<mesh position={[0, 0.22, 0.28]} castShadow>
					<boxGeometry args={[0.1, 0.07, 0.06]} />
					<meshStandardMaterial color={kind.white} roughness={0.9} />
				</mesh>
				{isOlive && (
					<mesh position={[0, 0.28, 0.26]} castShadow>
						<boxGeometry args={[0.06, 0.08, 0.04]} />
						<meshStandardMaterial color={kind.white} roughness={0.9} />
					</mesh>
				)}
				{!isOlive && (
					<mesh position={[0, 0.32, 0.22]} castShadow>
						<boxGeometry args={[0.04, 0.04, 0.12]} />
						<meshStandardMaterial color={kind.accent} roughness={0.85} />
					</mesh>
				)}
				<mesh position={[0, 0.23, 0.32]}>
					<boxGeometry args={[0.03, 0.02, 0.02]} />
					<meshStandardMaterial color={kind.nose} roughness={0.6} />
				</mesh>
				<mesh position={[-0.04, 0.28, 0.27]}>
					<boxGeometry args={[0.03, 0.025, 0.02]} />
					<meshStandardMaterial color="#1a3a1a" roughness={0.3} />
				</mesh>
				<mesh position={[0.04, 0.28, 0.27]}>
					<boxGeometry args={[0.03, 0.025, 0.02]} />
					<meshStandardMaterial color="#1a3a1a" roughness={0.3} />
				</mesh>
				<mesh position={[-0.055, 0.36, 0.18]} castShadow>
					<boxGeometry args={[0.05, 0.06, 0.04]} />
					<meshStandardMaterial color={kind.body} roughness={0.85} />
				</mesh>
				<mesh position={[-0.055, 0.35, 0.19]}>
					<boxGeometry args={[0.03, 0.04, 0.02]} />
					<meshStandardMaterial color={kind.ear} roughness={0.9} />
				</mesh>
				<mesh position={[0.055, 0.36, 0.18]} castShadow>
					<boxGeometry args={[0.05, 0.06, 0.04]} />
					<meshStandardMaterial color={isOlive ? kind.white : kind.body} roughness={0.85} />
				</mesh>
				<mesh position={[0.055, 0.35, 0.19]}>
					<boxGeometry args={[0.03, 0.04, 0.02]} />
					<meshStandardMaterial color={kind.ear} roughness={0.9} />
				</mesh>
				<mesh ref={tail} position={[0, 0.22, -0.2]} castShadow>
					<boxGeometry args={[0.04, 0.04, 0.22]} />
					<meshStandardMaterial color={isOlive ? kind.white : kind.body} roughness={0.85} />
				</mesh>
			</group>

			{(
				[
					[legFL, -0.07, 0.1],
					[legFR, 0.07, 0.1],
					[legBL, -0.07, -0.1],
					[legBR, 0.07, -0.1],
				] as const
			).map(([ref, x, z], i) => (
				<mesh key={i} ref={ref} position={[x, 0.06, z]} castShadow>
					<boxGeometry args={[0.05, 0.12, 0.05]} />
					<meshStandardMaterial
						color={isOlive && i < 2 ? kind.white : kind.body}
						roughness={0.85}
					/>
				</mesh>
			))}

			{/* Invisible click target (must stay visible for raycasting) */}
			<mesh position={[0, 0.18, 0]}>
				<boxGeometry args={[0.35, 0.45, 0.5]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>

			{selected && (
				<mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[0.22, 0.3, 32]} />
					<meshBasicMaterial color="#f0e6c8" transparent opacity={0.9} />
				</mesh>
			)}
		</group>
	);
}

type RoomRect = {
	cx: number;
	cz: number;
	rx: number;
	rz: number;
};

type CondoWalk = {
	kitchen: RoomRect;
	living: RoomRect;
	doorX0: number;
	doorX1: number;
	doorZ: number;
};

function WanderingCat({
	kind,
	walk,
	selected,
	paused,
	onSelect,
}: {
	kind: CatKind;
	walk: CondoWalk;
	selected: boolean;
	paused: boolean;
	onSelect?: (focus: CatFocus) => void;
}) {
	const root = useRef<THREE.Group>(null);
	const prev = useRef(new THREE.Vector3());
	const pausedPos = useRef<THREE.Vector3 | null>(null);

	useFrame(({ clock }) => {
		if (!root.current) return;

		if (paused) {
			if (!pausedPos.current) {
				pausedPos.current = root.current.position.clone();
			}
			root.current.position.copy(pausedPos.current);
			root.current.rotation.y = Math.PI / 2;
			return;
		}

		pausedPos.current = null;
		const t = clock.elapsedTime * kind.speed + kind.phase;
		/** Slow cycle: kitchen → door → living → door → kitchen */
		const cycle = (t * 0.09 + kind.phase * 0.2) % 1;
		const local = t * 1.35;
		const { kitchen: k, living: L, doorX0, doorX1, doorZ } = walk;
		const doorMid = (doorX0 + doorX1) / 2;
		const doorHalf = (doorX1 - doorX0) * 0.35;

		let x: number;
		let z: number;
		if (cycle < 0.38) {
			// Kitchen loop
			const u = (cycle / 0.38) * Math.PI * 2;
			x = k.cx + Math.cos(u + kind.phase) * k.rx;
			z = k.cz + Math.sin(u * 0.9 + kind.phase) * k.rz;
		} else if (cycle < 0.5) {
			// Kitchen → living through doorway
			const a = (cycle - 0.38) / 0.12;
			x = THREE.MathUtils.lerp(k.cx, doorMid, Math.min(1, a * 1.4)) + Math.sin(local) * doorHalf * 0.3;
			x = THREE.MathUtils.clamp(x, doorX0 + 0.12, doorX1 - 0.12);
			z = THREE.MathUtils.lerp(k.cz - k.rz * 0.6, L.cz + L.rz * 0.55, a);
		} else if (cycle < 0.88) {
			// Living loop
			const u = ((cycle - 0.5) / 0.38) * Math.PI * 2;
			x = L.cx + Math.cos(u + kind.phase) * L.rx;
			z = L.cz + Math.sin(u * 0.95 + kind.phase) * L.rz;
		} else {
			// Living → kitchen through doorway
			const a = (cycle - 0.88) / 0.12;
			x = THREE.MathUtils.lerp(L.cx, doorMid, Math.min(1, a * 1.4)) + Math.sin(local) * doorHalf * 0.3;
			x = THREE.MathUtils.clamp(x, doorX0 + 0.12, doorX1 - 0.12);
			z = THREE.MathUtils.lerp(L.cz + L.rz * 0.55, k.cz - k.rz * 0.6, a);
		}

		prev.current.copy(root.current.position);
		root.current.position.set(x, 0, z);
		const dx = x - prev.current.x;
		const dz = z - prev.current.z;
		if (Math.hypot(dx, dz) > 0.0004) {
			root.current.rotation.y = Math.atan2(dx, dz);
		}
	});

	function focus(): CatFocus {
		const v = new THREE.Vector3();
		if (root.current) root.current.getWorldPosition(v);
		else v.set(walk.kitchen.cx, 0, walk.kitchen.cz);
		return {
			id: kind.id,
			position: [v.x, CAT_HEIGHT * 0.7, v.z],
			height: CAT_HEIGHT,
		};
	}

	return (
		<group
			ref={root}
			onClick={(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				onSelect?.(focus());
			}}
			onPointerOver={() => {
				document.body.style.cursor = 'pointer';
			}}
			onPointerOut={() => {
				document.body.style.cursor = 'auto';
			}}
		>
			<CatMesh kind={kind} walking={!paused} selected={selected} />
		</group>
	);
}

type CatsProps = {
	selected?: CatId | null;
	onSelect?: (focus: CatFocus) => void;
};

/** Living depth — match LivingDining */
const LIVING_DEPTH = (22 + 6 / 12) * FT;
const MARGIN = 0.45;

/** Olive (tuxedo) & Neil (tabby) — kitchen & living only, via doorway. */
export function KitchenCats({ selected = null, onSelect }: CatsProps) {
	const k = PLAN.kitchen;
	const livingEast = DOOR.x1 - MARGIN;
	const livingWest = DOOR.x1 - PLAN.living.w + MARGIN;
	const livingFarZ = DOOR.z - LIVING_DEPTH + MARGIN;
	const livingNearZ = DOOR.z - MARGIN;

	const walk: CondoWalk = {
		kitchen: {
			cx: k.x + k.w * 0.5,
			cz: k.z + k.d * 0.5,
			rx: k.w * 0.5 - MARGIN,
			rz: k.d * 0.5 - MARGIN,
		},
		living: {
			cx: (livingWest + livingEast) / 2,
			cz: (livingFarZ + livingNearZ) / 2,
			rx: (livingEast - livingWest) / 2,
			rz: (livingNearZ - livingFarZ) / 2,
		},
		doorX0: DOOR.x0,
		doorX1: DOOR.x1,
		doorZ: DOOR.z,
	};

	const paused = selected === 'olive' || selected === 'neil';
	return (
		<group>
			<WanderingCat
				kind={CATS[0]}
				walk={walk}
				selected={selected === 'olive'}
				paused={paused}
				onSelect={onSelect}
			/>
			<WanderingCat
				kind={CATS[1]}
				walk={walk}
				selected={selected === 'neil'}
				paused={paused}
				onSelect={onSelect}
			/>
		</group>
	);
}

export function isCatId(id: string | null | undefined): id is CatId {
	return id === 'olive' || id === 'neil';
}
