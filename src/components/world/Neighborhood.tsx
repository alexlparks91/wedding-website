import { useMemo } from 'react';
import * as THREE from 'three';

/** Procedural brick / asphalt / concrete maps so the block reads like Tomjohnville’s textured town. */
function useTownTextures() {
	return useMemo(() => {
		if (typeof document === 'undefined') {
			return { brick: null, asphalt: null, concrete: null };
		}

		const brick = document.createElement('canvas');
		brick.width = 128;
		brick.height = 128;
		const bctx = brick.getContext('2d')!;
		bctx.fillStyle = '#9a4a3a';
		bctx.fillRect(0, 0, 128, 128);
		for (let row = 0; row < 10; row++) {
			const y = row * 13;
			const offset = row % 2 === 0 ? 0 : 14;
			for (let col = -1; col < 6; col++) {
				const x = offset + col * 28;
				const shade = 140 + ((row * 7 + col * 13) % 40);
				bctx.fillStyle = `rgb(${shade},${Math.floor(shade * 0.48)},${Math.floor(shade * 0.38)})`;
				bctx.fillRect(x + 1, y + 1, 25, 10);
			}
		}
		const brickTex = new THREE.CanvasTexture(brick);
		brickTex.colorSpace = THREE.SRGBColorSpace;
		brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
		brickTex.repeat.set(4, 6);
		brickTex.anisotropy = 4;

		const asphalt = document.createElement('canvas');
		asphalt.width = 64;
		asphalt.height = 64;
		const actx = asphalt.getContext('2d')!;
		actx.fillStyle = '#4a4a48';
		actx.fillRect(0, 0, 64, 64);
		for (let i = 0; i < 180; i++) {
			const g = 60 + (i % 40);
			actx.fillStyle = `rgb(${g},${g},${g - 2})`;
			actx.fillRect((i * 17) % 64, (i * 29) % 64, 2, 2);
		}
		const asphaltTex = new THREE.CanvasTexture(asphalt);
		asphaltTex.colorSpace = THREE.SRGBColorSpace;
		asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping;
		asphaltTex.repeat.set(20, 20);

		const concrete = document.createElement('canvas');
		concrete.width = 64;
		concrete.height = 64;
		const cctx = concrete.getContext('2d')!;
		cctx.fillStyle = '#c5c1b8';
		cctx.fillRect(0, 0, 64, 64);
		cctx.strokeStyle = 'rgba(90,85,78,0.35)';
		cctx.lineWidth = 1;
		for (let i = 0; i < 4; i++) {
			cctx.strokeRect(i * 16 + 0.5, 0.5, 15, 63);
		}
		const concreteTex = new THREE.CanvasTexture(concrete);
		concreteTex.colorSpace = THREE.SRGBColorSpace;
		concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping;
		concreteTex.repeat.set(8, 40);

		return { brick: brickTex, asphalt: asphaltTex, concrete: concreteTex };
	}, []);
}

const FOLIAGE = ['#3d6b42', '#4a7d4f', '#2f5a36', '#5a8a58', '#456f48'] as const;
const TRUNK = '#5c4030';
const BRANCH = '#6a4e3a';

