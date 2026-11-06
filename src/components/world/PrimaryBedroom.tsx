import { useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { FT, PLAN, PLAN_CENTERS } from './condoLayout';

const WALL = '#eae8e4';
const FLOOR = '#3a2e26';
const BLACK = '#1a1a1a';
const CREAM = '#ebe6dc';
const OLIVE = '#5a5e48';
const OLIVE_DARK = '#4a4e3a';
const ORANGE = '#c47a4a';
const WOOD = '#c4a882';
const RUG = '#e8e4dc';
const T = 0.14;

/** Must match LivingDining.DOOR (kitchen ↔ living opening). */
const KITCHEN_DOOR = {
	w: 1.25,
	get x0() {
		return PLAN.kitchen.x + 0.04;
	},
	get x1() {
		return this.x0 + this.w;
	},
	get z() {
		return PLAN.kitchen.z;
	},
};

/** Living depth — must match LivingDining */
const LIVING_DEPTH = (22 + 6 / 12) * FT;

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

/**
 * Double doors in the living far (TV) wall, immediately to the RIGHT of the TV
 * (east / walkway side — reads right after the kitchen flip).
 */
export const PRIMARY_DOOR = {
	w: 1.25,
	get livingEast() {
		return KITCHEN_DOOR.x1;
	},
	get livingWest() {
		return this.livingEast - PLAN.living.w;
	},
	get livingFarZ() {
		return KITCHEN_DOOR.z - LIVING_DEPTH;
	},
	/** On the TV wall */
	get z() {
		return this.livingFarZ;
	},
	/**
	 * Door center X — flush to the east/walkway wall (right of TV).
	 * Small jamb clearance from the wall edge.
	 */
	get x() {
		return this.livingEast - this.w / 2 - 0.12;
	},
	get x0() {
		return this.x - this.w / 2;
	},
	get x1() {
		return this.x + this.w / 2;
	},
	/** TV center on the far wall, immediately left of the doors */
	get tvX() {
		return this.x0 - 1.0;
	},
};
/**
 * Clickable double doors on the living far wall (right of TV).
 */
export function LivingPrimaryDoor({
	fromRoom = 'living',
	onPassThrough,
}: {
	fromRoom?: 'living' | 'primary';
	onPassThrough?: (to: 'living' | 'primary') => void;
}) {
	const [hovered, setHovered] = useState(false);
	const toRoom = fromRoom === 'living' ? 'primary' : 'living';
	const title = toRoom === 'primary' ? 'Primary' : 'Living';

	return (
		<group
			position={[PRIMARY_DOOR.x, 0, PRIMARY_DOOR.z]}
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
			{/* Open doorway — frame only (no leaves/handles that float in the opening) */}
			<Box
				position={[-PRIMARY_DOOR.w / 2, 1.1, 0]}
				args={[0.12, 2.25, 0.14]}
				color={hovered ? '#f7f5f1' : '#f2f0ec'}
			/>
			<Box
				position={[PRIMARY_DOOR.w / 2, 1.1, 0]}
				args={[0.12, 2.25, 0.14]}
				color={hovered ? '#f7f5f1' : '#f2f0ec'}
			/>
			<Box
				position={[0, 2.25, 0]}
				args={[PRIMARY_DOOR.w + 0.16, 0.14, 0.14]}
				color={hovered ? '#f7f5f1' : '#f2f0ec'}
			/>
			{/* Click volume spanning both sides of the threshold */}
			<mesh position={[0, 1.1, -0.35]}>
				<boxGeometry args={[PRIMARY_DOOR.w * 1.05, 2.2, 1.2]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			<Html
				position={[0, 2.6, -0.35]}
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
 * Primary bedroom south of living, entered through the doors right of the TV.
 */
export function PrimaryBedroom() {
	const north = PRIMARY_DOOR.z;
	const depth = (16 + 3 / 12) * FT;
	const south = north - depth;
	const livingWest = PRIMARY_DOOR.livingWest;
	const livingEast = PRIMARY_DOOR.livingEast;
	/** Room spans living width so the far-wall doors sit on the north edge */
	const west = livingWest - 0.4;
	const east = livingEast + 0.05;
	const w = east - west;
	const cx = (west + east) / 2;
	const cz = (north + south) / 2;

	/**
	 * Floor-plan shape (walk in from north looking south):
	 *   left (west) = fireplace wall
	 *   far-left corner = bay bump-out sticking out SW
	 *   back (south) = bed + windows
	 */
	/** Bay opening size — west/south stubs stop here so 3 window panels fill the corner */
	const bayAlongW = 1.55;
	const bayAlongS = 1.7;
	const bayDepth = 1.15;
	const bayWest = west - bayDepth * 0.55;
	const baySouth = south - bayDepth;
	const fireX = west + 0.15;
	const fireZ = south + bayAlongW + 1.1;
	const bedX = (west + bayAlongS + east) / 2 + 0.15;
	const bedZ = south + 1.1;
	/** Center of TV-wall segment left of bedroom doors (shelf) */
	const shelfX = (west + PRIMARY_DOOR.x0) / 2;

	return (
		<group>
			{/* Main floor */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.002, cz]} receiveShadow>
				<planeGeometry args={[w + 0.15, depth + 0.15]} />
				<meshStandardMaterial color={FLOOR} roughness={0.88} />
			</mesh>
			{/* Bay floor bump-out */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[west + bayAlongS * 0.35, 0.003, south - bayDepth * 0.45]}
				receiveShadow
			>
				<planeGeometry args={[bayAlongS + bayDepth * 0.8, bayAlongW + bayDepth * 0.9]} />
				<meshStandardMaterial color={FLOOR} roughness={0.88} />
			</mesh>

			{/* Continuity through doorway */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[PRIMARY_DOOR.x, 0.003, north + 0.15]}
				receiveShadow
			>
				<planeGeometry args={[PRIMARY_DOOR.w + 0.2, 0.5]} />
				<meshStandardMaterial color={FLOOR} roughness={0.88} />
			</mesh>

			{/* North wall — gap for doorway */}
			{(() => {
				const leftW = Math.max(0.15, PRIMARY_DOOR.x0 - west);
				const rightW = east - PRIMARY_DOOR.x1;
				return (
					<>
						<Box
							position={[west + leftW / 2, 1.35, north]}
							args={[leftW, 2.7, T]}
							color={WALL}
							roughness={0.95}
						/>
						{rightW > 0.04 && (
							<Box
								position={[PRIMARY_DOOR.x1 + rightW / 2, 1.35, north]}
								args={[rightW, 2.7, T]}
								color={WALL}
								roughness={0.95}
							/>
						)}
					</>
				);
			})()}
			{/* South / back wall — starts east of bay opening */}
			<Box
				position={[(west + bayAlongS + east) / 2, 1.35, south]}
				args={[east - (west + bayAlongS), 2.7, T]}
				color={WALL}
				roughness={0.95}
			/>
			{/* West / left wall — stops north of bay opening */}
			<Box
				position={[west, 1.35, (north + south + bayAlongW) / 2]}
				args={[T, 2.7, north - (south + bayAlongW)]}
				color={WALL}
				roughness={0.95}
			/>
			{/* East wall */}
			<Box position={[east, 1.35, cz]} args={[T, 2.7, depth]} color={WALL} roughness={0.95} />

			{/* ——— Corner bay bump-out (far-left when walking in) ——— */}
			<CornerBaySW
				west={west}
				south={south}
				alongW={bayAlongW}
				alongS={bayAlongS}
				bayWest={bayWest}
				baySouth={baySouth}
			/>

			{/* ——— Black brick fireplace (left wall, above the bay) ——— */}
			<Box
				position={[fireX, 1.35, fireZ]}
				args={[0.28, 2.7, 1.5]}
				color="#1c1c1c"
				roughness={0.92}
			/>
			{[0.35, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45].map((y, i) => (
				<Box
					key={i}
					position={[fireX + 0.145, y, fireZ]}
					args={[0.02, 0.02, 1.45]}
					color="#121212"
					roughness={1}
				/>
			))}
			<Box
				position={[fireX + 0.2, 0.55, fireZ]}
				args={[0.18, 0.55, 1.15]}
				color="#0a0a0a"
				roughness={0.4}
				metalness={0.3}
			/>
			<Box
				position={[fireX + 0.28, 0.55, fireZ]}
				args={[0.06, 0.38, 1.0]}
				color="#e8e0d4"
				roughness={0.9}
			/>
			<Box position={[fireX + 0.16, 1.85, fireZ]} args={[0.04, 0.85, 0.85]} color={CREAM} />
			<mesh position={[fireX + 0.19, 1.85, fireZ]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.28, 0.28, 0.03, 32]} />
				<meshStandardMaterial color="#d45a2a" roughness={0.7} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[fireX + 0.85, 0.03, fireZ]}>
				<circleGeometry args={[0.55, 16]} />
				<meshStandardMaterial color="#f0ebe3" roughness={1} />
			</mesh>

			{/* ——— Ladder shelf on TV wall (left of bedroom doors) ——— */}
			<BedroomShelf position={[shelfX, 0, north - 0.12]} rotation={[0, Math.PI, 0]} />
			{/* Tall plant near fireplace */}
			<group position={[west + 0.55, 0, fireZ + 0.9]}>
				<mesh position={[0, 0.2, 0]}>
					<cylinderGeometry args={[0.2, 0.16, 0.38, 10]} />
					<meshStandardMaterial color="#c4a882" roughness={0.9} />
				</mesh>
				<Box position={[0, 0.85, 0]} args={[0.12, 1.1, 0.12]} color="#2d5a32" />
				{[
					[0.18, 1.2, 0.05],
					[-0.16, 1.35, -0.08],
					[0.08, 1.55, 0.14],
					[-0.1, 1.7, 0.02],
					[0.14, 1.85, -0.1],
				].map((p, i) => (
					<Box
						key={i}
						position={p as [number, number, number]}
						args={[0.35, 0.28, 0.12]}
						color={i % 2 ? '#3f7a45' : '#2d5a32'}
					/>
				))}
			</group>

			{/* ——— Bed on back wall ——— */}
			<Box position={[bedX, 0.02, bedZ]} args={[2.8, 0.03, 3.0]} color={RUG} />
			<Box position={[bedX, 0.35, bedZ]} args={[1.85, 0.45, 2.15]} color={CREAM} />
			<Box position={[bedX, 0.95, bedZ - 0.95]} args={[1.85, 0.85, 0.14]} color={CREAM} />
			<Box position={[bedX, 0.62, bedZ + 0.05]} args={[1.7, 0.18, 1.95]} color={OLIVE} />
			<Box position={[bedX, 0.72, bedZ + 0.08]} args={[1.65, 0.12, 1.7]} color={OLIVE_DARK} />
			<Box position={[bedX - 0.35, 0.82, bedZ - 0.7]} args={[0.55, 0.22, 0.38]} color={OLIVE} />
			<Box position={[bedX + 0.35, 0.82, bedZ - 0.7]} args={[0.55, 0.22, 0.38]} color={OLIVE} />
			<Box position={[bedX - 1.15, 0.35, bedZ - 0.7]} args={[0.4, 0.08, 0.4]} color={WOOD} />
			{[
				[-0.12, -0.12],
				[0.12, -0.12],
				[-0.12, 0.12],
				[0.12, 0.12],
			].map((o, i) => (
				<Box
					key={`nsL${i}`}
					position={[bedX - 1.15 + o[0], 0.18, bedZ - 0.7 + o[1]]}
					args={[0.04, 0.32, 0.04]}
					color={WOOD}
				/>
			))}
			<Box position={[bedX + 1.15, 0.35, bedZ - 0.7]} args={[0.4, 0.08, 0.4]} color={WOOD} />
			{[
				[-0.12, -0.12],
				[0.12, -0.12],
				[-0.12, 0.12],
				[0.12, 0.12],
			].map((o, i) => (
				<Box
					key={`nsR${i}`}
					position={[bedX + 1.15 + o[0], 0.18, bedZ - 0.7 + o[1]]}
					args={[0.04, 0.32, 0.04]}
					color={WOOD}
				/>
			))}

			{/* Cloud art — centered above headboard between the two windows */}
			<group position={[bedX, 2.05, south + 0.04]}>
				{/* Light wood frame */}
				<Box position={[0, 0, 0]} args={[0.72, 0.72, 0.04]} color="#e8e0d4" roughness={0.7} />
				{/* Warm tan canvas */}
				<Box position={[0, 0, 0.025]} args={[0.62, 0.62, 0.02]} color="#c4a06a" roughness={0.9} />
				{/* White cloud — overlapping puffs */}
				{(
					[
						[0, -0.02, 0.08],
						[-0.1, 0.02, 0.07],
						[0.1, 0.02, 0.07],
						[-0.18, -0.04, 0.06],
						[0.16, -0.03, 0.06],
						[0.02, 0.08, 0.07],
					] as const
				).map(([x, y, r], i) => (
					<mesh key={i} position={[x, y, 0.045]}>
						<sphereGeometry args={[r, 12, 12]} />
						<meshStandardMaterial color="#f7f5f1" roughness={0.85} />
					</mesh>
				))}
			</group>

			{/* Two windows on back wall (floor plan) */}
			{(
				[
					[bedX - 0.55, south - 0.02],
					[bedX + 0.55, south - 0.02],
				] as const
			).map(([wx, wz], i) => (
				<group key={i} position={[wx, 1.55, wz]}>
					<Box
						position={[0, 0, 0]}
						args={[0.85, 1.45, 0.05]}
						color="#c5d8e8"
						roughness={0.25}
						metalness={0.15}
					/>
					<Box position={[0, 0.75, 0]} args={[0.92, 0.06, 0.07]} color={BLACK} />
					<Box position={[0, -0.75, 0]} args={[0.92, 0.06, 0.07]} color={BLACK} />
					<Box position={[-0.44, 0, 0]} args={[0.06, 1.5, 0.07]} color={BLACK} />
					<Box position={[0.44, 0, 0]} args={[0.06, 1.5, 0.07]} color={BLACK} />
					<Box position={[0, 0.52, -0.03]} args={[0.78, 0.26, 0.03]} color="#e8e4dc" />
				</group>
			))}

			{/* Floor lamp — left of the left nightstand */}
			<Box position={[bedX - 1.65, 0.85, bedZ - 0.7]} args={[0.03, 1.7, 0.03]} color="#6a6a68" />
			<mesh position={[bedX - 1.65, 1.72, bedZ - 0.7]} rotation={[-0.4, 0, 0]}>
				<cylinderGeometry args={[0.18, 0.18, 0.04, 24]} />
				<meshStandardMaterial color="#5a5a58" metalness={0.5} roughness={0.4} />
			</mesh>
			<pointLight
				position={[bedX - 1.65, 1.65, bedZ - 0.7]}
				intensity={0.35}
				distance={4}
				color="#fff4e0"
			/>

			<pointLight position={[cx, 2.45, cz]} intensity={0.75} distance={12} color="#fff4e8" />
			<pointLight position={[fireX + 1.0, 2.1, fireZ]} intensity={0.4} distance={6} color="#ffd8a8" />
		</group>
	);
}

/**
 * Mid-century ladder shelf with knick-knacks (photo) —
 * local +Z faces into the room; width along local X.
 */
function BedroomShelf({
	position,
	rotation,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	const shelfW = 2.05;
	const shelfD = 0.22;
	const wood = '#d4b896';
	const woodDark = '#c4a882';
	const ys = [0.55, 0.95, 1.35, 1.75, 2.15];
	const posts = [-0.95, -0.32, 0.32, 0.95] as const;

	return (
		<group position={position} rotation={rotation}>
			{/* Four uprights */}
			{posts.map((x) => (
				<Box
					key={`up-${x}`}
					position={[x, 1.35, 0]}
					args={[0.045, 2.35, 0.045]}
					color={wood}
					roughness={0.75}
				/>
			))}
			{/* Five shelves */}
			{ys.map((y, i) => (
				<Box
					key={`sh-${i}`}
					position={[0, y, 0.02]}
					args={[shelfW, 0.035, shelfD]}
					color={i % 2 ? woodDark : wood}
					roughness={0.7}
				/>
			))}

			{/* ——— Knick-knacks (stylized, spread across wider shelf) ——— */}
			{/* Top: framed art cluster */}
			<Box position={[-0.7, ys[4] + 0.22, 0.02]} args={[0.28, 0.38, 0.04]} color="#e8e0d4" />
			<Box position={[-0.7, ys[4] + 0.22, 0.05]} args={[0.22, 0.3, 0.02]} color="#8a9aaa" />
			<Box position={[-0.35, ys[4] + 0.16, 0.02]} args={[0.18, 0.26, 0.04]} color="#f2f0ec" />
			<Box position={[-0.35, ys[4] + 0.16, 0.05]} args={[0.14, 0.2, 0.02]} color="#c4b8a8" />
			<Box position={[0.05, ys[4] + 0.18, 0.02]} args={[0.2, 0.3, 0.04]} color="#d8c8b0" />
			<Box position={[0.05, ys[4] + 0.18, 0.05]} args={[0.15, 0.24, 0.02]} color="#6a7a8a" />
			<Box position={[0.45, ys[4] + 0.14, 0.02]} args={[0.16, 0.22, 0.04]} color="#3a5a7a" />
			<Box position={[0.45, ys[4] + 0.14, 0.05]} args={[0.12, 0.16, 0.02]} color="#6a8aaa" />
			<Box position={[0.78, ys[4] + 0.12, 0.02]} args={[0.14, 0.18, 0.04]} color="#f0ebe3" />
			<Box position={[0.78, ys[4] + 0.12, 0.05]} args={[0.1, 0.14, 0.02]} color="#c45a4a" />

			{/* 2nd: jars, mint clock, books */}
			<mesh position={[-0.8, ys[3] + 0.08, 0.02]}>
				<cylinderGeometry args={[0.05, 0.055, 0.12, 10]} />
				<meshStandardMaterial color="#e8e4dc" roughness={0.6} />
			</mesh>
			<mesh position={[-0.62, ys[3] + 0.07, 0.02]}>
				<cylinderGeometry args={[0.04, 0.045, 0.1, 10]} />
				<meshStandardMaterial color="#d8d4cc" roughness={0.6} />
			</mesh>
			<mesh position={[-0.35, ys[3] + 0.09, 0.02]}>
				<cylinderGeometry args={[0.07, 0.07, 0.14, 12]} />
				<meshStandardMaterial color="#8fbc8f" roughness={0.55} />
			</mesh>
			<Box position={[-0.35, ys[3] + 0.17, 0.02]} args={[0.04, 0.03, 0.02]} color="#5a5a58" />
			{[-0.05, 0.02, 0.09, 0.16, 0.23, 0.3].map((x, i) => (
				<Box
					key={`b2-${i}`}
					position={[x, ys[3] + 0.1, 0.02]}
					args={[0.055, 0.16, 0.12]}
					color={['#c45a4a', '#4a6a8a', '#e8e0d0', '#5a7a5a', '#8a5a3a', '#3a4a6a'][i]}
				/>
			))}
			<mesh position={[0.55, ys[3] + 0.08, 0.02]} rotation={[0, 0.4, 0]}>
				<coneGeometry args={[0.07, 0.14, 4]} />
				<meshStandardMaterial color="#c4a06a" roughness={0.5} metalness={0.2} />
			</mesh>
			<Box position={[0.82, ys[3] + 0.1, 0.02]} args={[0.14, 0.16, 0.03]} color={BLACK} />
			<Box position={[0.82, ys[3] + 0.1, 0.04]} args={[0.1, 0.12, 0.01]} color="#a89078" />

			{/* 3rd: grid frame, FRESH PAINT, photos */}
			<Box position={[-0.75, ys[2] + 0.14, 0.02]} args={[0.22, 0.22, 0.03]} color="#f4f2ee" />
			{([-0.06, 0, 0.06] as const).flatMap((dx, i) =>
				([-0.06, 0, 0.06] as const).map((dy, j) => (
					<Box
						key={`g-${i}-${j}`}
						position={[-0.75 + dx, ys[2] + 0.14 + dy, 0.04]}
						args={[0.04, 0.04, 0.01]}
						color="#ddd"
					/>
				)),
			)}
			<Box position={[-0.4, ys[2] + 0.12, 0.02]} args={[0.14, 0.18, 0.03]} color={BLACK} />
			<Box position={[-0.4, ys[2] + 0.12, 0.04]} args={[0.1, 0.14, 0.01]} color="#b8a890" />
			<Box position={[-0.05, ys[2] + 0.1, 0.02]} args={[0.36, 0.14, 0.03]} color="#f8f6f0" />
			<Box position={[-0.05, ys[2] + 0.1, 0.04]} args={[0.28, 0.03, 0.005]} color={BLACK} />
			<Box position={[-0.05, ys[2] + 0.06, 0.04]} args={[0.22, 0.02, 0.005]} color={BLACK} />
			<Box position={[0.4, ys[2] + 0.11, 0.02]} args={[0.12, 0.16, 0.03]} color="#e8e4dc" />
			<Box position={[0.4, ys[2] + 0.11, 0.04]} args={[0.09, 0.12, 0.01]} color="#7a9aaa" />
			<Box position={[0.7, ys[2] + 0.12, 0.02]} args={[0.16, 0.2, 0.03]} color="#d4c4a8" />
			<Box position={[0.7, ys[2] + 0.12, 0.04]} args={[0.12, 0.15, 0.01]} color="#5a6a7a" />

			{/* 4th: diffuser, stones, colorful books, frames */}
			<mesh position={[-0.85, ys[1] + 0.08, 0.02]}>
				<cylinderGeometry args={[0.055, 0.06, 0.12, 10]} />
				<meshStandardMaterial color="#eae6e0" roughness={0.55} />
			</mesh>
			{([-0.04, 0, 0.04] as const).map((dx, i) => (
				<Box
					key={`reed-${i}`}
					position={[-0.85 + dx * 0.3, ys[1] + 0.22, 0.02]}
					args={[0.01, 0.2, 0.01]}
					color="#c4a882"
				/>
			))}
			{([-0.6, -0.5] as const).map((x, i) => (
				<mesh key={`stone-${i}`} position={[x, ys[1] + 0.04, 0.02]}>
					<sphereGeometry args={[0.035 + i * 0.01, 8, 8]} />
					<meshStandardMaterial color={i ? '#8a8a88' : '#6a6a68'} roughness={0.9} />
				</mesh>
			))}
			{[-0.25, -0.18, -0.11, -0.04, 0.03, 0.1, 0.17, 0.24].map((x, i) => (
				<Box
					key={`b4-${i}`}
					position={[x, ys[1] + 0.1, 0.02]}
					args={[0.055, 0.15 + (i % 3) * 0.02, 0.12]}
					color={
						['#c23b2e', '#2f4a38', '#e8dcc8', '#4a6a8a', '#d45a2a', '#5a4a6a', '#c4a06a', '#3a5a4a'][
							i
						]
					}
				/>
			))}
			<Box position={[0.55, ys[1] + 0.12, 0.02]} args={[0.14, 0.18, 0.03]} color="#c4a06a" />
			<Box position={[0.55, ys[1] + 0.12, 0.04]} args={[0.1, 0.14, 0.01]} color="#3a3a38" />
			<Box position={[0.82, ys[1] + 0.11, 0.02]} args={[0.16, 0.16, 0.03]} color="#e8e4dc" />
			<Box position={[0.82, ys[1] + 0.11, 0.04]} args={[0.12, 0.12, 0.01]} color="#8a9aaa" />

			{/* Bottom: device, photo, seashell */}
			<Box position={[-0.7, ys[0] + 0.04, 0.02]} args={[0.16, 0.05, 0.1]} color="#f2f0ec" />
			<Box position={[-0.35, ys[0] + 0.1, 0.02]} args={[0.12, 0.14, 0.03]} color="#e8e4dc" />
			<Box position={[-0.35, ys[0] + 0.1, 0.04]} args={[0.09, 0.1, 0.01]} color="#a89078" />
			<mesh position={[0.1, ys[0] + 0.06, 0.02]} rotation={[0.3, 0.5, 0.2]} scale={[1.2, 0.7, 1]}>
				<sphereGeometry args={[0.08, 10, 8]} />
				<meshStandardMaterial color="#e8e0d4" roughness={0.65} />
			</mesh>
			<Box position={[0.5, ys[0] + 0.08, 0.02]} args={[0.2, 0.1, 0.08]} color="#d8d4cc" />
			<Box position={[0.85, ys[0] + 0.1, 0.02]} args={[0.12, 0.14, 0.03]} color={BLACK} />
			<Box position={[0.85, ys[0] + 0.1, 0.04]} args={[0.09, 0.1, 0.01]} color="#7a6a5a" />

			{/* Fairy lights — soft glowing dots draped on left */}
			{(
				[
					[-0.95, 2.2],
					[-1.0, 1.95],
					[-0.92, 1.7],
					[-1.02, 1.45],
					[-0.95, 1.2],
					[-1.0, 0.95],
					[-0.92, 0.7],
					[-0.88, 0.45],
				] as const
			).map(([x, y], i) => (
				<mesh key={`lt-${i}`} position={[x, y, 0.08]}>
					<sphereGeometry args={[0.018, 8, 8]} />
					<meshStandardMaterial
						color="#fff8e8"
						emissive="#ffe8c0"
						emissiveIntensity={0.85}
						roughness={0.4}
					/>
				</mesh>
			))}
			<pointLight position={[-0.9, 1.4, 0.15]} intensity={0.25} distance={2.5} color="#fff0d8" />
		</group>
	);
}

/**
 * Floor-plan bay bump-out at the SW (far-left) corner —
 * three equal window panels (left angle | center | right angle).
 */
function CornerBaySW({
	west,
	south,
	alongW,
	alongS,
	bayWest,
	baySouth,
}: {
	west: number;
	south: number;
	alongW: number;
	alongS: number;
	bayWest: number;
	baySouth: number;
}) {
	const winH = 1.65;
	const winY = 1.4;
	const frame = BLACK;
	const glass = '#c5d8e8';
	const blind = '#d8d4cc';

	/**
	 * Proper 3-panel bay (photo): short left angle, flat center, short right angle.
	 * Opening corners on the room walls → outer bay corners.
	 */
	/** Match room wall stubs exactly so left/center/right panels meet the opening */
	const openW: [number, number] = [west, south + alongW];
	const openS: [number, number] = [west + alongS, south];
	const outC0: [number, number] = [bayWest + 0.08, baySouth];
	const outC1: [number, number] = [west + alongS * 0.55, baySouth];

	function BayWindow({ winW, mullion = false }: { winW: number; mullion?: boolean }) {
		return (
			<group position={[-T * 0.65 - 0.02, winY, 0]}>
				{/* Glass pulled clear of the wall to avoid z-fighting / flashing */}
				<mesh position={[0, 0, 0]} castShadow>
					<boxGeometry args={[0.03, winH, winW]} />
					<meshStandardMaterial
						color={glass}
						roughness={0.3}
						metalness={0.12}
						polygonOffset
						polygonOffsetFactor={-2}
						polygonOffsetUnits={-2}
					/>
				</mesh>
				{/* Frame sits slightly proud of glass */}
				<mesh position={[-0.025, winH / 2, 0]}>
					<boxGeometry args={[0.05, 0.06, winW + 0.1]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				<mesh position={[-0.025, -winH / 2, 0]}>
					<boxGeometry args={[0.05, 0.06, winW + 0.1]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				<mesh position={[-0.025, 0, -winW / 2]}>
					<boxGeometry args={[0.05, winH + 0.08, 0.06]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				<mesh position={[-0.025, 0, winW / 2]}>
					<boxGeometry args={[0.05, winH + 0.08, 0.06]} />
					<meshStandardMaterial color={frame} roughness={0.85} />
				</mesh>
				{mullion && (
					<mesh position={[-0.03, 0, 0]}>
						<boxGeometry args={[0.04, winH - 0.04, 0.045]} />
						<meshStandardMaterial color={frame} roughness={0.85} />
					</mesh>
				)}
				{/* Blind valence — inset, not coplanar with glass */}
				<mesh position={[-0.04, winH / 2 - 0.14, 0]}>
					<boxGeometry args={[0.025, 0.2, winW - 0.08]} />
					<meshStandardMaterial color={blind} roughness={0.95} />
				</mesh>
			</group>
		);
	}

	/**
	 * Wall along A→B (clockwise around bay). Local +Z = along wall;
	 * local −X faces the bay interior.
	 */
	function WallSeg(
		ax: number,
		az: number,
		bx: number,
		bz: number,
		key: string,
		opts: { mullion?: boolean } = {},
	) {
		const dx = bx - ax;
		const dz = bz - az;
		const len = Math.hypot(dx, dz);
		if (len < 0.2) return null;
		const midX = (ax + bx) / 2;
		const midZ = (az + bz) / 2;
		const rotY = Math.atan2(dx, dz);
		const winW = Math.min(len * 0.78, 1.35);
		return (
			<group key={key} position={[midX, 0, midZ]} rotation={[0, rotY, 0]}>
				{/* Exact length — no overlap with neighbors (overlap caused flashing) */}
				<Box position={[0, 1.35, 0]} args={[T, 2.7, len]} color={WALL} roughness={0.95} />
				<BayWindow winW={winW} mullion={opts.mullion} />
			</group>
		);
	}

	const tableX = (outC0[0] + outC1[0]) / 2;
	const tableZ = baySouth + 0.7;

	return (
		<group>
			{/* Left angled panel */}
			{WallSeg(openW[0], openW[1], outC0[0], outC0[1], 'left')}
			{/* Center south panel */}
			{WallSeg(outC0[0], outC0[1], outC1[0], outC1[1], 'center', { mullion: true })}
			{/* Right angled panel */}
			{WallSeg(outC1[0], outC1[1], openS[0], openS[1], 'right')}

			{/* Table centered; chairs opposite each other */}
			<mesh position={[tableX, 0.38, tableZ]}>
				<cylinderGeometry args={[0.04, 0.12, 0.72, 12]} />
				<meshStandardMaterial color="#c4a06a" metalness={0.65} roughness={0.35} />
			</mesh>
			<mesh position={[tableX, 0.75, tableZ]}>
				<cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
				<meshStandardMaterial color="#f4f2ee" roughness={0.55} />
			</mesh>
			<group position={[tableX - 0.62, 0, tableZ]} rotation={[0, Math.PI / 2, 0]}>
				<Box position={[0, 0.42, 0]} args={[0.48, 0.08, 0.48]} color={ORANGE} />
				<Box position={[0, 0.72, -0.18]} args={[0.46, 0.55, 0.08]} color={ORANGE} />
				{[
					[-0.16, -0.16],
					[0.16, -0.16],
					[-0.16, 0.16],
					[0.16, 0.16],
				].map((o, j) => (
					<Box key={j} position={[o[0], 0.2, o[1]]} args={[0.035, 0.38, 0.035]} color={WOOD} />
				))}
			</group>
			<group position={[tableX + 0.62, 0, tableZ]} rotation={[0, -Math.PI / 2, 0]}>
				<Box position={[0, 0.42, 0]} args={[0.48, 0.08, 0.48]} color={ORANGE} />
				<Box position={[0, 0.72, -0.18]} args={[0.46, 0.55, 0.08]} color={ORANGE} />
				{[
					[-0.16, -0.16],
					[0.16, -0.16],
					[-0.16, 0.16],
					[0.16, 0.16],
				].map((o, j) => (
					<Box key={j} position={[o[0], 0.2, o[1]]} args={[0.035, 0.38, 0.035]} color={WOOD} />
				))}
			</group>

			<pointLight position={[tableX, 2.1, tableZ]} intensity={0.5} distance={6} color="#fff0d8" />
		</group>
	);
}

/** World-space camera after kitchen 180° flip — looking into primary through TV-wall doors */
export function getPrimaryGoal(): {
	target: [number, number, number];
	distance: number;
	az: number;
	el: number;
} {
	const [kcx, kcz] = PLAN_CENTERS.kitchen;
	const localX = PRIMARY_DOOR.x - 0.3;
	const localZ = PRIMARY_DOOR.z - 2.2;
	const wx = 2 * kcx - localX;
	const wz = 2 * kcz - localZ;
	return {
		target: [wx, 1.05, wz],
		distance: 6.2,
		az: 0,
		el: 0.5,
	};
}

export const PRIMARY_GOAL = getPrimaryGoal();
