import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
	position?: [number, number, number];
	selected?: boolean;
	onSelect?: () => void;
	/** Click the door by the mural → enter Unit 2F kitchen. */
	onEnterCondo?: () => void;
};

const BRICK = '#9b4636';
const BRICK_DARK = '#7a3528';
const STONE = '#e8dfcc';
const STONE_WARM = '#d6cab4';
const FRAME = '#1a1816';
const GLASS = '#6e8a94';
const TEAL = '#2c4a44';
const ROOF = '#252320';

function FacadeWindow({
	position,
	rotation = [0, 0, 0],
	width = 1.0,
	height = 1.5,
	arched = false,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
	width?: number;
	height?: number;
	arched?: boolean;
}) {
	return (
		<group position={position} rotation={rotation}>
			<mesh castShadow>
				<boxGeometry args={[width + 0.12, height + 0.12, 0.1]} />
				<meshStandardMaterial color={FRAME} roughness={0.65} />
			</mesh>
			<mesh position={[0, arched ? -0.08 : 0, 0.04]}>
				<boxGeometry args={[width, arched ? height - 0.22 : height, 0.06]} />
				<meshStandardMaterial
					color={GLASS}
					roughness={0.22}
					metalness={0.1}
					emissive="#b8ccd4"
					emissiveIntensity={0.08}
				/>
			</mesh>
			{arched && (
				<mesh position={[0, height / 2 - 0.2, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
					<torusGeometry args={[width / 2, 0.07, 6, 12, Math.PI]} />
					<meshStandardMaterial color={STONE} roughness={0.85} />
				</mesh>
			)}
			<mesh position={[0, -(height / 2 + 0.07), 0.08]} castShadow>
				<boxGeometry args={[width + 0.26, 0.1, 0.2]} />
				<meshStandardMaterial color={STONE} roughness={0.85} />
			</mesh>
			{!arched && (
				<mesh position={[0, height / 2 + 0.09, 0.06]} castShadow>
					<boxGeometry args={[width + 0.3, 0.12, 0.15]} />
					<meshStandardMaterial color={STONE} roughness={0.85} />
				</mesh>
			)}
		</group>
	);
}

/** Colored dentil cornice — matches turret + Bell Ave roofline in the photo. */
function ColoredCornice({
	position,
	rotation = [0, 0, 0],
	length,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
	length: number;
}) {
	const count = Math.max(6, Math.floor(length / 0.5));
	return (
		<group position={position} rotation={rotation}>
			<mesh castShadow>
				<boxGeometry args={[length, 0.48, 0.55]} />
				<meshStandardMaterial color={STONE} roughness={0.8} />
			</mesh>
			{Array.from({ length: count }).map((_, i) => {
				const x = -length / 2 + 0.3 + i * (length / count);
				const color = i % 3 === 0 ? BRICK_DARK : i % 3 === 1 ? TEAL : STONE_WARM;
				return (
					<mesh key={i} position={[x, 0, 0.3]}>
						<boxGeometry args={[0.3, 0.3, 0.1]} />
						<meshStandardMaterial color={color} roughness={0.85} />
					</mesh>
				);
			})}
		</group>
	);
}

/**
 * Three-sided projecting bay — the repeating motif along Bell in the photo.
 * Local +Z is outward from the wall.
 */
function ProjectingBay({ position }: { position: [number, number, number] }) {
	const h = 6.5;
	const y0 = 3.55;
	const faces: Array<{ x: number; z: number; rot: number }> = [
		{ x: -0.85, z: 0.55, rot: -0.5 },
		{ x: 0, z: 0.85, rot: 0 },
		{ x: 0.85, z: 0.55, rot: 0.5 },
	];

	return (
		<group position={position}>
			{/* Solid bay mass */}
			<mesh position={[0, y0 + h / 2, 0.35]} castShadow receiveShadow>
				<boxGeometry args={[2.9, h, 1.1]} />
				<meshStandardMaterial color={BRICK} roughness={0.93} />
			</mesh>

			{faces.map((f, i) => (
				<group key={i} position={[f.x, y0 + h / 2, f.z]} rotation={[0, f.rot, 0]}>
					{[-1.75, 0, 1.8].map((y) => (
						<mesh key={y} position={[0, y, 0.28]}>
							<boxGeometry args={[1.05, 0.12, 0.12]} />
							<meshStandardMaterial color={STONE} roughness={0.85} />
						</mesh>
					))}
					<FacadeWindow position={[0, -0.95, 0.32]} width={0.82} height={1.3} />
					<FacadeWindow position={[0, 1.55, 0.32]} width={0.82} height={1.3} />
				</group>
			))}
		</group>
	);
}

function useMuralTexture() {
	return useMemo(() => {
		if (typeof document === 'undefined') return null;
		const canvas = document.createElement('canvas');
		canvas.width = 720;
		canvas.height = 280;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		// Match listing mural: soft blues / greens / cream abstract
		const grad = ctx.createLinearGradient(0, 0, 720, 280);
		grad.addColorStop(0, '#1a4a7a');
		grad.addColorStop(0.4, '#3d9ad9');
		grad.addColorStop(0.7, '#7ec8a0');
		grad.addColorStop(1, '#f0e8c8');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 720, 280);
		for (const [x, y, r, color] of [
			[120, 90, 70, '#ffffff'],
			[280, 140, 90, '#5ecfff'],
			[420, 80, 60, '#b8f0d0'],
			[560, 160, 80, '#ffe9a0'],
			[200, 200, 50, '#2a7a9a'],
		] as const) {
			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.globalAlpha = 0.85;
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.needsUpdate = true;
		return texture;
	}, []);
}

function NorthGable({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			<mesh position={[0, 0.7, -0.2]} castShadow>
				<boxGeometry args={[3.4, 1.4, 1.2]} />
				<meshStandardMaterial color={BRICK} roughness={0.93} />
			</mesh>
			<mesh position={[-0.85, 1.85, 0.15]} rotation={[0, 0, 0.65]} castShadow>
				<boxGeometry args={[2.2, 1.3, 1.0]} />
				<meshStandardMaterial color={BRICK} roughness={0.93} />
			</mesh>
			<mesh position={[0.85, 1.85, 0.15]} rotation={[0, 0, -0.65]} castShadow>
				<boxGeometry args={[2.2, 1.3, 1.0]} />
				<meshStandardMaterial color={BRICK} roughness={0.93} />
			</mesh>
			<mesh position={[0, 0.5, 0.55]} castShadow>
				<boxGeometry args={[2.0, 1.45, 0.14]} />
				<meshStandardMaterial color={STONE} roughness={0.85} />
			</mesh>
			{[-0.38, 0.38].map((x) => (
				<FacadeWindow key={x} position={[x, 0.4, 0.65]} width={0.58} height={1.05} arched />
			))}
			<group position={[0, 3.05, 0.3]}>
				<mesh castShadow>
					<boxGeometry args={[0.12, 0.7, 0.12]} />
					<meshStandardMaterial color={STONE} roughness={0.8} />
				</mesh>
				<mesh position={[0, 0.12, 0]} castShadow>
					<boxGeometry args={[0.45, 0.12, 0.12]} />
					<meshStandardMaterial color={STONE} roughness={0.8} />
				</mesh>
			</group>
		</group>
	);
}

function CornerTurret() {
	const radius = 1.9;
	const segments = 8;
	const baseY = 3.2;
	const bodyH = 7.2;
	const midY = baseY + bodyH / 2;
	const windowAngles = [0.12, Math.PI / 4, Math.PI / 2 - 0.12];
	const roofY = baseY + bodyH + 0.35;

	return (
		<group>
			<mesh position={[0.25, baseY - 0.16, 0.25]} rotation={[0, Math.PI / 4, 0]} castShadow>
				<boxGeometry args={[3.7, 0.22, 2.1]} />
				<meshStandardMaterial color={TEAL} roughness={0.75} />
			</mesh>
			{/* Heavy stone lintel under bay (photo) */}
			<mesh position={[0.2, baseY + 0.05, 0.2]} rotation={[0, Math.PI / 4, 0]} castShadow>
				<boxGeometry args={[3.5, 0.28, 1.8]} />
				<meshStandardMaterial color={STONE} roughness={0.85} />
			</mesh>

			<mesh position={[0, midY, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[radius, radius + 0.08, bodyH, segments]} />
				<meshStandardMaterial color={BRICK} roughness={0.93} />
			</mesh>

			{[4.5, 5.9, 7.5, 9.0].map((y) => (
				<mesh key={y} position={[0, y, 0]} castShadow>
					<cylinderGeometry args={[radius + 0.1, radius + 0.1, 0.14, segments]} />
					<meshStandardMaterial color={STONE} roughness={0.85} />
				</mesh>
			))}

			{[5.2, 8.25].map((y) =>
				windowAngles.map((angle) => (
					<FacadeWindow
						key={`${y}-${angle}`}
						position={[
							Math.sin(angle) * (radius + 0.03),
							y,
							Math.cos(angle) * (radius + 0.03),
						]}
						rotation={[0, angle, 0]}
						width={0.9}
						height={1.4}
					/>
				)),
			)}

			<mesh position={[0, roofY - 0.12, 0]} castShadow>
				<cylinderGeometry args={[radius + 0.3, radius + 0.3, 0.52, segments]} />
				<meshStandardMaterial color={STONE} roughness={0.8} />
			</mesh>
			{Array.from({ length: 12 }).map((_, i) => {
				const a = (i / 12) * Math.PI * 2;
				return (
					<mesh
						key={i}
						position={[
							Math.sin(a) * (radius + 0.32),
							roofY - 0.12,
							Math.cos(a) * (radius + 0.32),
						]}
						rotation={[0, a, 0]}
					>
						<boxGeometry args={[0.4, 0.34, 0.1]} />
						<meshStandardMaterial
							color={i % 2 === 0 ? BRICK_DARK : TEAL}
							roughness={0.85}
						/>
					</mesh>
				);
			})}

			<mesh position={[0, roofY + 1.9, 0]} castShadow>
				<coneGeometry args={[radius + 0.9, 3.5, segments]} />
				<meshStandardMaterial color={ROOF} roughness={0.9} />
			</mesh>
			<mesh position={[0, roofY + 3.8, 0]} castShadow>
				<cylinderGeometry args={[0.07, 0.07, 0.45, 8]} />
				<meshStandardMaterial color={FRAME} roughness={0.7} />
			</mesh>

			<group position={[1.2, 0, 1.2]} rotation={[0, Math.PI / 4, 0]}>
				<mesh position={[0, 1.5, 0.02]} castShadow>
					<boxGeometry args={[1.6, 2.9, 0.14]} />
					<meshStandardMaterial color={FRAME} roughness={0.65} />
				</mesh>
				<mesh position={[0, 1.65, 0.1]}>
					<boxGeometry args={[1.25, 2.35, 0.06]} />
					<meshStandardMaterial
						color={GLASS}
						roughness={0.15}
						transparent
						opacity={0.7}
						emissive="#eef6f8"
						emissiveIntensity={0.1}
					/>
				</mesh>
			</group>
		</group>
	);
}

/**
 * 1553 N Bell — Bell Ave listing photo composition:
 * corner turret (left) → mural → bays → pedimented entry.
 */
export function BellAveHome({
	position = [0, 0, 0],
	selected = false,
	onSelect,
	onEnterCondo,
}: Props) {
	const group = useRef<THREE.Group>(null);
	const [hovered, setHovered] = useState(false);
	const [doorHovered, setDoorHovered] = useState(false);
	const muralMap = useMuralTexture();
	const outline = selected || hovered;

	// Longer along Bell (Z) so three bays + entry read like the photo
	const width = 13;
	const depth = 26;
	const height = 10.2;
	const frontZ = depth / 2; // North Ave end
	const sideX = width / 2; // Bell Ave face
	const backZ = -depth / 2;

	function handlePointer(e: ThreeEvent<PointerEvent>) {
		e.stopPropagation();
		setHovered(true);
		document.body.style.cursor = 'pointer';
	}

	function handleOut() {
		setHovered(false);
		document.body.style.cursor = 'auto';
	}

	return (
		<group
			ref={group}
			position={position}
			onClick={(e) => {
				e.stopPropagation();
				onSelect?.();
			}}
			onPointerOver={handlePointer}
			onPointerOut={handleOut}
		>
			<mesh position={[0, height / 2, 0]} castShadow receiveShadow>
				<boxGeometry args={[width, height, depth]} />
				<meshStandardMaterial color={BRICK} roughness={0.93} />
			</mesh>

			{/* Full colored cornice — Bell + North */}
			<ColoredCornice
				position={[sideX - 0.02, height + 0.08, 0]}
				rotation={[0, Math.PI / 2, 0]}
				length={depth + 0.4}
			/>
			<ColoredCornice position={[0, height + 0.08, frontZ - 0.02]} length={width + 0.3} />

			<mesh position={[0, height + 0.35, 0]}>
				<boxGeometry args={[width - 0.35, 0.18, depth - 0.35]} />
				<meshStandardMaterial color={ROOF} roughness={0.95} />
			</mesh>

			{/* Chimneys along Bell roof */}
			{[-8, -3, 2, 7].map((z, i) => (
				<mesh key={i} position={[1.5 - (i % 2), height + 1.15, z]} castShadow>
					<boxGeometry args={[0.7, 1.7, 0.55]} />
					<meshStandardMaterial color={BRICK} roughness={0.93} />
				</mesh>
			))}

			<mesh position={[0, 0.28, 0]} castShadow receiveShadow>
				<boxGeometry args={[width + 0.08, 0.56, depth + 0.08]} />
				<meshStandardMaterial color={BRICK_DARK} roughness={0.9} />
			</mesh>

			{/* ===== NORTH AVE (short end) ===== */}
			{[-3.5, -0.5, 2.5].map((x) => (
				<group key={`store-${x}`} position={[x, 1.55, frontZ + 0.05]}>
					<mesh castShadow>
						<boxGeometry args={[2.5, 2.7, 0.1]} />
						<meshStandardMaterial color={FRAME} roughness={0.65} />
					</mesh>
					<mesh position={[0, 0.05, 0.04]}>
						<boxGeometry args={[2.2, 2.3, 0.06]} />
						<meshStandardMaterial
							color={GLASS}
							roughness={0.15}
							transparent
							opacity={0.7}
							emissive="#eef6f8"
							emissiveIntensity={0.07}
						/>
					</mesh>
				</group>
			))}
			<mesh position={[0, 3.15, frontZ + 0.1]} castShadow>
				<boxGeometry args={[width - 0.5, 0.24, 0.2]} />
				<meshStandardMaterial color={TEAL} roughness={0.75} />
			</mesh>
			{[5.05, 7.8].map((y) =>
				[-3.8, -1.5, 0.8].map((x) => (
					<FacadeWindow key={`n-${y}-${x}`} position={[x, y, frontZ + 0.06]} width={0.9} height={1.35} />
				)),
			)}
			<NorthGable position={[1.4, height, frontZ]} />

			{/* ===== BELL AVE (+X) — listing photo facade ===== */}
			{/* Glass-block basement windows */}
			{[-9, -5.5, -2, 1.5, 5, 8.5].map((z) => (
				<mesh key={`gb-${z}`} position={[sideX + 0.06, 0.85, z]} rotation={[0, Math.PI / 2, 0]}>
					<boxGeometry args={[1.15, 0.65, 0.1]} />
					<meshStandardMaterial
						color="#c5d8de"
						roughness={0.35}
						transparent
						opacity={0.85}
						emissive="#eef6f8"
						emissiveIntensity={0.06}
					/>
				</mesh>
			))}

			{/* Three projecting bays down Bell (photo has multiple) */}
			{[2.5, -2.5, -8].map((z) => (
				<group key={`bay-${z}`} position={[sideX, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
					<ProjectingBay position={[0, 0, 0]} />
				</group>
			))}

			{/* Flat windows between bays */}
			{[5.1, 7.85].map((y) =>
				[5.5, -0.2, -5.5].map((z) => (
					<FacadeWindow
						key={`flat-${y}-${z}`}
						position={[sideX + 0.06, y, z]}
						rotation={[0, Math.PI / 2, 0]}
						width={0.9}
						height={1.35}
					/>
				)),
			)}

			{/* Large mural — right of corner storefront (photo) */}
			{muralMap && (
				<mesh position={[sideX + 0.09, 1.95, 8.2]} rotation={[0, Math.PI / 2, 0]}>
					<planeGeometry args={[4.6, 2.3]} />
					<meshStandardMaterial map={muralMap} roughness={0.88} />
				</mesh>
			)}
			<mesh position={[sideX + 0.05, 1.95, 8.2]} rotation={[0, Math.PI / 2, 0]}>
				<boxGeometry args={[4.85, 2.5, 0.06]} />
				<meshStandardMaterial color={FRAME} roughness={0.7} />
			</mesh>

			{/* Unit 2F door — immediately right (south) of the mural → kitchen */}
			<group
				position={[sideX + 0.14, 0, 5.15]}
				rotation={[0, Math.PI / 2, 0]}
				onClick={(e) => {
					e.stopPropagation();
					onEnterCondo?.();
				}}
				onPointerOver={(e) => {
					e.stopPropagation();
					setDoorHovered(true);
					document.body.style.cursor = 'pointer';
				}}
				onPointerOut={() => {
					setDoorHovered(false);
					document.body.style.cursor = 'auto';
				}}
			>
				{/* Stoop */}
				<mesh position={[0, 0.18, 0.45]} castShadow receiveShadow>
					<boxGeometry args={[1.5, 0.36, 0.9]} />
					<meshStandardMaterial color="#cfc6b6" roughness={0.9} />
				</mesh>
				{/* Frame */}
				<mesh position={[0, 1.45, 0.02]} castShadow>
					<boxGeometry args={[1.35, 2.7, 0.16]} />
					<meshStandardMaterial color={STONE} roughness={0.8} />
				</mesh>
				{/* Door leaf */}
				<mesh position={[0, 1.4, 0.12]} castShadow>
					<boxGeometry args={[1.05, 2.35, 0.08]} />
					<meshStandardMaterial
						color={doorHovered ? '#6a3228' : '#4a221c'}
						roughness={0.65}
					/>
				</mesh>
				{/* Glass lite */}
				<mesh position={[0, 1.95, 0.18]}>
					<boxGeometry args={[0.7, 0.85, 0.04]} />
					<meshStandardMaterial
						color={GLASS}
						roughness={0.2}
						transparent
						opacity={0.7}
						emissive="#eef6f8"
						emissiveIntensity={doorHovered ? 0.25 : 0.12}
					/>
				</mesh>
				{/* Knob */}
				<mesh position={[0.38, 1.35, 0.2]} castShadow>
					<sphereGeometry args={[0.04, 10, 10]} />
					<meshStandardMaterial color="#c4a35a" metalness={0.7} roughness={0.3} />
				</mesh>
				<Html
					position={[0, 2.95, 0.25]}
					center
					distanceFactor={14}
					style={{ pointerEvents: 'none', userSelect: 'none' }}
				>
					<div className={`poi-label${doorHovered ? ' is-selected' : ''}`}>
						<span className="poi-label__title">Unit 2F</span>
						<span className="poi-label__sub">Come inside → kitchen</span>
					</div>
				</Html>
			</group>

			{/* Pedimented residential entry further down Bell */}
			<group position={[sideX, 0, -11.5]} rotation={[0, Math.PI / 2, 0]}>
				<mesh position={[0, 1.9, -0.12]} castShadow>
					<boxGeometry args={[2.6, 3.3, 0.5]} />
					<meshStandardMaterial color={BRICK_DARK} roughness={0.92} />
				</mesh>
				{[-0.95, 0.95].map((x) => (
					<mesh key={x} position={[x, 1.7, 0.12]} castShadow>
						<boxGeometry args={[0.4, 3.15, 0.4]} />
						<meshStandardMaterial color={STONE} roughness={0.8} />
					</mesh>
				))}
				<mesh position={[0, 3.45, 0.16]} castShadow>
					<boxGeometry args={[2.35, 0.38, 0.48]} />
					<meshStandardMaterial color={STONE} roughness={0.8} />
				</mesh>
				{/* Triangular pediment */}
				<mesh position={[-0.7, 3.95, 0.28]} rotation={[0, 0, 0.55]} castShadow>
					<boxGeometry args={[1.5, 0.22, 0.35]} />
					<meshStandardMaterial color={STONE} roughness={0.8} />
				</mesh>
				<mesh position={[0.7, 3.95, 0.28]} rotation={[0, 0, -0.55]} castShadow>
					<boxGeometry args={[1.5, 0.22, 0.35]} />
					<meshStandardMaterial color={STONE} roughness={0.8} />
				</mesh>
				<mesh position={[0, 1.55, 0.05]} castShadow>
					<boxGeometry args={[1.2, 2.4, 0.12]} />
					<meshStandardMaterial color="#5a281f" roughness={0.7} />
				</mesh>
				<mesh position={[0, 1.85, 0.12]}>
					<boxGeometry args={[0.8, 1.1, 0.05]} />
					<meshStandardMaterial
						color={GLASS}
						roughness={0.2}
						transparent
						opacity={0.75}
						emissive="#eef6f8"
						emissiveIntensity={0.1}
					/>
				</mesh>
				<Html position={[0, 2.9, 0.22]} center distanceFactor={24} style={{ pointerEvents: 'none' }}>
					<span
						style={{
							fontFamily: 'Figtree, system-ui, sans-serif',
							fontSize: '11px',
							fontWeight: 700,
							letterSpacing: '0.12em',
							color: '#f2ebe0',
							background: '#1a1816',
							padding: '2px 6px',
						}}
					>
						1553
					</span>
				</Html>
				<mesh position={[0, 0.3, 0.7]} castShadow receiveShadow>
					<boxGeometry args={[2.3, 0.6, 1.15]} />
					<meshStandardMaterial color="#cfc6b6" roughness={0.9} />
				</mesh>
			</group>

			{/* Corner turret at North & Bell (NE) */}
			<group position={[sideX - 0.7, 0, frontZ - 0.7]}>
				<CornerTurret />
			</group>

			{outline && (
				<mesh position={[2, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[15, 15.6, 64]} />
					<meshBasicMaterial
						color={selected ? '#f0e6c8' : '#dfe8e2'}
						transparent
						opacity={0.9}
					/>
				</mesh>
			)}

			<Html
				position={[sideX + 2, height + 4.5, 4]}
				center
				distanceFactor={20}
				style={{ pointerEvents: 'none', userSelect: 'none' }}
			>
				<div className={`poi-label${selected ? ' is-selected' : ''}`}>
					<span className="poi-label__title">Home</span>
					<span className="poi-label__sub">1553 N Bell · from Bell Ave</span>
				</div>
			</Html>
		</group>
	);
}