/** Street tree — tapered trunk, outward branches, layered green canopy. */
function StreetTree({
	position,
	scale = 1,
	seed = 0,
}: {
	position: [number, number, number];
	scale?: number;
	seed?: number;
}) {
	const lean = ((seed * 17) % 7) * 0.01 - 0.03;
	const canopyY = 3.35;
	const foliage = [
		[0, canopyY + 0.15, 0, 1.35],
		[0.85, canopyY + 0.05, 0.25, 0.95],
		[-0.75, canopyY + 0.2, -0.2, 0.9],
		[0.35, canopyY + 0.85, -0.45, 0.75],
		[-0.4, canopyY + 0.7, 0.55, 0.8],
		[0.55, canopyY - 0.35, -0.55, 0.7],
		[-0.65, canopyY - 0.25, 0.4, 0.65],
		[0.1, canopyY + 1.15, 0.15, 0.55],
	] as const;

	const branches: [number, number, number, number, number, number][] = [
		// x, y, z, rotX, rotZ, length
		[0.35, 2.6, 0.1, 0, 1.1, 1.1],
		[-0.3, 2.85, -0.15, 0, -1.0, 0.95],
		[0.15, 3.1, 0.35, 0.9, 0.3, 0.85],
		[-0.2, 3.2, -0.3, -0.85, -0.25, 0.8],
	];

	return (
		<group position={position} scale={scale} rotation={[0, lean * 8, lean]}>
			{/* Trunk */}
			<mesh position={[0, 1.45, 0]} castShadow>
				<cylinderGeometry args={[0.14, 0.28, 2.9, 8]} />
				<meshStandardMaterial color={TRUNK} roughness={0.95} />
			</mesh>
			{/* Upper trunk taper into canopy */}
			<mesh position={[0, 2.85, 0]} castShadow>
				<cylinderGeometry args={[0.08, 0.14, 0.7, 7]} />
				<meshStandardMaterial color={TRUNK} roughness={0.95} />
			</mesh>
			{/* Branches reaching into foliage */}
			{branches.map(([x, y, z, rotX, rotZ, len], i) => (
				<mesh
					key={i}
					position={[x, y, z]}
					rotation={[rotX, (seed + i) * 0.7, rotZ]}
					castShadow
				>
					<cylinderGeometry args={[0.035, 0.07, len, 5]} />
					<meshStandardMaterial color={BRANCH} roughness={0.95} />
				</mesh>
			))}
			{/* Canopy clusters */}
			{foliage.map(([x, y, z, r], i) => (
				<mesh
					key={`f-${i}`}
					position={[x * (1 + (seed % 3) * 0.04), y, z * (1 + ((seed + 1) % 3) * 0.04)]}
					castShadow
				>
					<sphereGeometry args={[r, 10, 10]} />
					<meshStandardMaterial
						color={FOLIAGE[(i + seed) % FOLIAGE.length]}
						roughness={0.9}
					/>
				</mesh>
			))}
		</group>
	);
}

/** Broader park tree for background lots. */
function LeafyTree({
	position,
	scale = 1,
	seed = 2,
}: {
	position: [number, number, number];
	scale?: number;
	seed?: number;
}) {
	return (
		<group position={position} scale={scale}>
			<mesh position={[0, 1.55, 0]} castShadow>
				<cylinderGeometry args={[0.18, 0.34, 3.1, 8]} />
				<meshStandardMaterial color={TRUNK} roughness={0.95} />
			</mesh>
			{[
				[0, 3.7, 0, 1.65],
				[0.95, 3.9, 0.35, 1.05],
				[-0.85, 4.0, -0.25, 1.0],
				[0.25, 4.6, -0.5, 0.85],
				[-0.35, 4.45, 0.55, 0.9],
				[0.7, 3.4, -0.6, 0.75],
				[-0.7, 3.35, 0.5, 0.7],
			].map(([x, y, z, r], i) => (
				<mesh key={i} position={[x, y, z]} castShadow>
					<sphereGeometry args={[r, 10, 10]} />
					<meshStandardMaterial
						color={FOLIAGE[(i + seed) % FOLIAGE.length]}
						roughness={0.9}
					/>
				</mesh>
			))}
		</group>
	);
}

