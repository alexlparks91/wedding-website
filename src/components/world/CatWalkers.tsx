import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PLAN, PLAN_CENTERS } from './condoLayout';

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

function WanderingCat({
	kind,
	cx,
	cz,
	radiusX,
	radiusZ,
	selected,
	paused,
	onSelect,
}: {
	kind: CatKind;
	cx: number;
	cz: number;
	radiusX: number;
	radiusZ: number;
	selected: boolean;
	paused: boolean;
	onSelect?: (focus: CatFocus) => void;
}) {
	const root = useRef<THREE.Group>(null);
	const prev = useRef(new THREE.Vector3());
	const pausedPos = useRef<THREE.Vector3 | null>(null);
	const pausedRotY = useRef(0);

	useFrame(({ clock }) => {
		if (!root.current) return;

		if (paused) {
			if (!pausedPos.current) {
				pausedPos.current = root.current.position.clone();
				pausedRotY.current = root.current.rotation.y;
			}
			root.current.position.copy(pausedPos.current);
			// Face the street / camera-ish when focused
			root.current.rotation.y = Math.PI / 2;
			return;
		}

		pausedPos.current = null;
		const t = clock.elapsedTime * kind.speed + kind.phase;
		const x = cx + Math.cos(t) * radiusX + Math.sin(t * 0.37) * 0.15;
		const z = cz + Math.sin(t * 0.85 + kind.phase) * radiusZ;
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
		else v.set(cx, 0, cz);
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

/** Olive (tuxedo) & Neil (tabby) wandering the kitchen. */
export function KitchenCats({ selected = null, onSelect }: CatsProps) {
	const [cx, cz] = PLAN_CENTERS.kitchen;
	const k = PLAN.kitchen;
	const paused = selected === 'olive' || selected === 'neil';
	return (
		<group>
			<WanderingCat
				kind={CATS[0]}
				cx={cx - 0.2}
				cz={cz}
				radiusX={k.w * 0.22}
				radiusZ={k.d * 0.22}
				selected={selected === 'olive'}
				paused={paused}
				onSelect={onSelect}
			/>
			<WanderingCat
				kind={CATS[1]}
				cx={cx + 0.15}
				cz={cz + 0.1}
				radiusX={k.w * 0.2}
				radiusZ={k.d * 0.18}
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
