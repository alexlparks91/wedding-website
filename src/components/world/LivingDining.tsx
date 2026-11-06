import { useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { FT, PLAN, PLAN_CENTERS } from './condoLayout';
import { PRIMARY_DOOR, PrimaryBedroom } from './PrimaryBedroom';

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
 *   left  = shelves, dining, bay + desk, TV
 *   right = walkway + primary double doors (right of TV)
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
	const tvX = PRIMARY_DOOR.tvX;
	const closetDoors = eastClosetDoors(diningZ);

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

			{/* East wall (walkway side) — gaps for closet doors left of mirrors */}
			{(() => {
				const d0 = closetDoors[0];
				const d1 = closetDoors[1];
				const northLen = Math.max(0.15, entryZ - d0.z1);
				const midLen = Math.max(0.08, d0.z0 - d1.z1);
				const southLen = Math.max(0.15, d1.z0 - farZ);
				return (
					<>
						<Box
							position={[east, 1.35, d0.z1 + northLen / 2]}
							args={[T, 2.7, northLen]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Continuous wall between the two closet doors */}
						<Box
							position={[east, 1.35, d0.z0 - midLen / 2]}
							args={[T, 2.7, midLen]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Header + back on closed closet only; bath door (0) stays open */}
						<Box
							position={[east, 2.45, d1.z]}
							args={[T, 0.5, CLOSET_DOOR_W]}
							color={WALL}
							roughness={0.95}
						/>
						<Box
							position={[east + T * 0.25, 1.05, d1.z]}
							args={[T * 0.5, 2.1, CLOSET_DOOR_W]}
							color="#ddd9d2"
							roughness={0.95}
						/>
						{/* Slim header over bath opening (no fill in the doorway) */}
						<Box
							position={[east, 2.55, d0.z]}
							args={[T, 0.3, CLOSET_DOOR_W]}
							color={WALL}
							roughness={0.95}
						/>
						<Box
							position={[east, 1.35, d1.z0 - southLen / 2]}
							args={[T, 2.7, southLen]}
							color={WALL}
							roughness={0.95}
						/>
					</>
				);
			})()}
			{/* West wall — bay at dining; two tall windows along the sofa wall */}
			{(() => {
				const half = BAY_OPEN / 2;
				const bayZ0 = diningZ - half;
				const bayZ1 = diningZ + half;
				const northLen = Math.max(0.15, entryZ - bayZ1);
				const wins = sofaWallWindows(livingZ, farZ);
				const w0 = wins[0];
				const w1 = wins[1];
				/** Living wall south of bay, with gaps for the two windows */
				const segA = Math.max(0.08, bayZ0 - w0.z1);
				const mid = Math.max(0.08, w0.z0 - w1.z1);
				const segB = Math.max(0.08, w1.z0 - farZ);
				const winTop = 2.7 - (SOFA_WIN.y + SOFA_WIN.h / 2);
				const winBot = SOFA_WIN.y - SOFA_WIN.h / 2;
				return (
					<>
						<Box
							position={[west, 1.35, bayZ1 + northLen / 2]}
							args={[T, 2.7, northLen]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Between bay and left window */}
						<Box
							position={[west, 1.35, bayZ0 - segA / 2]}
							args={[T, 2.7, segA]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Between the two windows */}
						<Box
							position={[west, 1.35, w0.z0 - mid / 2]}
							args={[T, 2.7, mid]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Past right window to TV wall */}
						<Box
							position={[west, 1.35, w1.z0 - segB / 2]}
							args={[T, 2.7, segB]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Sill + header + exterior backs for each window */}
						{wins.map((win, i) => (
							<group key={i}>
								<Box
									position={[west, winBot / 2, win.z]}
									args={[T, winBot, SOFA_WIN.w]}
									color={WALL}
									roughness={0.95}
								/>
								<Box
									position={[west, 2.7 - winTop / 2, win.z]}
									args={[T, winTop, SOFA_WIN.w]}
									color={WALL}
									roughness={0.95}
								/>
								<Box
									position={[west - T * 0.25, SOFA_WIN.y, win.z]}
									args={[T * 0.5, SOFA_WIN.h, SOFA_WIN.w]}
									color="#9bb0c0"
									roughness={0.55}
								/>
							</group>
						))}
					</>
				);
			})()}
			{/* Far south — TV wall with gap for bedroom doors (right of TV, near east wall) */}
			{(() => {
				const leftW = Math.max(0.2, PRIMARY_DOOR.x0 - west);
				const rightW = east - PRIMARY_DOOR.x1;
				return (
					<>
						<Box
							position={[west + leftW / 2, 1.35, farZ]}
							args={[leftW, 2.7, T]}
							color={WALL}
							roughness={0.95}
						/>
						{rightW > 0.04 && (
							<Box
								position={[PRIMARY_DOOR.x1 + rightW / 2, 1.35, farZ]}
								args={[rightW, 2.7, T]}
								color={WALL}
								roughness={0.95}
							/>
						)}
					</>
				);
			})()}
			{/* Near wall west of doorway — shelf, closet door, globe (dining photos) */}
			{(() => {
				const layout = diningNorthLayout(west, DOOR.x0);
				const { door } = layout;
				const eastLen = Math.max(0.12, DOOR.x0 - door.x1 - 0.02);
				const westLen = Math.max(0.12, door.x0 - west - 0.02);
				return (
					<>
						<Box
							position={[door.x1 + eastLen / 2, 1.35, entryZ]}
							args={[eastLen, 2.7, T]}
							color={WALL}
							roughness={0.95}
						/>
						<Box
							position={[door.x0 - westLen / 2, 1.35, entryZ]}
							args={[westLen, 2.7, T]}
							color={WALL}
							roughness={0.95}
						/>
						{/* Header + thin back behind closet door */}
						<Box
							position={[door.x, 2.45, entryZ]}
							args={[door.w, 0.5, T]}
							color={WALL}
							roughness={0.95}
						/>
						<Box
							position={[door.x, 1.05, entryZ + T * 0.2]}
							args={[door.w, 2.1, T * 0.5]}
							color="#ddd9d2"
							roughness={0.95}
						/>
					</>
				);
			})()}
			<DiningNorthWallDecor wallZ={entryZ} west={west} doorX0={DOOR.x0} />

			{/* Bay on left wall beside dining */}
			<BayNook wallX={west} cz={diningZ} />

			{/* Primary bedroom through far-wall double doors */}
			<PrimaryBedroom />

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

			{/* Living — one corner sectional (open on the right; joins on the left) */}
			{(() => {
				const seatH = 0.5;
				const seatY = 0.4;
				const backH = 0.42;
				const backY = seatY + seatH / 2 + backH / 2 - 0.02;
				const backT = 0.24;
				/** Main run facing the TV (−Z) — no arm on the open east end */
				const mainW = 2.2;
				const mainD = 0.95;
				const mainX = tvX + 0.05;
				const mainZ = livingZ + 0.4;
				const mainWest = mainX - mainW / 2;
				const mainEast = mainX + mainW / 2;
				const mainBackZ = mainZ + mainD / 2 - backT / 2;
				/** Chaise against west wall — seat overlaps main so the L is continuous */
				const overlap = 0.28;
				const chaiseW = 0.95;
				const chaiseD = 1.65;
				const chaiseX = mainWest - chaiseW / 2 + overlap;
				const chaiseZ = mainZ - (chaiseD - mainD) / 2;
				const chaiseWest = chaiseX - chaiseW / 2;
				const chaiseBackX = chaiseWest + backT / 2;
				/** Main back stops at the chaise join (no raised divider in the corner seat) */
				const mainBackWest = mainWest + overlap;
				const mainBackW = mainEast - mainBackWest;
				const mainBackX = (mainBackWest + mainEast) / 2;
				const rugW = mainW + chaiseW - overlap;
				const rugD = chaiseD + 0.15;
				const rugX = (chaiseWest + mainEast) / 2;
				const rugZ = (chaiseZ - chaiseD / 2 + mainZ + mainD / 2) / 2;
				return (
					<>
						<Box position={[rugX, 0.02, rugZ]} args={[rugW, 0.04, rugD]} color="#3a3836" />
						{/* Continuous seat: chaise + main (overlap hides the seam) */}
						<Box position={[chaiseX, seatY, chaiseZ]} args={[chaiseW, seatH, chaiseD]} color={SOFA} />
						<Box position={[mainX, seatY, mainZ]} args={[mainW, seatH, mainD]} color={SOFA} />
						{/* Backs form an L on the outside — chaise along the wall, main behind the seats */}
						<Box
							position={[mainBackX, backY, mainBackZ]}
							args={[mainBackW, backH, backT]}
							color={SOFA_DARK}
						/>
						<Box
							position={[chaiseBackX, backY, chaiseZ]}
							args={[backT, backH, chaiseD]}
							color={SOFA_DARK}
						/>
					</>
				);
			})()}
			{/* Coffee table in front of the sectional */}
			<Box position={[tvX - 0.1, 0.32, livingZ]} args={[1.0, 0.08, 0.55]} color={WOOD_LIGHT} />
			{[
				[-0.4, -0.2],
				[0.4, -0.2],
				[-0.4, 0.2],
				[0.4, 0.2],
			].map((o, i) => (
				<Box
					key={i}
					position={[tvX - 0.1 + o[0], 0.16, livingZ + o[1]]}
					args={[0.04, 0.28, 0.04]}
					color={WOOD}
				/>
			))}

			{/* Sofa-wall windows, art, cat perch, litter robot */}
			<SofaWallDecor wallX={west} livingZ={livingZ} farZ={farZ} />

			{/* Credenza + TV — far wall; shifted left, a bit larger */}
			<Box
				position={[tvX - 0.35, 0.42, farZ + 0.28]}
				args={[1.85, 0.72, 0.48]}
				color={WOOD}
				roughness={0.5}
			/>
			<Box
				position={[tvX - 0.35, 1.52, farZ + 0.1]}
				args={[1.6, 0.9, 0.06]}
				color="#111"
				roughness={0.35}
				metalness={0.4}
			/>
			<Box position={[tvX - 0.35, 1.52, farZ + 0.14]} args={[1.42, 0.75, 0.02]} color="#1a3a6a" />

			{/*
			 * Mirror wall — east / right wall beside the dining table
			 * (right side when you walk in from the kitchen).
			 */}
			<MirrorWallDecor
				position={[east - 0.06, 0, diningZ]}
				rotation={[0, -Math.PI / 2, 0]}
			/>
			{/* Closet + bath door left of mirrors; boxes in front of closed closet */}
			<EastClosetDoors wallX={east} diningZ={diningZ} />
			<PianoAndCatBoxes wallX={east} farZ={farZ} boxesZ={closetDoors[1].z} />

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

/**
 * Round gold mirror + floating shelf with zebra & trinkets + pet bowls.
 * Local +Z faces into the room.
 */
function MirrorWallDecor({
	position,
	rotation,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	return (
		<group position={position} rotation={rotation}>
			<mesh position={[-0.55, 1.7, 0.02]}>
				<circleGeometry args={[0.07, 20]} />
				<meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
			</mesh>
			<mesh position={[-0.55, 1.7, 0.03]}>
				<circleGeometry args={[0.045, 20]} />
				<meshStandardMaterial color="#1a1a1a" roughness={0.5} />
			</mesh>
			<mesh position={[0, 1.75, 0.02]} castShadow>
				<torusGeometry args={[0.32, 0.025, 8, 32]} />
				<meshStandardMaterial color="#c4a06a" metalness={0.75} roughness={0.3} />
			</mesh>
			<mesh position={[0, 1.75, 0.03]}>
				<circleGeometry args={[0.3, 32]} />
				<meshStandardMaterial
					color="#b8c8d4"
					metalness={0.85}
					roughness={0.15}
					envMapIntensity={1.2}
				/>
			</mesh>
			<Box position={[0, 1.25, 0.08]} args={[0.85, 0.04, 0.16]} color="#5a4030" roughness={0.65} />
			<Box position={[-0.28, 1.32, 0.08]} args={[0.18, 0.1, 0.1]} color={BLACK} />
			<Box position={[-0.28, 1.38, 0.1]} args={[0.16, 0.02, 0.06]} color="#f4f2ee" />
			<mesh position={[-0.28, 1.45, 0.08]}>
				<sphereGeometry args={[0.035, 8, 8]} />
				<meshStandardMaterial color="#4a7ab0" roughness={0.7} />
			</mesh>
			<Box position={[-0.05, 1.31, 0.08]} args={[0.06, 0.08, 0.05]} color="#c45a4a" />
			<Box position={[0.08, 1.3, 0.08]} args={[0.05, 0.06, 0.05]} color="#e8e0d4" />
			<group position={[0.28, 1.32, 0.08]}>
				<Box position={[0, 0.04, 0]} args={[0.14, 0.08, 0.06]} color="#f4f2ee" />
				{[
					[-0.04, 0],
					[0.04, 0],
					[-0.02, 0.02],
					[0.02, -0.02],
				].map((o, i) => (
					<Box key={i} position={[o[0], 0.04, o[1]]} args={[0.03, 0.09, 0.015]} color={BLACK} />
				))}
				<Box position={[0.08, 0.06, 0]} args={[0.05, 0.05, 0.05]} color="#f4f2ee" />
				<Box position={[0.1, 0.06, 0]} args={[0.02, 0.04, 0.05]} color={BLACK} />
				{(
					[
						[-0.05, -0.04, -0.02],
						[-0.05, -0.04, 0.02],
						[0.04, -0.04, -0.02],
						[0.04, -0.04, 0.02],
					] as const
				).map((p, i) => (
					<Box key={i} position={[p[0], p[1], p[2]]} args={[0.02, 0.06, 0.02]} color="#f4f2ee" />
				))}
			</group>
			<Box position={[0.15, 0.01, 0.16]} args={[0.7, 0.02, 0.28]} color="#6a6a68" />
			<Box position={[-0.05, 0.12, 0.16]} args={[0.18, 0.22, 0.18]} color="#f4f2ee" />
			<Box position={[-0.05, 0.24, 0.16]} args={[0.16, 0.04, 0.16]} color="#2a2a2a" />
			<mesh position={[0.2, 0.06, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.08, 0.09, 0.04, 16]} />
				<meshStandardMaterial color="#c8c8c6" metalness={0.6} roughness={0.35} />
			</mesh>
			<mesh position={[0.2, 0.06, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.08, 0.09, 0.04, 16]} />
				<meshStandardMaterial color="#c8c8c6" metalness={0.6} roughness={0.35} />
			</mesh>
			<mesh position={[0.38, 0.1, 0.16]}>
				<cylinderGeometry args={[0.1, 0.11, 0.16, 16]} />
				<meshStandardMaterial color="#d8d8d6" metalness={0.7} roughness={0.3} />
			</mesh>
			<mesh position={[-0.45, 0.04, 0.14]} rotation={[0.2, 0.4, 0]}>
				<torusGeometry args={[0.1, 0.035, 8, 16]} />
				<meshStandardMaterial color="#7ec850" roughness={0.55} />
			</mesh>
		</group>
	);
}

/** Closet pair on east wall, left of mirrors when facing them (toward living / farZ). */
export const CLOSET_DOOR_W = 0.98;
/** Wall run between the two closet openings */
const CLOSET_DOOR_GAP = 0.5;

export function eastClosetDoors(diningZ: number) {
	/** Clear of mirror shelf (~0.55 toward far); nearer door stays by the mirrors */
	const startZ1 = diningZ - 0.62;
	const door0 = {
		z1: startZ1,
		z0: startZ1 - CLOSET_DOOR_W,
		get z() {
			return (this.z0 + this.z1) / 2;
		},
	};
	/** Left door (farther toward living) — nudged toward the mirrors */
	const leftExtra = 0;
	const door1 = {
		z1: door0.z0 - CLOSET_DOOR_GAP - leftExtra,
		z0: door0.z0 - CLOSET_DOOR_GAP - leftExtra - CLOSET_DOOR_W,
		get z() {
			return (this.z0 + this.z1) / 2;
		},
	};
	return [door0, door1] as const;
}

/** First door on the right when walking into living — hall bath entrance. */
export function getBathDoor() {
	const entryZ = DOOR.z;
	const depth = (22 + 6 / 12) * FT;
	const diningZ = entryZ - depth * 0.28;
	const d = eastClosetDoors(diningZ)[0];
	return {
		x: DOOR.x1,
		z: d.z,
		z0: d.z0,
		z1: d.z1,
		w: CLOSET_DOOR_W,
	};
}

/**
 * Closet doors on the walkway wall — first door is open into the bath;
 * second stays closed (cat boxes in front).
 */
function EastClosetDoors({ wallX, diningZ }: { wallX: number; diningZ: number }) {
	const doors = eastClosetDoors(diningZ);
	const leaf = '#f0eeea';
	const frame = '#e8e4dc';
	/** Index 0 = bath entrance (frame only); index 1 = closed closet */
	const closed = doors[1];

	return (
		<group position={[wallX - T / 2 - 0.01, 0, closed.z]} rotation={[0, -Math.PI / 2, 0]}>
			<Box position={[0, 2.12, 0.01]} args={[CLOSET_DOOR_W + 0.04, 0.06, 0.04]} color={frame} />
			<Box position={[0, 1.05, 0.01]} args={[CLOSET_DOOR_W - 0.04, 2.05, 0.04]} color={leaf} roughness={0.75} />
			<Box position={[0, 1.55, 0.035]} args={[CLOSET_DOOR_W - 0.22, 0.7, 0.015]} color="#e4e0d8" />
			<Box position={[0, 0.55, 0.035]} args={[CLOSET_DOOR_W - 0.22, 0.7, 0.015]} color="#e4e0d8" />
			<mesh position={[CLOSET_DOOR_W * 0.28, 1.05, 0.045]}>
				<sphereGeometry args={[0.022, 10, 10]} />
				<meshStandardMaterial color="#c4a06a" metalness={0.7} roughness={0.3} />
			</mesh>
		</group>
	);
}

/**
 * Digital piano near the primary doorway; cat houses in front of a closet door.
 */
function PianoAndCatBoxes({
	wallX,
	farZ,
	boxesZ,
}: {
	wallX: number;
	farZ: number;
	boxesZ: number;
}) {
	/** Face into the room (−X); width runs along the wall (Z) */
	const x = wallX - 0.28;
	const pianoZ = farZ + 0.95;

	return (
		<>
			<group position={[x, 0, pianoZ]} rotation={[0, -Math.PI / 2, 0]}>
				{/* Body */}
				<Box position={[0, 0.55, 0]} args={[1.35, 0.12, 0.38]} color={BLACK} roughness={0.45} />
				<Box position={[0, 0.42, 0.02]} args={[1.3, 0.14, 0.32]} color="#111" roughness={0.5} />
				{(
					[
						[-0.58, -0.12],
						[0.58, -0.12],
						[-0.58, 0.12],
						[0.58, 0.12],
					] as const
				).map((o, i) => (
					<Box
						key={i}
						position={[o[0], 0.22, o[1]]}
						args={[0.04, 0.42, 0.04]}
						color={BLACK}
						roughness={0.5}
					/>
				))}
				<Box position={[0, 0.62, 0.14]} args={[1.15, 0.03, 0.12]} color="#f4f2ee" roughness={0.7} />
				{([-0.45, -0.25, -0.05, 0.15, 0.35] as const).map((kx, i) => (
					<Box
						key={i}
						position={[kx, 0.635, 0.12]}
						args={[0.06, 0.02, 0.08]}
						color={BLACK}
						roughness={0.4}
					/>
				))}
				<Box position={[0, 0.78, -0.12]} args={[1.2, 0.35, 0.04]} color={BLACK} roughness={0.5} />
				<mesh position={[-0.4, 0.78, 0.02]}>
					<cylinderGeometry args={[0.035, 0.04, 0.22, 10]} />
					<meshStandardMaterial color="#f2f0ec" roughness={0.8} />
				</mesh>
				<Box position={[0.05, 0.85, -0.05]} args={[0.22, 0.28, 0.03]} color="#e8e0d4" />
				<Box position={[0.05, 0.85, -0.03]} args={[0.17, 0.22, 0.01]} color="#c4a890" />
				<Box position={[0.35, 0.72, 0.02]} args={[0.12, 0.1, 0.02]} color="#d8d4cc" />
				{/* Bench */}
				<Box position={[0, 0.28, 0.42]} args={[0.55, 0.05, 0.28]} color={BLACK} roughness={0.5} />
				{(
					[
						[-0.22, -0.08],
						[0.22, -0.08],
						[-0.22, 0.08],
						[0.22, 0.08],
					] as const
				).map((o, i) => (
					<Box
						key={`bn-${i}`}
						position={[o[0], 0.14, 0.42 + o[1]]}
						args={[0.03, 0.26, 0.03]}
						color={BLACK}
					/>
				))}
			</group>

			{/* Cat houses in front of the far closet door */}
			<group position={[x, 0, boxesZ]} rotation={[0, -Math.PI / 2, 0]}>
				{/* Pink house */}
				<Box position={[-0.55, 0.2, 0]} args={[0.32, 0.38, 0.28]} color="#f2e8e8" />
				<Box position={[-0.55, 0.12, 0.15]} args={[0.12, 0.14, 0.02]} color="#e8a0a8" />
				{/* Checkered */}
				<Box position={[-0.15, 0.22, 0]} args={[0.3, 0.42, 0.26]} color="#f4f2ee" />
				{[0, 1, 2, 3].map((i) => (
					<Box
						key={i}
						position={[
							-0.15 + ((i % 2) - 0.5) * 0.12,
							0.12 + Math.floor(i / 2) * 0.14,
							0.14,
						]}
						args={[0.1, 0.1, 0.01]}
						color={i % 2 ? BLACK : '#f4f2ee'}
					/>
				))}
				{/* Red striped “burger” shop */}
				<Box position={[0.25, 0.16, 0]} args={[0.28, 0.3, 0.24]} color="#c23b2e" />
				<Box position={[0.25, 0.28, 0]} args={[0.3, 0.06, 0.26]} color="#f4f2ee" />
				{/* Grey felt cave */}
				<mesh position={[0.6, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.18, 0.2, 0.28, 12]} />
					<meshStandardMaterial color="#8a8a88" roughness={0.95} />
				</mesh>
			</group>
		</>
	);
}

/** Tall living-room windows on the west / sofa wall (matches photo). */
const SOFA_WIN = {
	w: 0.78,
	h: 1.95,
	y: 1.28,
	/** Clear wall between the two openings */
	gap: 0.85,
};

/**
 * Two window centers along −Z from the sofa: left (cats) nearer dining,
 * right nearer the TV / litter robot.
 */
function sofaWallWindows(livingZ: number, farZ: number) {
	const leftZ = livingZ + 0.15;
	const rightZ = leftZ - SOFA_WIN.w - SOFA_WIN.gap;
	const mk = (z: number) => ({
		z,
		z1: z + SOFA_WIN.w / 2,
		z0: z - SOFA_WIN.w / 2,
	});
	const wins = [mk(leftZ), mk(rightZ)] as const;
	/** Keep right window clear of the far wall */
	if (wins[1].z0 < farZ + 0.35) {
		const shift = farZ + 0.35 - wins[1].z0;
		return [mk(leftZ + shift), mk(rightZ + shift)] as const;
	}
	return wins;
}

/**
 * Black-framed windows, art, window cat perch, and litter robot on the sofa wall.
 */
function SofaWallDecor({
	wallX,
	livingZ,
	farZ,
}: {
	wallX: number;
	livingZ: number;
	farZ: number;
}) {
	const wins = sofaWallWindows(livingZ, farZ);
	const frame = '#1a1a1a';
	const glass = '#b7c9d6';
	const xGlass = wallX + T / 2 + 0.05;

	return (
		<group>
			{wins.map((win, i) => (
				<group key={i} position={[xGlass, SOFA_WIN.y, win.z]}>
					{/* Glass */}
					<mesh castShadow>
						<boxGeometry args={[0.03, SOFA_WIN.h, SOFA_WIN.w]} />
						<meshStandardMaterial
							color={glass}
							roughness={0.22}
							metalness={0.12}
							polygonOffset
							polygonOffsetFactor={-4}
							polygonOffsetUnits={-4}
						/>
					</mesh>
					{/* Black frame */}
					<Box
						position={[0.02, SOFA_WIN.h / 2, 0]}
						args={[0.045, 0.055, SOFA_WIN.w + 0.09]}
						color={frame}
						roughness={0.7}
					/>
					<Box
						position={[0.02, -SOFA_WIN.h / 2, 0]}
						args={[0.045, 0.055, SOFA_WIN.w + 0.09]}
						color={frame}
						roughness={0.7}
					/>
					<Box
						position={[0.02, 0, SOFA_WIN.w / 2]}
						args={[0.045, SOFA_WIN.h + 0.08, 0.055]}
						color={frame}
						roughness={0.7}
					/>
					<Box
						position={[0.02, 0, -SOFA_WIN.w / 2]}
						args={[0.045, SOFA_WIN.h + 0.08, 0.055]}
						color={frame}
						roughness={0.7}
					/>
					{/* Soft exterior light bleed */}
					<pointLight position={[-0.15, 0.1, 0]} intensity={0.35} distance={3.5} color="#e8f0ff" />
				</group>
			))}

			{/* Framed art — left of the left window */}
			<group position={[wallX + 0.08, 1.55, wins[0].z1 + 0.55]}>
				<Box position={[0, 0, 0]} args={[0.04, 0.7, 0.55]} color="#2a2a2a" />
				<Box position={[0.025, 0, 0]} args={[0.02, 0.62, 0.48]} color="#6a7a88" />
				<Box position={[0.03, 0.05, -0.05]} args={[0.015, 0.25, 0.2]} color="#c4a06a" />
				<Box position={[0.03, -0.12, 0.1]} args={[0.015, 0.18, 0.15]} color="#3a4a3a" />
			</group>

			{/* Litter robot — west wall corner by the TV / credenza wall */}
			<group position={[wallX + 0.32, 0, farZ + 0.45]}>
				<mesh position={[0, 0.28, 0]}>
					<sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
					<meshStandardMaterial color="#f4f2ee" roughness={0.55} />
				</mesh>
				<mesh position={[0, 0.12, 0]}>
					<cylinderGeometry args={[0.26, 0.28, 0.22, 16]} />
					<meshStandardMaterial color="#f0eeea" roughness={0.6} />
				</mesh>
				<Box position={[0.18, 0.2, 0.05]} args={[0.08, 0.12, 0.14]} color="#e8e4dc" />
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.32, 20]} />
					<meshStandardMaterial color="#2a2a2a" roughness={0.95} />
				</mesh>
			</group>

			{/* Small dark rug under litter */}
			<Box
				position={[wallX + 0.45, 0.015, farZ + 0.5]}
				args={[0.7, 0.02, 0.85]}
				color="#1a1a1a"
				roughness={0.98}
			/>
		</group>
	);
}