function RowBuilding({
	position,
	width,
	height,
	depth,
	color,
	brickMap,
}: {
	position: [number, number, number];
	width: number;
	height: number;
	depth: number;
	color: string;
	brickMap?: THREE.Texture | null;
}) {
	const cols = Math.max(2, Math.floor(width / 2.6));
	const floors = Math.max(2, Math.floor(height / 3.2));

	return (
		<group position={position}>
			<mesh position={[0, height / 2, 0]} castShadow receiveShadow>
				<boxGeometry args={[width, height, depth]} />
				<meshStandardMaterial
					color={color}
					map={brickMap ?? undefined}
					roughness={0.92}
					envMapIntensity={0.35}
				/>
			</mesh>
			{/* Cornice */}
			<mesh position={[0, height + 0.12, depth / 2 - 0.05]} castShadow>
				<boxGeometry args={[width + 0.3, 0.28, 0.4]} />
				<meshStandardMaterial color="#d4c7b0" roughness={0.85} />
			</mesh>
			{Array.from({ length: floors }).map((_, fi) =>
				Array.from({ length: cols }).map((_, ci) => {
					const x = -width / 2 + 1.4 + ci * ((width - 1.2) / cols);
					const y = 2.2 + fi * ((height - 2.5) / floors);
					return (
						<mesh key={`${fi}-${ci}`} position={[x, y, depth / 2 + 0.04]} castShadow>
							<boxGeometry args={[1.05, 1.35, 0.1]} />
							<meshStandardMaterial
								color="#1f1c1a"
								roughness={0.55}
								emissive="#8aa4b0"
								emissiveIntensity={0.06}
							/>
						</mesh>
					);
				}),
			)}
		</group>
	);
}

function IvyNeighbor({
	position,
	brickMap,
}: {
	position: [number, number, number];
	brickMap?: THREE.Texture | null;
}) {
	const width = 11;
	const height = 10.2;
	const depth = 12;
	const frontZ = depth / 2;

	return (
		<group position={position}>
			<mesh position={[0, height / 2, 0]} castShadow receiveShadow>
				<boxGeometry args={[width, height, depth]} />
				<meshStandardMaterial
					color="#b54a3c"
					map={brickMap ?? undefined}
					roughness={0.92}
				/>
			</mesh>
			<mesh position={[0, height + 0.1, frontZ - 0.1]} castShadow>
				<boxGeometry args={[width + 0.2, 0.25, 0.35]} />
				<meshStandardMaterial color="#d6cab4" roughness={0.85} />
			</mesh>
			<mesh position={[0, 1.55, frontZ + 0.05]} castShadow>
				<boxGeometry args={[9.5, 2.7, 0.12]} />
				<meshStandardMaterial color="#141414" roughness={0.6} />
			</mesh>
			{[
				[-3.5, 6.5, 1.6],
				[-2, 7.5, 1.9],
				[-3, 5, 1.4],
				[-1, 6, 1.7],
				[-4, 8, 1.2],
			].map(([x, y, s], i) => (
				<mesh key={i} position={[x, y, frontZ + 0.4]} castShadow>
					<sphereGeometry args={[s, 8, 8]} />
					<meshStandardMaterial color={i % 2 ? '#2f6b3a' : '#3d8a4a'} roughness={0.95} />
				</mesh>
			))}
		</group>
	);
}

function ParkedCar({
	position,
	rotation = 0,
	color,
}: {
	position: [number, number, number];
	rotation?: number;
	color: string;
}) {
	return (
		<group position={position} rotation={[0, rotation, 0]}>
			<mesh position={[0, 0.55, 0]} castShadow>
				<boxGeometry args={[1.8, 0.55, 4.2]} />
				<meshStandardMaterial color={color} roughness={0.55} metalness={0.15} />
			</mesh>
			<mesh position={[0, 1.05, -0.15]} castShadow>
				<boxGeometry args={[1.65, 0.55, 2.4]} />
				<meshStandardMaterial color={color} roughness={0.55} metalness={0.12} />
			</mesh>
			<mesh position={[0, 1.1, 0.35]}>
				<boxGeometry args={[1.5, 0.4, 1.5]} />
				<meshStandardMaterial
					color="#6a8490"
					roughness={0.25}
					metalness={0.2}
					transparent
					opacity={0.75}
				/>
			</mesh>
			{[
				[-0.85, 0.32, 1.2],
				[0.85, 0.32, 1.2],
				[-0.85, 0.32, -1.3],
				[0.85, 0.32, -1.3],
			].map(([x, y, z], i) => (
				<mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.32, 0.32, 0.22, 10]} />
					<meshStandardMaterial color="#1a1a1a" roughness={0.9} />
				</mesh>
			))}
		</group>
	);
}

