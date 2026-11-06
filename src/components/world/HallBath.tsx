import { useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { PLAN_CENTERS } from './condoLayout';
import { getBathDoor } from './LivingDining';

const WALL = '#eae8e4';
const TILE = '#f4f2ee';
const HEX = '#1a1a1a';
const WOOD = '#3a2e28';
const BLACK = '#1a1a1a';
const GOLD = '#c4a06a';
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

/** Clickable doorway living ↔ bath on the first east-wall door. */
export function LivingBathDoor({
	fromRoom = 'living',
	onPassThrough,
}: {
	fromRoom?: 'living' | 'bath';
	onPassThrough?: (to: 'living' | 'bath') => void;
}) {
	const [hovered, setHovered] = useState(false);
	const door = getBathDoor();
	const toRoom = fromRoom === 'living' ? 'bath' : 'living';
	const title = toRoom === 'bath' ? 'Bath' : 'Living';

	const frame = hovered ? '#f7f5f1' : '#f2f0ec';
	/** East-wall opening: width runs along Z; threshold crosses X */
	return (
		<group
			position={[door.x, 0, door.z]}
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
			{/* Jambs + header */}
			<Box position={[0, 1.1, -door.w / 2]} args={[0.16, 2.25, 0.1]} color={frame} />
			<Box position={[0, 1.1, door.w / 2]} args={[0.16, 2.25, 0.1]} color={frame} />
			<Box position={[0, 2.25, 0]} args={[0.16, 0.14, door.w + 0.14]} color={frame} />
			{/*
			 * Fat click volume across the threshold — into living (−X) and bath (+X)
			 * so it’s hittable from either side (same pattern as LivingPrimaryDoor).
			 */}
			<mesh position={[-0.2, 1.1, 0]}>
				<boxGeometry args={[1.6, 2.3, door.w * 1.15]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			<Html
				position={[-0.35, 2.55, 0]}
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
 * Hall bath east of living — first door on the right when you walk in.
 * After the kitchen flip, looking in at the vanity:
 *   left of sink = toilet (−Z), right = shower (+Z).
 */
export function HallBath() {
	const door = getBathDoor();
	const west = door.x;
	const depth = 2.55;
	const east = west + depth;
	const roomD = 3.1;
	const cz = door.z - 0.15;
	const south = cz - roomD / 2;
	const north = cz + roomD / 2;
	const cx = (west + east) / 2;
	/** Shower on the right when looking at the vanity (screen-right = +Z after flip) */
	const showerD = 1.2;
	const showerZ = north - showerD / 2 - 0.06;
	const vanityX = east - 0.55;
	/** Vanity slightly toward toilet so sink sits between toilet and shower */
	const vanityZ = cz - 0.2;
	/** Toilet immediately left of the sink (screen-left = −Z after flip) */
	const toiletZ = vanityZ - 0.85;
	const toiletX = east - 0.7;

	return (
		<group>
			{/* Floor — black hex feel */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.002, cz]} receiveShadow>
				<planeGeometry args={[depth + 0.1, roomD + 0.1]} />
				<meshStandardMaterial color={HEX} roughness={0.9} />
			</mesh>
			{/* Continuity into living */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[west - 0.15, 0.003, door.z]}
				receiveShadow
			>
				<planeGeometry args={[0.5, door.w + 0.15]} />
				<meshStandardMaterial color="#3a2e26" roughness={0.88} />
			</mesh>

			{/* Dark ceiling */}
			<Box position={[cx, 2.68, cz]} args={[depth + 0.1, 0.06, roomD + 0.1]} color="#2a2a2a" />

			{/* East / back wall */}
			<Box position={[east, 1.35, cz]} args={[T, 2.7, roomD]} color={WALL} roughness={0.95} />
			{/* North wall */}
			<Box position={[cx, 1.35, north]} args={[depth, 2.7, T]} color={WALL} roughness={0.95} />
			{/* South wall */}
			<Box position={[cx, 1.35, south]} args={[depth, 2.7, T]} color={WALL} roughness={0.95} />
			{/* West wall stubs around the door into living */}
			{(() => {
				const northLen = Math.max(0.1, north - door.z1);
				const southLen = Math.max(0.1, door.z0 - south);
				return (
					<>
						{northLen > 0.05 && (
							<Box
								position={[west, 1.35, door.z1 + northLen / 2]}
								args={[T, 2.7, northLen]}
								color={WALL}
								roughness={0.95}
							/>
						)}
						{southLen > 0.05 && (
							<Box
								position={[west, 1.35, door.z0 - southLen / 2]}
								args={[T, 2.7, southLen]}
								color={WALL}
								roughness={0.95}
							/>
						)}
						<Box
							position={[west, 2.45, door.z]}
							args={[T, 0.5, door.w]}
							color={WALL}
							roughness={0.95}
						/>
					</>
				);
			})()}

			{/* ——— Toilet (left of sink) ——— */}
			<group position={[toiletX, 0, toiletZ]} rotation={[0, Math.PI / 2, 0]}>
				<Box position={[0, 0.2, 0]} args={[0.45, 0.4, 0.55]} color="#f4f2ee" roughness={0.4} />
				<Box position={[0, 0.42, -0.05]} args={[0.4, 0.08, 0.35]} color="#f4f2ee" roughness={0.4} />
				<Box position={[0, 0.55, 0.18]} args={[0.42, 0.45, 0.18]} color="#f4f2ee" roughness={0.4} />
				<Box
					position={[0, 0.85, 0.22]}
					args={[0.38, 0.35, 0.04]}
					color="#f4f2ee"
					roughness={0.4}
					rotation={[-0.15, 0, 0]}
				/>
			</group>
			{/* Gold TP holder + art on the toilet-side (south) wall */}
			<mesh position={[toiletX - 0.35, 0.7, south + 0.08]}>
				<cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
				<meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
			</mesh>
			<mesh position={[toiletX - 0.35, 0.7, south + 0.08]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
				<meshStandardMaterial color="#f4f2ee" roughness={0.85} />
			</mesh>
			{(
				[
					[west + 0.55, 1.75, 0.28, 0.22],
					[west + 1.15, 1.7, 0.45, 0.35],
					[west + 1.7, 1.75, 0.22, 0.22],
				] as const
			).map(([x, y, w, h], i) => (
				<group key={i} position={[x, y, south + 0.06]}>
					<Box position={[0, 0, 0]} args={[w + 0.04, h + 0.04, 0.03]} color={BLACK} />
					<Box
						position={[0, 0, 0.02]}
						args={[w, h, 0.02]}
						color={i === 1 ? '#6a7a8a' : i === 0 ? '#c4a882' : '#e8e0d4'}
					/>
				</group>
			))}
			{/* Orange rug by toilet */}
			<Box
				position={[toiletX - 0.15, 0.015, toiletZ + 0.15]}
				args={[0.7, 0.03, 0.75]}
				color="#c45a3a"
				roughness={0.95}
			/>

			{/* ——— Vanity (back wall, center-left of shower) ——— */}
			<group position={[vanityX, 0, vanityZ]}>
				<Box position={[0, 0.55, 0]} args={[0.5, 0.55, 1.15]} color={WOOD} roughness={0.55} />
				{[-0.32, 0, 0.32].map((dz, i) => (
					<Box
						key={i}
						position={[0.02, 0.55, dz]}
						args={[0.48, 0.48, 0.32]}
						color="#2a221c"
						roughness={0.5}
					/>
				))}
				<Box position={[0, 0.88, 0]} args={[0.48, 0.08, 0.7]} color="#f4f2ee" roughness={0.35} />
				<mesh position={[0.05, 0.92, 0]} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.12, 0.14, 0.08, 16]} />
					<meshStandardMaterial color="#f4f2ee" roughness={0.3} />
				</mesh>
				<Box position={[-0.12, 1.05, 0]} args={[0.04, 0.28, 0.04]} color={BLACK} metalness={0.5} />
				<Box position={[-0.02, 1.16, 0]} args={[0.2, 0.04, 0.04]} color={BLACK} metalness={0.5} />
				<Box position={[0.1, 0.98, 0.25]} args={[0.05, 0.14, 0.05]} color="#e8e0d4" />
				<Box position={[0.1, 0.98, -0.25]} args={[0.05, 0.12, 0.05]} color="#2a2a2a" />
			</group>
			{/* Mirror */}
			<Box position={[east - 0.08, 1.65, vanityZ]} args={[0.04, 0.7, 0.85]} color="#2a2a2a" />
			<Box
				position={[east - 0.1, 1.65, vanityZ]}
				args={[0.02, 0.62, 0.75]}
				color="#b8c8d4"
				metalness={0.85}
				roughness={0.15}
			/>
			{/* Purple towel between vanity and shower */}
			<mesh position={[east - 0.12, 1.35, vanityZ + 0.7]}>
				<sphereGeometry args={[0.03, 10, 10]} />
				<meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
			</mesh>
			<Box
				position={[east - 0.2, 1.15, vanityZ + 0.7]}
				args={[0.08, 0.45, 0.22]}
				color="#4a2a5a"
				roughness={0.9}
			/>

			{/* ——— Walk-in shower (right) ——— */}
			<group>
				<Box
					position={[west + depth * 0.42, 0.02, showerZ]}
					args={[depth * 0.72, 0.03, showerD - 0.08]}
					color="#111"
					roughness={0.92}
				/>
				{/* Subway tile on north + east shower walls */}
				<Box
					position={[west + depth * 0.42, 1.2, north - T / 2 - 0.02]}
					args={[depth * 0.7, 2.35, 0.06]}
					color={TILE}
					roughness={0.7}
				/>
				<Box
					position={[east - T / 2 - 0.04, 1.2, showerZ]}
					args={[0.06, 2.35, showerD - 0.1]}
					color={TILE}
					roughness={0.7}
				/>
				{[0.4, 0.75, 1.1, 1.45, 1.8].map((y, i) => (
					<Box
						key={i}
						position={[east - T / 2 - 0.07, y, showerZ]}
						args={[0.01, 0.015, showerD - 0.2]}
						color="#d8d4cc"
					/>
				))}
				{/* Glass on the open (south) face of the shower */}
				<mesh position={[west + 0.95, 1.15, showerZ - showerD / 2 + 0.05]}>
					<boxGeometry args={[1.3, 2.1, 0.03]} />
					<meshStandardMaterial
						color="#c5d8e8"
						transparent
						opacity={0.35}
						roughness={0.15}
						metalness={0.2}
					/>
				</mesh>
				<Box
					position={[west + 0.95, 2.2, showerZ - showerD / 2 + 0.05]}
					args={[1.35, 0.04, 0.05]}
					color="#c8c8c6"
					metalness={0.7}
					roughness={0.3}
				/>
				<Box
					position={[west + 0.55, 2.15, north - 0.2]}
					args={[0.28, 0.04, 0.28]}
					color={BLACK}
					metalness={0.5}
				/>
				<Box position={[west + 0.55, 2.0, north - 0.2]} args={[0.04, 0.25, 0.04]} color={BLACK} />
				<Box
					position={[east - 0.35, 1.1, showerZ]}
					args={[0.12, 0.12, 0.04]}
					color={BLACK}
					metalness={0.5}
				/>
				<Box position={[west + 0.55, 1.55, north - 0.22]} args={[0.2, 0.35, 0.12]} color={BLACK} />
			</group>

			{/* Salmon mat outside shower */}
			<Box
				position={[west + 1.0, 0.015, showerZ - showerD / 2 - 0.25]}
				args={[0.55, 0.03, 0.35]}
				color="#d4785a"
				roughness={0.95}
			/>

			{/* Lights */}
			<pointLight position={[cx, 2.4, cz]} intensity={0.7} distance={7} color="#fff5e8" />
			<pointLight position={[west + 0.8, 2.35, showerZ]} intensity={0.45} distance={4} color="#ffe8d0" />
		</group>
	);
}

/**
 * World-space camera after kitchen 180° flip — standing inside the bath
 * near the door, looking toward the vanity.
 *
 * Bath is only ~2.5m deep, so distance must stay under that (OrbitControls
 * minDistance is lowered for this room in World).
 */
export function getBathGoal(): {
	target: [number, number, number];
	distance: number;
	az: number;
	el: number;
} {
	const [kcx, kcz] = PLAN_CENTERS.kitchen;
	const door = getBathDoor();
	/** Vanity / back of room */
	const localX = door.x + 2.05;
	const localZ = door.z - 0.05;
	const wx = 2 * kcx - localX;
	const wz = 2 * kcz - localZ;
	return {
		target: [wx, 1.2, wz],
		/** Camera ~0.9m inside from the door, looking at the vanity */
		distance: 1.7,
		/**
		 * After the 180° flip, vanity is −X from the door in world space.
		 * +π/2 places the camera on the door side of the target (still inside).
		 */
		az: Math.PI / 2,
		el: 0.28,
	};
}
