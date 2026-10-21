import { FT, PLAN, PLAN_CENTERS } from './condoLayout';
import { KitchenCats, type CatFocus, type CatId } from './CatWalkers';
import { DOOR, KitchenLivingDoor, LivingDining } from './LivingDining';

const WALL = '#f4f1ec';
const FLOOR_TILE = '#3a3a38';
const OAK = '#b8956a';
const OAK_DARK = '#9a7a52';
const COUNTER = '#2a2a28';
const STEEL = '#b8c0c4';
const BLACK = '#1a1a1a';
const STREET_RED = '#c23b2e';
const T = 0.14;

const COUNTER_D = (23 / 12) * FT;
const COUNTER_H = 0.9; // top of counter surface

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

function Cyl({
	position,
	args,
	color,
}: {
	position: [number, number, number];
	args: [number, number, number, number?];
	color: string;
}) {
	const [rTop, rBot, h, seg = 16] = args;
	return (
		<mesh position={position} castShadow>
			<cylinderGeometry args={[rTop, rBot, h, seg]} />
			<meshStandardMaterial color={color} roughness={0.85} />
		</mesh>
	);
}

function WallH({ x0, x1, z }: { x0: number; x1: number; z: number }) {
	const w = Math.abs(x1 - x0);
	if (w < 0.04) return null;
	return <Box position={[(x0 + x1) / 2, 1.35, z]} args={[w, 2.7, T]} color={WALL} roughness={0.95} />;
}

function WallV({ z0, z1, x }: { z0: number; z1: number; x: number }) {
	const d = Math.abs(z1 - z0);
	if (d < 0.04) return null;
	return <Box position={[x, 1.35, (z0 + z1) / 2]} args={[T, 2.7, d]} color={WALL} roughness={0.95} />;
}

function Fridge({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			<Box position={[0, 1.0, 0]} args={[0.9, 2.05, 0.72]} color="#f2f2f2" roughness={0.28} metalness={0.22} />
			<Box position={[0, 0.42, 0.37]} args={[0.84, 0.03, 0.02]} color="#ccc" />
			<Box position={[0.32, 1.15, 0.39]} args={[0.05, 0.55, 0.05]} color="#c0c4c8" metalness={0.85} roughness={0.2} />
		</group>
	);
}

function Stool({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			<Cyl position={[0, 0.55, 0]} args={[0.17, 0.17, 0.06, 16]} color={OAK_DARK} />
			{[
				[-0.11, 0.28, -0.11],
				[0.11, 0.28, -0.11],
				[-0.11, 0.28, 0.11],
				[0.11, 0.28, 0.11],
			].map((o, i) => (
				<Box key={i} position={[o[0], o[1], o[2]]} args={[0.03, 0.55, 0.03]} color={BLACK} />
			))}
		</group>
	);
}

/**
 * Mockup (camera from south → looking north; top of screen = north):
 *
 *   TOP-LEFT:  red street door
 *   TOP:       fridge immediately right of street door
 *   RIGHT:     galley counters + range; SE unit at counter height (not tall)
 *   BOTTOM-LEFT: dining doorway only — no cabinet block
 *   CENTER:    island, stools on west
 */