function FireHydrant({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			<mesh position={[0, 0.35, 0]} castShadow>
				<cylinderGeometry args={[0.14, 0.16, 0.7, 8]} />
				<meshStandardMaterial color="#c43c2e" roughness={0.7} />
			</mesh>
			<mesh position={[0, 0.72, 0]} castShadow>
				<sphereGeometry args={[0.16, 8, 8]} />
				<meshStandardMaterial color="#c43c2e" roughness={0.7} />
			</mesh>
			<mesh position={[0.18, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.06, 0.06, 0.2, 6]} />
				<meshStandardMaterial color="#a83228" roughness={0.7} />
			</mesh>
		</group>
	);
}

function StreetLamp({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			<mesh position={[0, 2.4, 0]} castShadow>
				<cylinderGeometry args={[0.06, 0.09, 4.8, 6]} />
				<meshStandardMaterial color="#3a3a38" roughness={0.85} />
			</mesh>
			<mesh position={[0.35, 4.55, 0]} castShadow>
				<boxGeometry args={[0.9, 0.08, 0.08]} />
				<meshStandardMaterial color="#3a3a38" roughness={0.85} />
			</mesh>
			<mesh position={[0.7, 4.4, 0]}>
				<sphereGeometry args={[0.18, 8, 8]} />
				<meshStandardMaterial
					color="#f0e6c8"
					emissive="#f0e6c8"
					emissiveIntensity={0.45}
					roughness={0.4}
				/>
			</mesh>
		</group>
	);
}