/** Dining north wall (kitchen side): shelf → closet door → globe + art. */
function diningNorthLayout(west: number, doorX0: number) {
	const doorW = 0.85;
	/** Door centered on the wall run, a bit toward the kitchen opening */
	const doorX = west + (doorX0 - west) * 0.55;
	const door = {
		w: doorW,
		x: doorX,
		x0: doorX - doorW / 2,
		x1: doorX + doorW / 2,
	};
	const shelfX = door.x1 + (doorX0 - door.x1) * 0.45;
	const globeX = west + (door.x0 - west) * 0.45;
	return { door, shelfX, globeX };
}

/**
 * Black shelf + animal art by the kitchen, white closet door, globe + skyline art.
 * Wall faces into the room (−Z).
 */
function DiningNorthWallDecor({
	wallZ,
	west,
	doorX0,
}: {
	wallZ: number;
	west: number;
	doorX0: number;
}) {
	const { door, shelfX, globeX } = diningNorthLayout(west, doorX0);
	const z = wallZ - T / 2 - 0.02;
	const leaf = '#f0eeea';
	const frame = '#e8e4dc';

	return (
		<group>
			{/* White closet door */}
			<group position={[door.x, 0, z]}>
				<Box position={[0, 2.12, 0.01]} args={[door.w + 0.04, 0.06, 0.04]} color={frame} />
				<Box position={[0, 1.05, 0.01]} args={[door.w - 0.04, 2.05, 0.04]} color={leaf} roughness={0.75} />
				{[0.55, 1.05, 1.55].map((y, i) => (
					<Box
						key={i}
						position={[0, y, 0.035]}
						args={[door.w - 0.2, 0.38, 0.015]}
						color="#e4e0d8"
					/>
				))}
				<mesh position={[door.w * 0.28, 1.05, 0.045]}>
					<boxGeometry args={[0.08, 0.02, 0.03]} />
					<meshStandardMaterial color={BLACK} metalness={0.6} roughness={0.35} />
				</mesh>
			</group>

			{/* Black metal shelf + animal art (toward kitchen) */}
			<group position={[shelfX, 0, z - 0.08]}>
				{/* Frame art */}
				<Box position={[0, 1.85, 0.02]} args={[0.7, 0.48, 0.04]} color="#3a2e26" />
				<Box position={[0, 1.85, 0.04]} args={[0.6, 0.38, 0.02]} color="#c4a882" />
				{[-0.18, -0.05, 0.1, 0.2].map((ox, i) => (
					<Box
						key={i}
						position={[ox, 1.82 + (i % 2) * 0.06, 0.055]}
						args={[0.1, 0.08, 0.015]}
						color={i % 2 ? '#2a2a2a' : '#6a5040'}
					/>
				))}
				{/* Shelf frame */}
				<Box position={[0, 1.35, 0]} args={[0.72, 0.025, 0.28]} color={BLACK} />
				<Box position={[0, 0.95, 0]} args={[0.72, 0.025, 0.28]} color={BLACK} />
				<Box position={[0, 0.55, 0]} args={[0.72, 0.025, 0.28]} color={BLACK} />
				<Box position={[0, 0.2, 0]} args={[0.72, 0.025, 0.28]} color={BLACK} />
				{[-0.34, 0.34].map((sx, i) => (
					<Box key={i} position={[sx, 0.775, 0]} args={[0.025, 1.15, 0.025]} color={BLACK} />
				))}
				{/* Phone + frames on top */}
				<Box position={[-0.2, 1.42, 0.02]} args={[0.14, 0.1, 0.1]} color={BLACK} />
				<Box position={[-0.2, 1.48, 0.02]} args={[0.08, 0.04, 0.08]} color="#1a1a1a" />
				<Box position={[0.05, 1.42, 0.02]} args={[0.1, 0.12, 0.04]} color="#e8e0d4" />
				<Box position={[0.22, 1.4, 0.02]} args={[0.08, 0.1, 0.03]} color="#d4cfc6" />
				{/* Baskets */}
				{(
					[
						[-0.2, 1.1],
						[0.18, 1.1],
						[-0.2, 0.7],
						[0.18, 0.7],
						[-0.2, 0.35],
						[0.18, 0.35],
					] as const
				).map(([bx, by], i) => (
					<Box key={i} position={[bx, by, 0.02]} args={[0.26, 0.2, 0.2]} color="#c4a06a" roughness={0.9} />
				))}
				{/* Small bits on middle shelf */}
				<mesh position={[0, 1.02, 0.05]}>
					<cylinderGeometry args={[0.04, 0.04, 0.08, 10]} />
					<meshStandardMaterial color="#c23b2e" roughness={0.4} />
				</mesh>
				<mesh position={[0.12, 1.0, 0.05]}>
					<cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
					<meshStandardMaterial color="#d8d4cc" metalness={0.3} roughness={0.5} />
				</mesh>
			</group>

			{/* Globe + skyline / buildings art (toward west corner) */}
			<group position={[globeX, 0, z - 0.05]}>
				<Box position={[0.15, 1.7, 0.02]} args={[0.72, 0.42, 0.04]} color="#5a4030" />
				<Box position={[0.15, 1.7, 0.04]} args={[0.62, 0.32, 0.02]} color="#d8e0e8" />
				{[-0.2, -0.05, 0.08, 0.2].map((ox, i) => (
					<Box
						key={i}
						position={[0.15 + ox, 1.62 + i * 0.03, 0.055]}
						args={[0.06, 0.12 + i * 0.04, 0.015]}
						color={i % 2 ? '#4a6a8a' : '#2a3a4a'}
					/>
				))}
				{/* Tripod globe */}
				<group position={[-0.15, 0, -0.12]}>
					<mesh position={[0, 1.05, 0]}>
						<sphereGeometry args={[0.22, 16, 16]} />
						<meshStandardMaterial color="#3a6a4a" roughness={0.55} />
					</mesh>
					<mesh position={[0, 1.05, 0]}>
						<sphereGeometry args={[0.221, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
						<meshStandardMaterial color="#2a4a8a" roughness={0.5} />
					</mesh>
					<Box position={[0, 0.78, 0]} args={[0.04, 0.08, 0.04]} color={WOOD} />
					{(
						[
							[0, -0.12],
							[0.1, 0.08],
							[-0.1, 0.08],
						] as const
					).map((o, i) => (
						<Box
							key={i}
							position={[o[0], 0.4, o[1]]}
							args={[0.03, 0.75, 0.03]}
							color={WOOD}
							rotation={[0.15, 0, i === 0 ? 0 : i === 1 ? -0.25 : 0.25]}
						/>
					))}
				</group>
			</group>
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
	const bayMidX = (wallX + xOuter) / 2;

	/**
	 * face = +1 means frames/glass sit toward local +X (into the bay).
	 * Never use negative scale — it flips normals and hides the pane.
	 */
	function WindowPane({
		width,
		face = 1,
		mullion = false,
	}: {
		width: number;
		face?: 1 | -1;
		mullion?: boolean;
	}) {
		const f = face;
		return (
			<group>
				<mesh position={[0, 0, 0]} castShadow>
					<boxGeometry args={[0.035, winH, width]} />
					<meshStandardMaterial
						color={glass}
						roughness={0.28}
						metalness={0.1}
						polygonOffset
						polygonOffsetFactor={-4}
						polygonOffsetUnits={-4}
					/>
				</mesh>
				{/* Frame / blind offset along face so nothing shares the glass plane */}
				<mesh position={[f * 0.028, winH / 2, 0]}>
					<boxGeometry args={[0.05, 0.06, width + 0.1]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				<mesh position={[f * 0.028, -winH / 2, 0]}>
					<boxGeometry args={[0.05, 0.06, width + 0.1]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				<mesh position={[f * 0.028, 0, -width / 2]}>
					<boxGeometry args={[0.05, winH + 0.08, 0.06]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				<mesh position={[f * 0.028, 0, width / 2]}>
					<boxGeometry args={[0.05, winH + 0.08, 0.06]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				{mullion && (
					<mesh position={[f * 0.032, 0, 0]}>
						<boxGeometry args={[0.04, winH - 0.06, 0.045]} />
						<meshStandardMaterial color={frame} roughness={0.85} />
					</mesh>
				)}
				<mesh position={[f * 0.04, winH / 2 - 0.12, 0]}>
					<boxGeometry args={[0.025, 0.2, width - 0.08]} />
					<meshStandardMaterial color={blind} roughness={0.95} />
				</mesh>
			</group>
		);
	}

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
		/** Local +X in world XZ after rotY */
		const lx = dz / len;
		const lz = -dx / len;
		/** +1 if local +X points into the bay (toward desk) */
		const toBayX = bayMidX + 0.2 - midX;
		const toBayZ = cz - midZ;
		const face: 1 | -1 = lx * toBayX + lz * toBayZ >= 0 ? 1 : -1;
		const winW = Math.min(len * 0.7, 1.05);
		return (
			<group key={key} position={[midX, 0, midZ]} rotation={[0, rotY, 0]}>
				{/* Slightly short so ends don’t z-fight the center wall */}
				<Box position={[0, 1.35, 0]} args={[T, 2.7, len - 0.04]} color={WALL} roughness={0.95} />
				<group position={[face * (T * 0.5 + 0.045), winY, 0]}>
					<WindowPane width={winW} face={face} />
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

			{/* Outer center wall — shorter than opening so sides don’t overlap */}
			<Box position={[xOuter, 1.35, cz]} args={[T, 2.7, centerW - 0.02]} color={WALL} roughness={0.95} />
			{/* Interior face of west outer wall is +X; keep glass well clear of the wall slab */}
			<group position={[xOuter + T / 2 + 0.06, winY, cz]}>
				<WindowPane width={centerW * 0.7} face={1} mullion />
			</group>

			{/* Side walls: wall opening corners → outer center corners */}
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

/**
 * Main sofa seat spots (local plan coords, inside kitchen flip group).
 * Faces −Z toward the TV wall.
 */
export function getSofaSeats() {
	const entryZ = DOOR.z;
	const depth = (22 + 6 / 12) * FT;
	const livingZ = entryZ - depth * 0.62;
	const tvX = PRIMARY_DOOR.tvX;
	const seatZ = livingZ + 0.38;
	return {
		/** Seat cushion top */
		seatY: 0.65,
		yaw: Math.PI,
		tony: [tvX - 0.48, 0, seatZ] as [number, number, number],
		alex: [tvX + 0.42, 0, seatZ] as [number, number, number],
	};
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
