import { useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { FaceKind } from './faceTextures';

export type AvatarKind = FaceKind;

type Props = {
	kind: AvatarKind;
	height: number;
	selected?: boolean;
	onSelect?: () => void;
	idle?: boolean;
	paused?: boolean;
	showLabel?: boolean;
	phase?: number;
	label: { title: string; sub: string };
};

const TONY = {
	skin: '#e2b892',
	skinShadow: '#c8946e',
	hair: '#1a1210',
	hairLit: '#2a2018',
	beard: '#1c1410',
	sweater: '#2f4a38',
	sweaterDark: '#243a2c',
	undershirt: '#f2f2f0',
	jeans: '#4a6a8a',
	jeansDark: '#3a5570',
	shoes: '#f5f5f5',
	shoeSole: '#e8e8e8',
	glasses: '#c4a35a',
};

const ALEX = {
	skin: '#f0d0ba',
	skinShadow: '#e0b49a',
	hair: '#6b3826',
	hairLit: '#8a4a32',
	hairDark: '#4a2818',
	leather: '#1a1a1a',
	leatherHi: '#2e2e2e',
	tee: '#f4f4f2',
	jeans: '#6a8aac',
	jeansDark: '#557090',
	shoes: '#f5f5f5',
	shoeStripe: '#1a1a1a',
	shoeSole: '#c4a882',
};

/** Flatter materials so people share the town’s game-world lighting response. */
function SkinMaterial({
	color,
	map,
	roughnessMap,
}: {
	kind?: FaceKind;
	color: string;
	map?: THREE.Texture | null;
	roughnessMap?: THREE.Texture | null;
}) {
	return (
		<meshStandardMaterial
			color={color}
			map={map ?? undefined}
			roughnessMap={roughnessMap ?? undefined}
			roughness={map ? 0.62 : 0.72}
			metalness={0}
			envMapIntensity={0.28}
		/>
	);
}

/**
 * True 3D volumetric walkers — capsule limbs, painted faces, styled to match
 * the couple reference (green sweater / leather jacket, jeans, sneakers).
 */
export function HighFidelityPerson({
	kind,
	height,
	selected,
	onSelect,
	idle = false,
	paused = false,
	showLabel = true,
	phase = 0,
	label,
}: Props) {
	const root = useRef<THREE.Group>(null);
	const hip = useRef<THREE.Group>(null);
	const leftThigh = useRef<THREE.Group>(null);
	const rightThigh = useRef<THREE.Group>(null);
	const leftShin = useRef<THREE.Group>(null);
	const rightShin = useRef<THREE.Group>(null);
	const leftUpperArm = useRef<THREE.Group>(null);
	const rightUpperArm = useRef<THREE.Group>(null);
	const leftFore = useRef<THREE.Group>(null);
	const rightFore = useRef<THREE.Group>(null);
	const [hovered, setHovered] = useState(false);

	const s = height / 1.78;
	const isTony = kind === 'tony';
	// Tony is lankier; Alex more athletic/compact in width
	const slim = isTony ? 0.86 : 0.92;

	const hipY = 0.92 * s;
	const shoulderY = 1.38 * s;
	const headY = 1.58 * s;
	const headR = (isTony ? 0.122 : 0.116) * s;

	useFrame(({ clock }) => {
		const t = clock.elapsedTime;

		if (idle) {
			if (root.current) root.current.rotation.y = t * 0.5;
			const breathe = Math.sin(t * 2) * 0.012;
			if (hip.current) hip.current.position.y = breathe;
			poseIdle(leftThigh, rightThigh, leftUpperArm, rightUpperArm, leftFore, rightFore);
			return;
		}

		if (paused) {
			if (hip.current) hip.current.position.y = 0;
			poseIdle(leftThigh, rightThigh, leftUpperArm, rightUpperArm, leftFore, rightFore);
			return;
		}

		const walk = t * 3.2 + phase;
		const swing = Math.sin(walk) * 0.55;
		const swingOpp = -swing;
		if (leftThigh.current) leftThigh.current.rotation.x = swing;
		if (rightThigh.current) rightThigh.current.rotation.x = swingOpp;
		if (leftShin.current)
			leftShin.current.rotation.x = Math.max(0, -Math.sin(walk) * 0.45);
		if (rightShin.current)
			rightShin.current.rotation.x = Math.max(0, Math.sin(walk) * 0.45);
		if (leftUpperArm.current) leftUpperArm.current.rotation.x = swingOpp * 0.7;
		if (rightUpperArm.current) rightUpperArm.current.rotation.x = swing * 0.7;
		if (leftFore.current) leftFore.current.rotation.x = 0.25 + Math.abs(swing) * 0.2;
		if (rightFore.current) rightFore.current.rotation.x = 0.25 + Math.abs(swingOpp) * 0.2;
		if (hip.current) hip.current.position.y = Math.abs(Math.sin(walk)) * 0.03;
	});

	const outline = !idle && (selected || hovered);
	const jeans = isTony ? TONY.jeans : ALEX.jeans;

	return (
		<group
			ref={root}
			scale={[slim, 1, slim]}
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
			<group ref={hip}>
				{/* Legs — jeans for both */}
				<group ref={leftThigh} position={[-0.09 * s, hipY, 0]}>
					<mesh position={[0, -0.2 * s, 0]} castShadow>
						<capsuleGeometry args={[0.065 * s, 0.28 * s, 8, 16]} />
						<meshStandardMaterial color={jeans} roughness={0.88} />
					</mesh>
					<group ref={leftShin} position={[0, -0.4 * s, 0]}>
						<mesh position={[0, -0.18 * s, 0]} castShadow>
							<capsuleGeometry args={[0.052 * s, 0.26 * s, 8, 16]} />
							<meshStandardMaterial color={jeans} roughness={0.88} />
						</mesh>
						<Shoe s={s} kind={kind} />
					</group>
				</group>

				<group ref={rightThigh} position={[0.09 * s, hipY, 0]}>
					<mesh position={[0, -0.2 * s, 0]} castShadow>
						<capsuleGeometry args={[0.065 * s, 0.28 * s, 8, 16]} />
						<meshStandardMaterial color={jeans} roughness={0.88} />
					</mesh>
					<group ref={rightShin} position={[0, -0.4 * s, 0]}>
						<mesh position={[0, -0.18 * s, 0]} castShadow>
							<capsuleGeometry args={[0.052 * s, 0.26 * s, 8, 16]} />
							<meshStandardMaterial color={jeans} roughness={0.88} />
						</mesh>
						<Shoe s={s} kind={kind} />
					</group>
				</group>

				{isTony ? (
					<TonySweater s={s} hipY={hipY} shoulderY={shoulderY} />
				) : (
					<AlexJacket s={s} hipY={hipY} shoulderY={shoulderY} />
				)}

				<Arm
					side={-1}
					s={s}
					shoulderY={shoulderY}
					isTony={isTony}
					upperRef={leftUpperArm}
					foreRef={leftFore}
				/>
				<Arm
					side={1}
					s={s}
					shoulderY={shoulderY}
					isTony={isTony}
					upperRef={rightUpperArm}
					foreRef={rightFore}
				/>

				{isTony ? (
					<TonyHead s={s} headY={headY} headR={headR} />
				) : (
					<AlexHead s={s} headY={headY} headR={headR} />
				)}
			</group>

			{outline && (
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[0.28, 0.38, 40]} />
					<meshBasicMaterial
						color={selected ? '#f0e6c8' : '#dfe8e2'}
						transparent
						opacity={0.9}
					/>
				</mesh>
			)}

			{showLabel && (
				<Html
					position={[0, height + 0.32, 0]}
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

function Shoe({ s, kind }: { s: number; kind: FaceKind }) {
	const isTony = kind === 'tony';
	return (
		<group position={[0, -0.38 * s, 0.04 * s]}>
			<mesh castShadow>
				<boxGeometry args={[0.11 * s, 0.065 * s, 0.22 * s]} />
				<meshStandardMaterial
					color={isTony ? TONY.shoes : ALEX.shoes}
					roughness={0.45}
				/>
			</mesh>
			{!isTony && (
				<mesh position={[0.056 * s, 0.01 * s, 0]} castShadow>
					<boxGeometry args={[0.012 * s, 0.035 * s, 0.12 * s]} />
					<meshStandardMaterial color={ALEX.shoeStripe} roughness={0.7} />
				</mesh>
			)}
			<mesh position={[0, -0.025 * s, 0.01 * s]} castShadow>
				<boxGeometry args={[0.115 * s, 0.028 * s, 0.24 * s]} />
				<meshStandardMaterial
					color={isTony ? TONY.shoeSole : ALEX.shoeSole}
					roughness={0.8}
				/>
			</mesh>
		</group>
	);
}

function Arm({
	side,
	s,
	shoulderY,
	isTony,
	upperRef,
	foreRef,
}: {
	side: -1 | 1;
	s: number;
	shoulderY: number;
	isTony: boolean;
	upperRef: RefObject<THREE.Group | null>;
	foreRef: RefObject<THREE.Group | null>;
}) {
	const skin = isTony ? TONY.skin : ALEX.skin;
	const sleeve = isTony ? TONY.sweater : ALEX.leather;
	return (
		<group ref={upperRef} position={[side * 0.24 * s, shoulderY, 0]}>
			<mesh position={[0, -0.14 * s, 0]} castShadow rotation={[0, 0, side * -0.1]}>
				<capsuleGeometry args={[0.05 * s, 0.2 * s, 8, 14]} />
				<meshStandardMaterial
					color={sleeve}
					roughness={isTony ? 0.82 : 0.4}
					metalness={isTony ? 0 : 0.15}
				/>
			</mesh>
			<group ref={foreRef} position={[0, -0.3 * s, 0]}>
				{/* Forearm: sweater cuff / jacket sleeve then skin hand */}
				<mesh position={[0, -0.08 * s, 0]} castShadow>
					<capsuleGeometry args={[0.042 * s, 0.1 * s, 8, 12]} />
					<meshStandardMaterial
						color={sleeve}
						roughness={isTony ? 0.82 : 0.4}
						metalness={isTony ? 0 : 0.15}
					/>
				</mesh>
				<mesh position={[0, -0.2 * s, 0]} castShadow>
					<capsuleGeometry args={[0.038 * s, 0.08 * s, 8, 12]} />
					<SkinMaterial kind={isTony ? 'tony' : 'alex'} color={skin} />
				</mesh>
				<mesh position={[0, -0.28 * s, 0]} castShadow scale={[1, 1.05, 0.75]}>
					<sphereGeometry args={[0.04 * s, 12, 12]} />
					<SkinMaterial kind={isTony ? 'tony' : 'alex'} color={skin} />
				</mesh>
			</group>
		</group>
	);
}

function poseIdle(
	leftThigh: RefObject<THREE.Group | null>,
	rightThigh: RefObject<THREE.Group | null>,
	leftUpperArm: RefObject<THREE.Group | null>,
	rightUpperArm: RefObject<THREE.Group | null>,
	leftFore: RefObject<THREE.Group | null>,
	rightFore: RefObject<THREE.Group | null>,
) {
	if (leftThigh.current) leftThigh.current.rotation.x = 0.06;
	if (rightThigh.current) rightThigh.current.rotation.x = -0.04;
	if (leftUpperArm.current) leftUpperArm.current.rotation.x = 0.08;
	if (rightUpperArm.current) rightUpperArm.current.rotation.x = -0.06;
	if (leftFore.current) leftFore.current.rotation.x = 0.2;
	if (rightFore.current) rightFore.current.rotation.x = 0.2;
}

function TonySweater({
	s,
	hipY,
	shoulderY,
}: {
	s: number;
	hipY: number;
	shoulderY: number;
}) {
	const midY = (hipY + shoulderY) / 2;
	return (
		<group>
			{/* Jeans waist */}
			<mesh position={[0, hipY + 0.02 * s, 0]} castShadow>
				<cylinderGeometry args={[0.13 * s, 0.14 * s, 0.1 * s, 16]} />
				<meshStandardMaterial color={TONY.jeans} roughness={0.88} />
			</mesh>
			<mesh position={[0, hipY + 0.07 * s, 0]} castShadow>
				<cylinderGeometry args={[0.135 * s, 0.135 * s, 0.035 * s, 16]} />
				<meshStandardMaterial color="#2a2420" roughness={0.7} />
			</mesh>
			{/* Undershirt peek */}
			<mesh position={[0, shoulderY - 0.04 * s, 0.06 * s]} castShadow>
				<boxGeometry args={[0.12 * s, 0.05 * s, 0.05 * s]} />
				<meshStandardMaterial color={TONY.undershirt} roughness={0.75} />
			</mesh>
			{/* Crewneck sweater body */}
			<mesh position={[0, midY + 0.04 * s, 0]} castShadow>
				<boxGeometry args={[0.32 * s, 0.5 * s, 0.2 * s]} />
				<meshStandardMaterial color={TONY.sweater} roughness={0.85} />
			</mesh>
			{/* Ribbed hem */}
			<mesh position={[0, hipY + 0.12 * s, 0]} castShadow>
				<cylinderGeometry args={[0.155 * s, 0.15 * s, 0.06 * s, 16]} />
				<meshStandardMaterial color={TONY.sweaterDark} roughness={0.88} />
			</mesh>
			{/* Collar rib */}
			<mesh position={[0, shoulderY - 0.02 * s, 0.02 * s]} castShadow>
				<torusGeometry args={[0.07 * s, 0.018 * s, 10, 20, Math.PI]} />
				<meshStandardMaterial color={TONY.sweaterDark} roughness={0.85} />
			</mesh>
			{/* Shoulders */}
			{[-0.16, 0.16].map((x) => (
				<mesh key={x} position={[x * s, shoulderY, 0]} castShadow>
					<sphereGeometry args={[0.08 * s, 14, 14]} />
					<meshStandardMaterial color={TONY.sweater} roughness={0.85} />
				</mesh>
			))}
		</group>
	);
}

function AlexJacket({
	s,
	hipY,
	shoulderY,
}: {
	s: number;
	hipY: number;
	shoulderY: number;
}) {
	const midY = (hipY + shoulderY) / 2;
	return (
		<group>
			{/* High-waist jeans */}
			<mesh position={[0, hipY + 0.04 * s, 0]} castShadow>
				<cylinderGeometry args={[0.125 * s, 0.135 * s, 0.18 * s, 16]} />
				<meshStandardMaterial color={ALEX.jeans} roughness={0.88} />
			</mesh>
			<mesh position={[0, hipY + 0.12 * s, 0]} castShadow>
				<cylinderGeometry args={[0.13 * s, 0.13 * s, 0.03 * s, 16]} />
				<meshStandardMaterial color="#2a2420" roughness={0.7} />
			</mesh>
			{/* White tee */}
			<mesh position={[0, midY + 0.06 * s, 0.01 * s]} castShadow>
				<boxGeometry args={[0.26 * s, 0.36 * s, 0.14 * s]} />
				<meshStandardMaterial color={ALEX.tee} roughness={0.8} />
			</mesh>
			{/* Leather jacket body */}
			<mesh position={[0, midY + 0.08 * s, 0]} castShadow>
				<boxGeometry args={[0.36 * s, 0.42 * s, 0.2 * s]} />
				<meshStandardMaterial
					color={ALEX.leather}
					roughness={0.38}
					metalness={0.18}
					envMapIntensity={0.9}
				/>
			</mesh>
			{/* Lapels */}
			{[-1, 1].map((side) => (
				<mesh
					key={side}
					position={[side * 0.06 * s, midY + 0.16 * s, 0.105 * s]}
					rotation={[0, 0, side * -0.35]}
					castShadow
				>
					<boxGeometry args={[0.08 * s, 0.2 * s, 0.025 * s]} />
					<meshStandardMaterial
						color={ALEX.leatherHi}
						roughness={0.35}
						metalness={0.2}
					/>
				</mesh>
			))}
			{/* Zipper line */}
			<mesh position={[0, midY + 0.06 * s, 0.102 * s]} castShadow>
				<boxGeometry args={[0.012 * s, 0.36 * s, 0.01 * s]} />
				<meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.25} />
			</mesh>
			{/* Shoulders / epaulettes */}
			{[-0.17, 0.17].map((x) => (
				<mesh key={x} position={[x * s, shoulderY, 0]} castShadow>
					<sphereGeometry args={[0.075 * s, 14, 14]} />
					<meshStandardMaterial
						color={ALEX.leather}
						roughness={0.38}
						metalness={0.18}
					/>
				</mesh>
			))}
		</group>
	);
}

/** Shared 3D eye pair — no UV face maps (those warp on spheres). */
function Eyes({
	headY,
	headR,
	iris,
	spread = 0.3,
	yOff = 0.08,
}: {
	headY: number;
	headR: number;
	iris: string;
	spread?: number;
	yOff?: number;
}) {
	const y = headY + headR * yOff;
	const z = headR * 0.88;
	return (
		<>
			{[-1, 1].map((side) => (
				<group key={side} position={[side * headR * spread, y, z]}>
					<mesh castShadow scale={[1, 0.85, 0.55]}>
						<sphereGeometry args={[headR * 0.13, 12, 12]} />
						<meshStandardMaterial color="#f5f2ec" roughness={0.4} />
					</mesh>
					<mesh position={[0, 0, headR * 0.06]}>
						<sphereGeometry args={[headR * 0.07, 12, 12]} />
						<meshStandardMaterial color={iris} roughness={0.35} />
					</mesh>
					<mesh position={[0, 0, headR * 0.1]}>
						<sphereGeometry args={[headR * 0.035, 8, 8]} />
						<meshStandardMaterial color="#1a1210" roughness={0.3} />
					</mesh>
					<mesh position={[-headR * 0.025, headR * 0.025, headR * 0.12]}>
						<sphereGeometry args={[headR * 0.015, 6, 6]} />
						<meshBasicMaterial color="#ffffff" />
					</mesh>
				</group>
			))}
		</>
	);
}

function TonyHead({
	s,
	headY,
	headR,
}: {
	s: number;
	headY: number;
	headR: number;
}) {
	const eyeY = headY + headR * 0.08;
	const eyeZ = headR * 0.9;
	const eyeSpread = headR * 0.3;

	return (
		<group>
			<mesh position={[0, headY - headR * 1.15, 0]} castShadow>
				<cylinderGeometry args={[0.05 * s, 0.06 * s, 0.1 * s, 12]} />
				<SkinMaterial color={TONY.skin} />
			</mesh>

			{/* Plain skin head — features are separate meshes */}
			<mesh position={[0, headY, 0]} castShadow scale={[1, 1.12, 0.95]}>
				<sphereGeometry args={[headR, 32, 32]} />
				<SkinMaterial color={TONY.skin} />
			</mesh>

			{[-1, 1].map((side) => (
				<mesh
					key={side}
					position={[side * headR * 0.98, headY, -headR * 0.05]}
					castShadow
					scale={[0.4, 0.75, 0.32]}
				>
					<sphereGeometry args={[0.048 * s, 10, 10]} />
					<SkinMaterial color={TONY.skin} />
				</mesh>
			))}

			<Eyes headY={headY} headR={headR} iris="#5a3a28" spread={0.3} yOff={0.08} />

			{/* Brows */}
			{[-1, 1].map((side) => (
				<mesh
					key={side}
					position={[side * eyeSpread, eyeY + headR * 0.16, eyeZ - headR * 0.02]}
					rotation={[0, 0, side * -0.12]}
					castShadow
				>
					<boxGeometry args={[headR * 0.22, headR * 0.04, headR * 0.05]} />
					<meshStandardMaterial color={TONY.hair} roughness={0.9} />
				</mesh>
			))}

			{/* Nose */}
			<mesh position={[0, headY - headR * 0.02, headR * 0.95]} castShadow scale={[0.55, 0.7, 0.9]}>
				<sphereGeometry args={[headR * 0.12, 10, 10]} />
				<SkinMaterial color={TONY.skinShadow} />
			</mesh>

			{/* Smile */}
			<mesh position={[0, headY - headR * 0.28, headR * 0.88]} castShadow>
				<boxGeometry args={[headR * 0.22, headR * 0.04, headR * 0.04]} />
				<meshStandardMaterial color="#9a5a55" roughness={0.7} />
			</mesh>

			{/* Glasses locked to the 3D eyes */}
			<group position={[0, eyeY, eyeZ + headR * 0.04]}>
				{[-1, 1].map((side) => (
					<group key={side} position={[side * eyeSpread, 0, 0]}>
						<mesh>
							<torusGeometry args={[headR * 0.15, headR * 0.018, 8, 20]} />
							<meshStandardMaterial color={TONY.glasses} metalness={0.65} roughness={0.3} />
						</mesh>
					</group>
				))}
				<mesh>
					<boxGeometry args={[headR * 0.14, headR * 0.02, headR * 0.02]} />
					<meshStandardMaterial color={TONY.glasses} metalness={0.65} roughness={0.3} />
				</mesh>
				{[-1, 1].map((side) => (
					<mesh
						key={`arm-${side}`}
						position={[side * (eyeSpread + headR * 0.14), 0, -headR * 0.35]}
						rotation={[0, side * 0.5, 0]}
					>
						<boxGeometry args={[headR * 0.28, headR * 0.02, headR * 0.02]} />
						<meshStandardMaterial color={TONY.glasses} metalness={0.65} roughness={0.3} />
					</mesh>
				))}
			</group>

			{/* Full beard — chin, cheeks, mustache (reads clearly from the front) */}
			{/* Chin / jaw mass */}
			<mesh
				position={[0, headY - headR * 0.62, headR * 0.45]}
				castShadow
				scale={[1.15, 0.85, 0.95]}
			>
				<sphereGeometry args={[headR * 0.52, 14, 14]} />
				<meshStandardMaterial color={TONY.beard} roughness={0.95} />
			</mesh>
			{/* Lower chin length */}
			<mesh
				position={[0, headY - headR * 0.85, headR * 0.35]}
				castShadow
				scale={[1.0, 0.7, 0.85]}
			>
				<sphereGeometry args={[headR * 0.38, 12, 12]} />
				<meshStandardMaterial color={TONY.beard} roughness={0.95} />
			</mesh>
			{/* Cheek / sideburns */}
			{([-1, 1] as const).map((side) => (
				<group key={`beard-side-${side}`}>
					<mesh
						position={[side * headR * 0.72, headY - headR * 0.2, headR * 0.35]}
						castShadow
						scale={[0.4, 0.95, 0.5]}
					>
						<sphereGeometry args={[headR * 0.38, 12, 12]} />
						<meshStandardMaterial color={TONY.beard} roughness={0.95} />
					</mesh>
					<mesh
						position={[side * headR * 0.65, headY - headR * 0.5, headR * 0.5]}
						castShadow
						scale={[0.45, 0.75, 0.55]}
					>
						<sphereGeometry args={[headR * 0.34, 10, 10]} />
						<meshStandardMaterial color={TONY.beard} roughness={0.95} />
					</mesh>
				</group>
			))}
			{/* Mustache */}
			<mesh
				position={[0, headY - headR * 0.18, headR * 0.95]}
				castShadow
				scale={[1.35, 0.35, 0.45]}
			>
				<sphereGeometry args={[headR * 0.16, 10, 10]} />
				<meshStandardMaterial color={TONY.beard} roughness={0.95} />
			</mesh>
			{([-1, 1] as const).map((side) => (
				<mesh
					key={`stache-${side}`}
					position={[side * headR * 0.22, headY - headR * 0.22, headR * 0.9]}
					castShadow
					scale={[0.7, 0.4, 0.5]}
				>
					<sphereGeometry args={[headR * 0.12, 8, 8]} />
					<meshStandardMaterial color={TONY.beard} roughness={0.95} />
				</mesh>
			))}

			{/* Short cropped hair — solid crown so he isn’t bald from the front */}
			{/* Main scalp cap (covers top of head sphere) */}
			<mesh
				position={[0, headY + headR * 0.35, -headR * 0.05]}
				castShadow
				scale={[1.12, 0.85, 1.15]}
			>
				<sphereGeometry args={[headR * 0.98, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
				<meshStandardMaterial color={TONY.hair} roughness={0.9} />
			</mesh>
			{/* Extra top fill — reads as hair on the crown */}
			<mesh
				position={[0, headY + headR * 0.72, 0]}
				castShadow
				scale={[1.05, 0.55, 1.05]}
			>
				<sphereGeometry args={[headR * 0.72, 14, 14]} />
				<meshStandardMaterial color={TONY.hair} roughness={0.9} />
			</mesh>
			{(
				[
					[0, 0.85, 0.1, 0.36],
					[0.32, 0.75, 0.05, 0.3],
					[-0.32, 0.75, 0.05, 0.3],
					[0.45, 0.55, -0.15, 0.28],
					[-0.45, 0.55, -0.15, 0.28],
					[0.2, 0.7, -0.4, 0.3],
					[-0.2, 0.7, -0.4, 0.3],
					[0, 0.55, -0.55, 0.32],
				] as const
			).map(([x, y, z, r], i) => (
				<mesh
					key={`tony-crop-${i}`}
					position={[x * headR, headY + y * headR, z * headR]}
					castShadow
					scale={[1.05, 0.85, 1.05]}
				>
					<sphereGeometry args={[r * headR, 10, 10]} />
					<meshStandardMaterial
						color={i % 2 ? TONY.hairLit : TONY.hair}
						roughness={0.92}
					/>
				</mesh>
			))}
			{/* Short sides connecting crown to beard */}
			{([-1, 1] as const).map((side) => (
				<mesh
					key={`fade-${side}`}
					position={[side * headR * 0.95, headY + headR * 0.2, -headR * 0.05]}
					castShadow
					scale={[0.32, 0.7, 0.6]}
				>
					<sphereGeometry args={[headR * 0.38, 10, 10]} />
					<meshStandardMaterial color={TONY.hair} roughness={0.95} />
				</mesh>
			))}
		</group>
	);
}

function AlexHead({
	s,
	headY,
	headR,
}: {
	s: number;
	headY: number;
	headR: number;
}) {
	return (
		<group>
			<mesh position={[0, headY - headR * 1.1, 0]} castShadow>
				<cylinderGeometry args={[0.048 * s, 0.055 * s, 0.09 * s, 12]} />
				<SkinMaterial color={ALEX.skin} />
			</mesh>

			<mesh position={[0, headY, 0]} castShadow scale={[1, 1.08, 0.95]}>
				<sphereGeometry args={[headR, 32, 32]} />
				<SkinMaterial color={ALEX.skin} />
			</mesh>

			{[-1, 1].map((side) => (
				<mesh
					key={side}
					position={[side * headR * 0.95, headY, -headR * 0.05]}
					castShadow
					scale={[0.42, 0.75, 0.32]}
				>
					<sphereGeometry args={[0.04 * s, 10, 10]} />
					<SkinMaterial color={ALEX.skin} />
				</mesh>
			))}

			<Eyes headY={headY} headR={headR} iris="#4a7a9a" spread={0.28} yOff={0.06} />

			{[-1, 1].map((side) => (
				<mesh
					key={side}
					position={[
						side * headR * 0.28,
						headY + headR * 0.2,
						headR * 0.85,
					]}
					rotation={[0, 0, side * -0.08]}
				>
					<boxGeometry args={[headR * 0.18, headR * 0.03, headR * 0.04]} />
					<meshStandardMaterial color={ALEX.hairDark} roughness={0.9} />
				</mesh>
			))}

			<mesh position={[0, headY - headR * 0.02, headR * 0.92]} castShadow scale={[0.5, 0.65, 0.8]}>
				<sphereGeometry args={[headR * 0.1, 10, 10]} />
				<SkinMaterial color={ALEX.skinShadow} />
			</mesh>

			<mesh position={[0, headY - headR * 0.32, headR * 0.88]} castShadow>
				<boxGeometry args={[headR * 0.2, headR * 0.05, headR * 0.04]} />
				<meshStandardMaterial color="#c45a68" roughness={0.65} />
			</mesh>

			{/* Long wavy auburn hair — must sit OUTSIDE the head so it reads from the front */}
			{/* Cap (top only, not a full helmet) */}
			<mesh
				position={[0, headY + headR * 0.55, -headR * 0.1]}
				castShadow
				scale={[1.2, 0.55, 1.15]}
			>
				<sphereGeometry args={[headR * 0.95, 16, 16]} />
				<meshStandardMaterial color={ALEX.hair} roughness={0.88} />
			</mesh>
			{/* Bangs over forehead */}
			{([-0.4, -0.15, 0.15, 0.4] as const).map((x, i) => (
				<mesh
					key={`bang-${i}`}
					position={[x * headR, headY + headR * 0.45, headR * 0.78]}
					castShadow
					scale={[0.9, 0.75, 0.7]}
				>
					<sphereGeometry args={[headR * 0.32, 10, 10]} />
					<meshStandardMaterial
						color={i % 2 ? ALEX.hairLit : ALEX.hair}
						roughness={0.9}
					/>
				</mesh>
			))}
			{/* Temple / ear coverage */}
			{([-1, 1] as const).map((side) => (
				<mesh
					key={`temple-${side}`}
					position={[side * headR * 1.05, headY + headR * 0.05, headR * 0.15]}
					castShadow
					scale={[0.55, 1.1, 0.7]}
				>
					<sphereGeometry args={[headR * 0.45, 12, 12]} />
					<meshStandardMaterial color={ALEX.hair} roughness={0.9} />
				</mesh>
			))}
			{/* Back of head mass */}
			<mesh
				position={[0, headY - headR * 0.05, -headR * 0.85]}
				castShadow
				scale={[1.35, 1.2, 0.9]}
			>
				<sphereGeometry args={[headR * 0.55, 14, 14]} />
				<meshStandardMaterial color={ALEX.hairDark} roughness={0.92} />
			</mesh>
			{/* Long side curtains — hang beside face & shoulders (world Y down from head) */}
			{([-1, 1] as const).flatMap((side) =>
				[0, 1, 2, 3, 4, 5].map((row) => {
					const t = row / 5;
					const y = headY - headR * (0.3 + t * 4.2); // down past chest
					const wave = Math.sin(t * Math.PI * 2.4) * headR * 0.35;
					const x = side * (headR * 1.35 + t * headR * 0.55) + wave * side * 0.3;
					const z = headR * (0.2 - t * 0.35) + Math.cos(t * Math.PI * 1.8) * headR * 0.15;
					const r = headR * (0.28 - t * 0.04);
					return (
						<mesh
							key={`side-${side}-${row}`}
							position={[x, y, z]}
							castShadow
							scale={[1.2, 1.5, 1.1]}
						>
							<sphereGeometry args={[r, 10, 10]} />
							<meshStandardMaterial
								color={row % 2 ? ALEX.hairLit : ALEX.hair}
								roughness={0.9}
							/>
						</mesh>
					);
				}),
			)}
			{/* Long back cascade */}
			{[0, 1, 2, 3, 4, 5, 6].flatMap((row) =>
				([-0.55, 0, 0.55] as const).map((sx, col) => {
					const t = row / 6;
					const y = headY - headR * (0.5 + t * 4.5);
					const wave = Math.sin(t * Math.PI * 2.1 + col) * headR * 0.28;
					const x = sx * headR * (0.9 + t * 0.4) + wave;
					const z = -headR * (0.9 + t * 0.5);
					const r = headR * (0.3 - t * 0.05);
					return (
						<mesh
							key={`back-${row}-${col}`}
							position={[x, y, z]}
							castShadow
							scale={[1.15, 1.45, 1.05]}
						>
							<sphereGeometry args={[r, 10, 10]} />
							<meshStandardMaterial
								color={
									(row + col) % 3 === 0
										? ALEX.hairLit
										: (row + col) % 3 === 1
											? ALEX.hair
											: ALEX.hairDark
								}
								roughness={0.92}
							/>
						</mesh>
					);
				}),
			)}
			{/* Thick front-side ribbons using capsules so length reads clearly */}
			{([-1, 1] as const).map((side) => (
				<group key={`ribbon-${side}`}>
					<mesh
						position={[side * headR * 1.45, headY - headR * 1.6, headR * 0.1]}
						rotation={[0.15, 0, side * 0.12]}
						castShadow
					>
						<capsuleGeometry args={[headR * 0.2, headR * 2.4, 6, 10]} />
						<meshStandardMaterial color={ALEX.hair} roughness={0.9} />
					</mesh>
					<mesh
						position={[side * headR * 1.7, headY - headR * 2.8, -headR * 0.05]}
						rotation={[0.25, 0, side * 0.18]}
						castShadow
					>
						<capsuleGeometry args={[headR * 0.16, headR * 1.6, 6, 10]} />
						<meshStandardMaterial color={ALEX.hairLit} roughness={0.9} />
					</mesh>
				</group>
			))}
		</group>
	);
}