export function Neighborhood() {
	const { brick, asphalt, concrete } = useTownTextures();
	const homeWest = -6.55;

	return (
		<group>
			{/* Ground plane — muted parkway green */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[280, 280]} />
				<meshStandardMaterial color="#7a8e76" roughness={1} />
			</mesh>

			{/* North Ave */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.012, 20]} receiveShadow>
				<planeGeometry args={[90, 14]} />
				<meshStandardMaterial color="#4a4a48" map={asphalt ?? undefined} roughness={0.97} />
			</mesh>

			{/* Bell Ave */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[14.5, 0.013, 0]} receiveShadow>
				<planeGeometry args={[12, 70]} />
				<meshStandardMaterial color="#4a4a48" map={asphalt ?? undefined} roughness={0.97} />
			</mesh>

			{/* Lane dashes on Bell */}
			{Array.from({ length: 14 }).map((_, i) => (
				<mesh
					key={`dash-${i}`}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[14.5, 0.02, -22 + i * 4]}
				>
					<planeGeometry args={[0.18, 1.6]} />
					<meshStandardMaterial color="#d4c98a" roughness={1} />
				</mesh>
			))}

			{/* Intersection apron */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0.014, 18]} receiveShadow>
				<planeGeometry args={[18, 18]} />
				<meshStandardMaterial color="#50504e" map={asphalt ?? undefined} roughness={0.97} />
			</mesh>

			{/* Crosswalk at North & Bell */}
			{Array.from({ length: 7 }).map((_, i) => (
				<mesh
					key={`xw-${i}`}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[9.2 + i * 0.55, 0.021, 14.8]}
				>
					<planeGeometry args={[0.35, 3.2]} />
					<meshStandardMaterial color="#e8e4d8" roughness={1} />
				</mesh>
			))}

			{/* Sidewalks */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.4, 0.03, 0]} receiveShadow>
				<planeGeometry args={[3.2, 55]} />
				<meshStandardMaterial
					color="#c5c1b8"
					map={concrete ?? undefined}
					roughness={0.92}
				/>
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.031, 14.2]} receiveShadow>
				<planeGeometry args={[40, 3.0]} />
				<meshStandardMaterial
					color="#c5c1b8"
					map={concrete ?? undefined}
					roughness={0.92}
				/>
			</mesh>

			{/* Curb along Bell */}
			<mesh position={[7.0, 0.08, 0]} castShadow>
				<boxGeometry args={[0.25, 0.16, 55]} />
				<meshStandardMaterial color="#b0aaa0" roughness={0.9} />
			</mesh>

			{/* Block west of Home on North — stays behind Home from the listing camera */}
			<IvyNeighbor position={[homeWest - 5.5, 0, 7]} brickMap={brick} />
			<RowBuilding
				position={[homeWest - 18, 0, 7]}
				width={12}
				height={9.8}
				depth={12}
				color="#8b5344"
				brickMap={brick}
			/>
			<RowBuilding
				position={[homeWest - 30, 0, 6]}
				width={10}
				height={11.5}
				depth={11}
				color="#7a5a4e"
				brickMap={brick}
			/>

			{/*
			  East of Bell — keep the default camera corridor clear.
			  Camera sits ~x=40 looking at Home; nothing tall between x≈10–40 at z≈-8..12.
			*/}
			<RowBuilding
				position={[28, 0, -22]}
				width={10}
				height={10}
				depth={12}
				color="#6a5a52"
				brickMap={brick}
			/>
			<RowBuilding
				position={[28, 0, -36]}
				width={10}
				height={9}
				depth={10}
				color="#8a6054"
				brickMap={brick}
			/>
			{/* North of the intersection only */}
			<RowBuilding
				position={[28, 0, 28]}
				width={11}
				height={11}
				depth={12}
				color="#5a4e48"
				brickMap={brick}
			/>

			{/* Far north block across North Ave */}
			<RowBuilding
				position={[-4, 0, 32]}
				width={16}
				height={10}
				depth={10}
				color="#7a4840"
				brickMap={brick}
			/>
			<RowBuilding
				position={[18, 0, 34]}
				width={12}
				height={9}
				depth={10}
				color="#6a5550"
				brickMap={brick}
			/>

			{/* Street trees along Bell */}
			<StreetTree position={[9.2, 0, 6]} scale={1.05} seed={1} />
			<StreetTree position={[9.5, 0, 0]} scale={0.95} seed={2} />
			<StreetTree position={[9.3, 0, -6]} scale={1.1} seed={3} />
			<StreetTree position={[9.6, 0, -12]} scale={0.9} seed={4} />
			<StreetTree position={[9.4, 0, 10]} scale={0.88} seed={5} />

			<LeafyTree position={[-16, 0, 13]} scale={0.85} seed={6} />
			<LeafyTree position={[-22, 0, -4]} scale={1.05} seed={7} />
			<LeafyTree position={[30, 0, -28]} scale={0.9} seed={8} />

			{/* Street furniture */}
			<FireHydrant position={[7.6, 0, 3.5]} />
			<FireHydrant position={[7.55, 0, -8]} />
			<StreetLamp position={[7.5, 0, 8]} />
			<StreetLamp position={[7.5, 0, -4]} />
			<StreetLamp position={[7.5, 0, -14]} />
			<StreetLamp position={[2, 0, 13.2]} />

			{/* Parked cars along Bell */}
			<ParkedCar position={[12.2, 0, 4]} rotation={0} color="#2c4a6e" />
			<ParkedCar position={[12.4, 0, -3]} rotation={0.02} color="#c8c4bc" />
			<ParkedCar position={[12.1, 0, -9]} rotation={-0.01} color="#5a2e2e" />
			<ParkedCar position={[5, 0, 17.5]} rotation={Math.PI / 2} color="#3a5a48" />

			{/* Utility pole near corner */}
			<mesh position={[8.6, 4.0, 12.2]} rotation={[0, 0, 0.08]} castShadow>
				<cylinderGeometry args={[0.13, 0.17, 8.0, 6]} />
				<meshStandardMaterial color="#5c4634" roughness={0.95} />
			</mesh>
			<group position={[8.75, 5.5, 12.35]}>
				<mesh>
					<boxGeometry args={[0.06, 2.2, 0.06]} />
					<meshStandardMaterial color="#1a1a1a" />
				</mesh>
				<mesh position={[0.5, 0.85, 0]}>
					<boxGeometry args={[1.0, 0.26, 0.04]} />
					<meshStandardMaterial color="#2f6b3a" />
				</mesh>
			</group>
		</group>
	);
}