export function CondoInterior({
	selectedCat = null,
	onSelectCat,
	condoRoom = 'kitchen',
	onPassThroughDoor,
}: {
	selectedCat?: CatId | null;
	onSelectCat?: (focus: CatFocus) => void;
	condoRoom?: 'kitchen' | 'living';
	onPassThroughDoor?: (to: 'kitchen' | 'living') => void;
} = {}) {
	const k = PLAN.kitchen;
	const [kcx, kcz] = PLAN_CENTERS.kitchen;
	const east = k.x + k.w;
	const west = k.x;
	const north = k.z + k.d;
	const south = k.z;

	// North wall: street door only
	const streetW = 1.05;
	const streetL = west + 0.04;
	const streetR = streetL + streetW;

	// South wall: dining doorway → fridge (other wall)
	const diningW = DOOR.w;
	const diningL = DOOR.x0;
	const diningR = DOOR.x1;
	const fridgeW = 0.9;
	const fridgeX = diningR + fridgeW / 2 + 0.05;
	const sinkW = 0.7;
	const southCounterX0 = fridgeX + fridgeW / 2 + 0.05;
	const southCounterX1 = east - sinkW - 0.06;
	const southCounterLen = Math.max(0.5, southCounterX1 - southCounterX0);
	const southCounterZ = south + COUNTER_D / 2 + 0.02;
	const sinkX = east - sinkW / 2 - 0.06;

	return (
		<>
		<group position={[kcx, 0, kcz]} rotation={[0, Math.PI, 0]}>
			<group position={[-kcx, 0, -kcz]}>
			{/* Floor */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[kcx, 0.001, kcz]} receiveShadow>
				<planeGeometry args={[k.w + 0.15, k.d + 0.15]} />
				<meshStandardMaterial color={FLOOR_TILE} roughness={0.92} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[kcx, -0.02, kcz]} receiveShadow>
				<planeGeometry args={[28, 28]} />
				<meshStandardMaterial color="#b8aea2" roughness={1} />
			</mesh>

			{/* West / East walls */}
			<WallV z0={south} z1={north} x={west} />
			<WallV z0={south} z1={north} x={east} />

			{/* North — gap for street door, solid the rest */}
			<WallH x0={streetR} x1={east} z={north} />

			{/* South — gap for dining doorway, solid behind fridge → east */}
			<WallH x0={diningR} x1={east} z={south} />

			{/* ========== RED STREET DOOR ========== */}
			<Box position={[streetL + 0.04, 1.1, north]} args={[0.1, 2.2, 0.2]} color={STREET_RED} />
			<Box position={[streetR, 1.1, north]} args={[0.1, 2.2, 0.2]} color={STREET_RED} />
			<Box
				position={[(streetL + streetR) / 2, 2.22, north]}
				args={[streetW, 0.12, 0.2]}
				color={STREET_RED}
			/>
			<Box
				position={[streetL + 0.42, 1.05, north - 0.45]}
				args={[0.08, 2.05, 0.85]}
				color={STREET_RED}
				rotation={[0, -0.55, 0]}
			/>

			{/* Doorway kitchen ↔ living — clickable both ways */}
			<KitchenLivingDoor fromRoom={condoRoom} onPassThrough={onPassThroughDoor} />

			{/* Living / dining through the doorway (same flip as kitchen) */}
			<LivingDining />

			{/* Fridge faces into room; rotate so doors face north */}
			<group position={[fridgeX, 0, south + 0.4]} rotation={[0, Math.PI, 0]}>
				<Fridge position={[0, 0, 0]} />
			</group>

			{/* Counter — right of fridge along same wall */}
			<Box
				position={[southCounterX0 + southCounterLen / 2, 0.42, southCounterZ]}
				args={[southCounterLen, 0.84, COUNTER_D]}
				color={OAK}
			/>
			<Box
				position={[southCounterX0 + southCounterLen / 2, COUNTER_H, southCounterZ]}
				args={[southCounterLen + 0.04, 0.07, COUNTER_D + 0.04]}
				color={COUNTER}
				roughness={0.4}
			/>

			{/* Sink — SE corner, right end of fridge wall */}
			<Box position={[sinkX, 0.42, southCounterZ]} args={[sinkW, 0.84, COUNTER_D]} color={OAK} />
			<Box
				position={[sinkX, COUNTER_H, southCounterZ]}
				args={[sinkW + 0.04, 0.07, COUNTER_D + 0.04]}
				color={COUNTER}
				roughness={0.4}
			/>
			<Box
				position={[sinkX, 0.97, south + 0.38]}
				args={[0.5, 0.1, 0.38]}
				color="#d8dee2"
				metalness={0.65}
				roughness={0.25}
			/>
			<Box
				position={[sinkX, 0.9, south + 0.38]}
				args={[0.38, 0.08, 0.26]}
				color="#8a9298"
				metalness={0.4}
			/>
			<Box
				position={[sinkX, 1.2, south + 0.22]}
				args={[0.05, 0.32, 0.05]}
				color={STEEL}
				metalness={0.7}
			/>

			{/* ========== EAST WALL — all counter height (no tall pantry) ========== */}
			{/* Full base run along east, including former tall-cabinet zone at south end */}
			<Box
				position={[east - 0.34, 0.42, kcz]}
				args={[0.58, 0.84, k.d * 0.72]}
				color={OAK}
			/>
			<Box
				position={[east - 0.34, COUNTER_H, kcz]}
				args={[0.62, 0.07, k.d * 0.74]}
				color={COUNTER}
				roughness={0.4}
			/>
			{/* SE corner — explicitly counter height (was tall) */}
			<Box
				position={[east - 0.34, 0.42, south + 0.55]}
				args={[0.58, 0.84, 0.85]}
				color={OAK}
			/>
			<Box
				position={[east - 0.34, COUNTER_H, south + 0.55]}
				args={[0.62, 0.07, 0.88]}
				color={COUNTER}
				roughness={0.4}
			/>
			{/* Range — centered on east wall */}
			<Box position={[east - 0.36, 0.45, kcz]} args={[0.7, 0.9, 0.62]} color={STEEL} metalness={0.5} />
			<Box position={[east - 0.36, 0.95, kcz]} args={[0.68, 0.05, 0.6]} color="#111" />
			<Box position={[east - 0.36, 1.75, kcz]} args={[0.65, 0.55, 0.4]} color={BLACK} />

			{/* Island — stools on west (left) */}
			<Box position={[kcx - 0.1, 0.42, kcz]} args={[0.95, 0.84, 1.85]} color={COUNTER} roughness={0.45} />
			<Box
				position={[kcx - 0.1, 0.9, kcz]}
				args={[1.1, 0.07, 2.0]}
				color={COUNTER}
				roughness={0.4}
			/>
			<Stool position={[kcx - 0.85, 0, kcz - 0.45]} />
			<Stool position={[kcx - 0.85, 0, kcz + 0.45]} />

			{/* Chandelier */}
			<group position={[kcx - 0.1, 2.4, kcz]}>
				{[0, 1, 2, 3, 4, 5].map((i) => {
					const a = (i * Math.PI) / 3;
					return (
						<mesh key={i} position={[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3]} rotation={[0, a, 0.3]}>
							<boxGeometry args={[0.48, 0.03, 0.03]} />
							<meshStandardMaterial color="#c4a35a" metalness={0.75} roughness={0.25} />
						</mesh>
					);
				})}
				<pointLight intensity={1.1} distance={8} color="#fff0d8" />
			</group>

			<pointLight position={[kcx, 2.8, kcz]} intensity={0.9} distance={10} color="#fff4e6" />
			<ambientLight intensity={0.4} />
			<hemisphereLight args={['#fff8f0', '#6a5a4a', 0.35]} />

			{/* Cats in flip group so they roam kitchen + living in the same space */}
			<KitchenCats selected={selectedCat} onSelect={onSelectCat} />
			</group>
		</group>
		</>
	);
}

export const KITCHEN_ENTRY_GOAL = {
	target: [PLAN_CENTERS.kitchen[0], 1.0, PLAN_CENTERS.kitchen[1]] as [number, number, number],
	/** From south looking north — street door at top-left of screen */
	distance: 6.8,
	az: Math.PI,
	el: 0.75,
};
