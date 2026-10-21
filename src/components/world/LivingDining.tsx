import { useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { FT, PLAN, PLAN_CENTERS } from './condoLayout';

const WALL = '#eae8e4';
const FLOOR = '#3a2e26';
const WOOD = '#4a3828';
const WOOD_LIGHT = '#6a5644';
const SOFA = '#c8c4be';
const SOFA_DARK = '#a8a49e';
const BLACK = '#1a1a1a';
const RUG = '#2a2a2a';
const RUG_LIGHT = '#e8e4dc';
const T = 0.14;

function Box({
	position,
	args,
	color,
	roughness = 0.85,
	metalness = 0,
	rotation,
}: {
	position: [number, number, number];
	args: [number, number, number];
	color: string;
	roughness?: number;
	metalness?: number;
	rotation?: [number, number, number];
}) {
	return (
		<mesh position={position} rotation={rotation} castShadow receiveShadow>
			<boxGeometry args={args} />
			<meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
		</mesh>
	);
}

/** Doorway opening width/placement — must match CondoInterior dining door */
export const DOOR = {
	w: 1.25,
	/** left edge of opening on kitchen south wall */
	get x0() {
		return PLAN.kitchen.x + 0.04;
	},
	get x1() {
		return this.x0 + this.w;
	},
	get z() {
		return PLAN.kitchen.z; // south wall
	},
	get midX() {
		return (this.x0 + this.x1) / 2;
	},
};

/**
 * Clickable doorway between kitchen and living (sits in kitchen flip group).
 * Label + destination flip based on which room you’re in.
 */
export function KitchenLivingDoor({
	fromRoom = 'kitchen',
	onPassThrough,
}: {
	fromRoom?: 'kitchen' | 'living';
	onPassThrough?: (to: 'kitchen' | 'living') => void;
}) {
	const [hovered, setHovered] = useState(false);
	const mid = DOOR.midX;
	const z = DOOR.z;
	const toRoom = fromRoom === 'kitchen' ? 'living' : 'kitchen';
	const title = toRoom === 'living' ? 'Living' : 'Kitchen';

	return (
		<group
			position={[mid, 0, z]}
			onClick={(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				onPassThrough?.(toRoom);
			}}
			onPointerOver={(e: ThreeEvent<PointerEvent>) => {
				e.stopPropagation();
				setHovered(true);
				document.body.style.cursor = 'pointer';
			}}
			onPointerOut={() => {
				setHovered(false);
				document.body.style.cursor = 'auto';
			}}
		>
			{/* Frame only — open doorway, no door leaf */}
			<Box position={[-DOOR.w / 2, 1.1, 0]} args={[0.1, 2.2, 0.2]} color={hovered ? '#d4cfc6' : '#e8e4dc'} />
			<Box position={[DOOR.w / 2, 1.1, 0]} args={[0.1, 2.2, 0.2]} color={hovered ? '#d4cfc6' : '#e8e4dc'} />
			<Box position={[0, 2.22, 0]} args={[DOOR.w + 0.1, 0.12, 0.2]} color={hovered ? '#d4cfc6' : '#e8e4dc'} />
			{/* Invisible click volume — spans both sides of the threshold */}
			<mesh position={[0, 1.1, 0]}>
				<boxGeometry args={[DOOR.w * 0.9, 2.2, 1.2]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			<Html
				position={[0, 2.55, fromRoom === 'kitchen' ? -0.2 : 0.35]}
				center
				distanceFactor={10}
				style={{ pointerEvents: 'none' }}
			>
				<div className={`poi-label${hovered ? ' is-selected' : ''}`}>
					<span className="poi-label__title">{title}</span>
					<span className="poi-label__sub">Go through →</span>
				</div>
			</Html>
		</group>
	);
}

/**
 * Living + dining south of kitchen (same flip group as kitchen).
 * East wall aligns with doorway right jamb.
 * Authored mirrored in local X so after the kitchen 180° flip the
 * on-screen view matches the photos (furniture left, walkway right):
 *   left  = white door, shelves, dining, bay + desk
 *   right = clear walkway, solid wall (no windows)
 */
export function LivingDining() {
	const entryZ = DOOR.z; // kitchen south = doorway
	/** Room east edge = doorway right jamb */
	const east = DOOR.x1;
	const livingW = PLAN.living.w;
	const west = east - livingW;
	const depth = (22 + 6 / 12) * FT;
	const farZ = entryZ - depth; // extends south
	const w = east - west;
	/**
	 * Walkway on local east (doorway side). Kitchen flip mirrors X, so this
	 * reads as the right-hand walkway when you look through the doorway.
	 */
	const walk = 1.1;
	const furnWest = west + 0.15;
	const furnEast = east - walk;
	const furnCx = (furnWest + furnEast) / 2;
	const diningX = furnWest + 1.35;
	const diningZ = entryZ - depth * 0.28;
	const livingZ = entryZ - depth * 0.62;
	const cz = entryZ - depth * 0.48;

	return (
		<group>
			{/* Floor */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[(west + east) / 2, 0.002, cz]} receiveShadow>
				<planeGeometry args={[w + 0.2, depth + 0.2]} />
				<meshStandardMaterial color={FLOOR} roughness={0.88} />
			</mesh>

			{/* Continuity floor through doorway into kitchen edge */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[DOOR.midX, 0.003, entryZ - 0.15]}
				receiveShadow
			>
				<planeGeometry args={[DOOR.w + 0.2, 0.5]} />
				<meshStandardMaterial color={FLOOR} roughness={0.88} />
			</mesh>

			{/* East wall (walkway side) */}
			<Box position={[east, 1.35, cz]} args={[T, 2.7, depth]} color={WALL} roughness={0.95} />
			{/* West wall — gap exactly matches bay opening */}
			{(() => {
				const half = BAY_OPEN / 2;
				const bayZ0 = diningZ - half;
				const bayZ1 = diningZ + half;
				const northLen = Math.max(0.15, entryZ - bayZ1);
				const southLen = Math.max(0.15, bayZ0 - farZ);
				return (
					<>
						<Box
							position={[west, 1.35, bayZ1 + northLen / 2]}
							args={[T, 2.7, northLen]}
							color={WALL}
							roughness={0.95}
						/>
						<Box
							position={[west, 1.35, bayZ0 - southLen / 2]}
							args={[T, 2.7, southLen]}
							color={WALL}
							roughness={0.95}
						/>
					</>
				);
			})()}
			{/* Far south — solid wall */}
			<Box
				position={[(west + east) / 2, 1.35, farZ]}
				args={[w * 0.98, 2.7, T]}
				color={WALL}
				roughness={0.95}
			/>
			{/* Near wall west of doorway only */}
			<Box
				position={[(west + DOOR.x0) / 2, 1.35, entryZ]}
				args={[Math.max(0.2, DOOR.x0 - west - 0.05), 2.7, T]}
				color={WALL}
				roughness={0.95}
			/>

			{/* Bay on left wall beside dining */}
			<BayNook wallX={west} cz={diningZ} />

			{/* White door near entry (no shelf) */}
			<Box position={[west + 0.55, 1.1, entryZ - 0.55]} args={[0.85, 2.15, 0.08]} color="#f2f0ec" />
			<Box position={[west + 0.35, 1.1, entryZ - 0.5]} args={[0.04, 0.12, 0.04]} color={BLACK} />

			{/* Dining — left / east, patterned rug */}
			<Box position={[diningX, 0.02, diningZ]} args={[2.5, 0.03, 2.7]} color={RUG_LIGHT} />
			<Box position={[diningX, 0.035, diningZ]} args={[2.1, 0.01, 2.3]} color={RUG} />
			{/* Rectangular table */}
			<Box position={[diningX, 0.76, diningZ]} args={[1.55, 0.06, 0.95]} color={WOOD} roughness={0.5} />
			{[
				[-0.65, -0.38],
				[0.65, -0.38],
				[-0.65, 0.38],
				[0.65, 0.38],
			].map(([dx, dz], i) => (
				<Box
					key={i}
					position={[diningX + dx, 0.38, diningZ + dz]}
					args={[0.05, 0.72, 0.05]}
					color={WOOD}
				/>
			))}
			{/* Black chairs — backrests outward so seats face the table */}
			{(
				[
					[0, -0.72, 0, -0.16],
					[0, 0.72, 0, 0.16],
					[-0.95, 0, -0.16, 0],
					[0.95, 0, 0.16, 0],
				] as const
			).map(([dx, dz, bx, bz], i) => (
				<group key={i} position={[diningX + dx, 0, diningZ + dz]}>
					<Box position={[0, 0.48, 0]} args={[0.4, 0.04, 0.4]} color={BLACK} />
					<Box
						position={[bx, 0.72, bz]}
						args={[Math.abs(bx) > 0.01 ? 0.05 : 0.4, 0.42, Math.abs(bz) > 0.01 ? 0.05 : 0.4]}
						color={BLACK}
					/>
					{[
						[-0.14, -0.14],
						[0.14, -0.14],
						[-0.14, 0.14],
						[0.14, 0.14],
					].map((o, j) => (
						<Box key={j} position={[o[0], 0.24, o[1]]} args={[0.025, 0.45, 0.025]} color="#333" />
					))}
				</group>
			))}

			{/* Globe lamp — left wall, between dining and sofa */}
			<Box
				position={[west + 0.35, 0.95, (diningZ + livingZ) / 2]}
				args={[0.035, 1.7, 0.035]}
				color="#c4a06a"
			/>
			{[0, 1, 2].map((i) => (
				<mesh
					key={i}
					position={[
						west + 0.35 + (i - 1) * 0.12,
						1.75 + i * 0.07,
						(diningZ + livingZ) / 2,
					]}
				>
					<sphereGeometry args={[0.11, 12, 12]} />
					<meshStandardMaterial color="#f8f6f0" emissive="#fff8e8" emissiveIntensity={0.4} />
				</mesh>
			))}

			{/* Living — L-sofa: long seat faces TV; chaise against left wall */}
			<Box position={[furnCx - 0.05, 0.02, livingZ]} args={[2.6, 0.04, 2.2]} color="#3a3836" />
			{/* Long seat */}
			<Box position={[furnCx + 0.15, 0.4, livingZ + 0.35]} args={[2.0, 0.5, 0.9]} color={SOFA} />
			<Box position={[furnCx + 0.15, 0.82, livingZ + 0.55]} args={[2.0, 0.4, 0.26]} color={SOFA_DARK} />
			{/* Chaise + backrest on left wall */}
			<Box position={[west + 0.55, 0.4, livingZ - 0.05]} args={[0.85, 0.5, 1.7]} color={SOFA} />
			<Box position={[west + 0.28, 0.82, livingZ - 0.05]} args={[0.26, 0.4, 1.7]} color={SOFA_DARK} />
			<Box position={[furnCx + 0.1, 0.32, livingZ - 0.2]} args={[1.0, 0.08, 0.55]} color={WOOD_LIGHT} />
			{[
				[-0.4, -0.2],
				[0.4, -0.2],
				[-0.4, 0.2],
				[0.4, 0.2],
			].map((o, i) => (
				<Box
					key={i}
					position={[furnCx + 0.1 + o[0], 0.16, livingZ - 0.2 + o[1]]}
					args={[0.04, 0.28, 0.04]}
					color={WOOD}
				/>
			))}

			{/* Credenza + LOVE art — flush on far wall, facing sofa */}
			<Box
				position={[furnCx - 0.15, 0.4, farZ + 0.28]}
				args={[1.7, 0.65, 0.42]}
				color={WOOD}
				roughness={0.5}
			/>
			<Box position={[furnCx - 0.15, 1.55, farZ + 0.08]} args={[1.15, 0.75, 0.04]} color="#1a4a9a" />
			<Box position={[furnCx - 0.15, 1.55, farZ + 0.1]} args={[0.35, 0.35, 0.02]} color="#e8c84a" />
			<Box position={[furnCx + 0.15, 1.65, farZ + 0.1]} args={[0.35, 0.18, 0.02]} color="#e85a5a" />

			{/* Ceiling lights */}
			<mesh position={[diningX, 2.55, diningZ]}>
				<cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
				<meshStandardMaterial color="#f4f2ee" emissive="#fff8f0" emissiveIntensity={0.25} />
			</mesh>
			<mesh position={[furnCx, 2.55, livingZ]}>
				<cylinderGeometry args={[0.5, 0.5, 0.1, 24]} />
				<meshStandardMaterial color="#f4f2ee" emissive="#fff8f0" emissiveIntensity={0.25} />
			</mesh>
			<pointLight position={[furnCx, 2.4, cz]} intensity={0.85} distance={14} color="#fff4e8" />
			<pointLight position={[diningX, 2.2, farZ - 0.4]} intensity={0.55} distance={8} color="#e8f0ff" />
		</group>
	);
}

/** Z-span of bay opening in the west wall — must match wall stubs */
const BAY_OPEN = 2.05;

/**
 * Three-sided bay on the left (west) wall beside the dining table.
 * Side walls run wall-edge → outer corners so they meet the room walls.
 */
function BayNook({ wallX, cz }: { wallX: number; cz: number }) {
	const depth = 0.9;
	const centerW = 1.15;
	const winH = 1.85;
	const winY = 1.35;
	const frame = '#1a1a1a';
	const glass = '#c5d8e8';
	const blind = '#f4f2ee';
	const xOuter = wallX - depth;
	const zOpen0 = cz - BAY_OPEN / 2;
	const zOpen1 = cz + BAY_OPEN / 2;
	const zCen0 = cz - centerW / 2;
	const zCen1 = cz + centerW / 2;

	/** Wall panel spanning two points in XZ (full height) */
	function SideWall(
		ax: number,
		az: number,
		bx: number,
		bz: number,
		key: string,
	) {
		const dx = bx - ax;
		const dz = bz - az;
		const len = Math.hypot(dx, dz);
		const midX = (ax + bx) / 2;
		const midZ = (az + bz) / 2;
		const rotY = Math.atan2(dx, dz);
		return (
			<group key={key} position={[midX, 0, midZ]} rotation={[0, rotY, 0]}>
				<Box position={[0, 1.35, 0]} args={[T, 2.7, len + 0.04]} color={WALL} roughness={0.95} />
				{/* Window in this side panel */}
				<group position={[T * 0.6, winY, 0]}>
					<Box
						position={[0, 0, 0]}
						args={[0.04, winH, len * 0.72]}
						color={glass}
						roughness={0.25}
						metalness={0.15}
					/>
					<Box position={[0, winH / 2, 0]} args={[0.06, 0.06, len * 0.78]} color={frame} />
					<Box position={[0, -winH / 2, 0]} args={[0.06, 0.06, len * 0.78]} color={frame} />
					<Box position={[0, 0, -len * 0.36]} args={[0.06, winH + 0.06, 0.06]} color={frame} />
					<Box position={[0, 0, len * 0.36]} args={[0.06, winH + 0.06, 0.06]} color={frame} />
					<Box position={[0.02, winH / 2 - 0.12, 0]} args={[0.03, 0.22, len * 0.7]} color={blind} />
				</group>
			</group>
		);
	}

	return (
		<group>
			{/* Bay floor */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[(wallX + xOuter) / 2, 0.004, cz]}
				receiveShadow
			>
				<planeGeometry args={[depth + 0.1, BAY_OPEN + 0.1]} />
				<meshStandardMaterial color={FLOOR} roughness={0.88} />
			</mesh>

			{/* Outer center wall + window */}
			<Box position={[xOuter, 1.35, cz]} args={[T, 2.7, centerW + 0.06]} color={WALL} roughness={0.95} />
			<group position={[xOuter + 0.05, winY, cz]}>
				<Box
					position={[0, 0, 0]}
					args={[0.04, winH, centerW * 0.72]}
					color={glass}
					roughness={0.25}
					metalness={0.15}
				/>
				<Box position={[0, winH / 2, 0]} args={[0.06, 0.06, centerW * 0.78]} color={frame} />
				<Box position={[0, -winH / 2, 0]} args={[0.06, 0.06, centerW * 0.78]} color={frame} />
				<Box position={[0, 0, -centerW * 0.36]} args={[0.06, winH + 0.06, 0.06]} color={frame} />
				<Box position={[0, 0, centerW * 0.36]} args={[0.06, winH + 0.06, 0.06]} color={frame} />
				<Box position={[0, 0, 0]} args={[0.05, winH, 0.04]} color={frame} />
				<Box position={[0.02, winH / 2 - 0.12, 0]} args={[0.03, 0.22, centerW * 0.7]} color={blind} />
			</group>

			{/* Side walls: wall opening corners → outer center corners (no gaps) */}
			{SideWall(wallX, zOpen0, xOuter, zCen0, 'south')}
			{SideWall(wallX, zOpen1, xOuter, zCen1, 'north')}

			{/* White desk facing into room */}
			<Box position={[xOuter + 0.42, 0.72, cz]} args={[0.48, 0.05, 0.95]} color="#f2f0ec" />
			<Box position={[xOuter + 0.42, 0.38, cz - 0.28]} args={[0.44, 0.65, 0.35]} color="#eee" />
			<Box position={[xOuter + 0.42, 0.38, cz + 0.28]} args={[0.44, 0.65, 0.35]} color="#eee" />
			<Box position={[xOuter + 0.28, 1.05, cz + 0.12]} args={[0.03, 0.28, 0.42]} color="#222" />
			<Box position={[xOuter + 0.38, 0.78, cz - 0.22]} args={[0.22, 0.02, 0.32]} color={WOOD_LIGHT} />
			<Box position={[xOuter + 0.5, 0.95, cz - 0.35]} args={[0.02, 0.35, 0.02]} color="#c4a06a" />
			<mesh position={[xOuter + 0.5, 1.12, cz - 0.35]}>
				<cylinderGeometry args={[0.08, 0.1, 0.12, 12]} />
				<meshStandardMaterial color="#e8e0d4" />
			</mesh>

			{/* Cognac office chair */}
			<Box position={[xOuter + 0.85, 0.45, cz]} args={[0.42, 0.08, 0.42]} color="#8a5a3a" />
			<Box position={[xOuter + 0.98, 0.75, cz]} args={[0.08, 0.5, 0.4]} color="#8a5a3a" />
			<mesh position={[xOuter + 0.85, 0.2, cz]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
				<meshStandardMaterial color="#333" metalness={0.4} roughness={0.5} />
			</mesh>

			{/* Small plant — south bay corner */}
			<Box position={[xOuter + 0.4, 0.35, cz - 0.65]} args={[0.22, 0.55, 0.22]} color="#2d5a32" />
			<Box position={[xOuter + 0.4, 0.75, cz - 0.65]} args={[0.35, 0.3, 0.35]} color="#3f7a45" />
			{/* Bird of paradise — north bay corner */}
			<Box position={[xOuter + 0.38, 0.15, cz + 0.7]} args={[0.32, 0.28, 0.32]} color="#2a2a2a" />
			<Box position={[xOuter + 0.38, 0.55, cz + 0.7]} args={[0.22, 0.5, 0.22]} color="#2d5a32" />
			<Box position={[xOuter + 0.38, 1.0, cz + 0.7]} args={[0.45, 0.45, 0.18]} color="#3f7a45" />

			<pointLight position={[xOuter + 0.5, 2.1, cz]} intensity={0.45} distance={6} color="#fff0d8" />
		</group>
	);
}

/** World-space camera after kitchen 180° flip — looking into living through doorway */
export function getLivingGoal(): {
	target: [number, number, number];
	distance: number;
	az: number;
	el: number;
} {
	const [kcx, kcz] = PLAN_CENTERS.kitchen;
	const k = PLAN.kitchen;
	// Local living center — room east edge = doorway right (DOOR.x1)
	const east = DOOR.x1;
	const west = east - PLAN.living.w;
	const localX = (west + east) / 2;
	const localZ = k.z - 3.4;
	// Flip 180 around kitchen center (matches CondoInterior)
	const wx = 2 * kcx - localX;
	const wz = 2 * kcz - localZ;
	return {
		target: [wx, 1.1, wz],
		distance: 5.8,
		// Same az as kitchen — look north through the doorway (no L/R flip)
		az: Math.PI,
		el: 0.55,
	};
}

export const LIVING_GOAL = getLivingGoal();
