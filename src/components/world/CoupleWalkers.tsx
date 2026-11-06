import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HighFidelityPerson } from './avatars/HighFidelityPerson';
import { FT, PLAN } from './condoLayout';
import { PRIMARY_DOOR } from './PrimaryBedroom';

/** World units ≈ meters. */
const ALEX_M = (5 + 4 / 12) * FT; // 5'4"
const TONY_M = (6 + 5 / 12) * FT; // 6'5"
const LIVING_DEPTH = (22 + 6 / 12) * FT;

/** Main sofa seats — must match LivingDining L-sofa (local plan coords). */
function sofaSeats() {
	const livingZ = PLAN.kitchen.z - LIVING_DEPTH * 0.62;
	const tvX = PRIMARY_DOOR.tvX;
	/** Toward seat front so seated legs hang clear of the cushion volume */
	const seatZ = livingZ + 0.2;
	return {
		seatY: 0.65,
		/** Face +Z in local → after yaw, look toward TV (−Z world) */
		yaw: Math.PI,
		tony: [tvX - 0.48, 0, seatZ] as [number, number, number],
		alex: [tvX + 0.42, 0, seatZ] as [number, number, number],
	};
}

export type PersonId = 'tony' | 'alex';

export type PersonFocus = {
	id: PersonId;
	position: [number, number, number];
	height: number;
};

type WalkerProps = {
	selected?: PersonId | null;
	onSelect?: (focus: PersonFocus) => void;
};

const LOCAL_OFFSETS = {
	tony: [-0.5, 0, 0.08] as [number, number, number],
	alex: [0.48, 0, -0.06] as [number, number, number],
};

const HEIGHTS = { tony: TONY_M, alex: ALEX_M };

export function TonyAvatar(props: {
	selected?: boolean;
	onSelect?: () => void;
	idle?: boolean;
	paused?: boolean;
	sitting?: boolean;
	showLabel?: boolean;
	phase?: number;
}) {
	return (
		<HighFidelityPerson
			kind="tony"
			height={TONY_M}
			label={{ title: 'Tony', sub: 'Neumayer' }}
			phase={0}
			{...props}
		/>
	);
}

export function AlexAvatar(props: {
	selected?: boolean;
	onSelect?: () => void;
	idle?: boolean;
	paused?: boolean;
	sitting?: boolean;
	showLabel?: boolean;
	phase?: number;
}) {
	return (
		<HighFidelityPerson
			kind="alex"
			height={ALEX_M}
			label={{ title: 'Alex', sub: 'Parks' }}
			phase={1.1}
			{...props}
		/>
	);
}

/** Rigged 3D walkers on the Bell Ave sidewalk. */
export function CoupleWalkers({ selected = null, onSelect }: WalkerProps) {
	const pair = useRef<THREE.Group>(null);
	const tonyRef = useRef<THREE.Group>(null);
	const alexRef = useRef<THREE.Group>(null);
	const pausedZ = useRef<number | null>(null);
	const path = useMemo(
		() => ({ x: 8.9, zMin: -11, zMax: 10, speed: 1.15 }),
		[],
	);

	const paused = selected === 'tony' || selected === 'alex';

	useFrame(({ clock }) => {
		if (!pair.current) return;

		if (paused) {
			if (pausedZ.current === null) pausedZ.current = pair.current.position.z;
			pair.current.position.set(path.x, 0, pausedZ.current);
			// Face the street (+X) so close-ups show faces
			pair.current.rotation.y = Math.PI / 2;
			return;
		}

		pausedZ.current = null;
		const t = clock.elapsedTime * path.speed;
		const span = path.zMax - path.zMin;
		const cycle = ((t % (span * 2)) + span * 2) % (span * 2);
		const goingNorth = cycle < span;
		const z = goingNorth ? path.zMin + cycle : path.zMax - (cycle - span);
		pair.current.position.set(path.x, 0, z);
		pair.current.rotation.y = goingNorth ? 0 : Math.PI;
	});

	function focusOf(id: PersonId, node: THREE.Group | null): PersonFocus {
		const v = new THREE.Vector3();
		if (node) node.getWorldPosition(v);
		else v.set(path.x, 0, pair.current?.position.z ?? 0);
		return {
			id,
			position: [v.x, HEIGHTS[id] * 0.55, v.z],
			height: HEIGHTS[id],
		};
	}

	return (
		<group ref={pair}>
			<group ref={tonyRef} position={LOCAL_OFFSETS.tony}>
				<TonyAvatar
					selected={selected === 'tony'}
					paused={paused}
					onSelect={() => onSelect?.(focusOf('tony', tonyRef.current))}
				/>
			</group>
			<group ref={alexRef} position={LOCAL_OFFSETS.alex}>
				<AlexAvatar
					selected={selected === 'alex'}
					paused={paused}
					onSelect={() => onSelect?.(focusOf('alex', alexRef.current))}
				/>
			</group>
		</group>
	);
}

type CondoCoupleProps = WalkerProps & {
	room?: 'kitchen' | 'living' | 'primary';
};

/**
 * Inside Unit 2F — seated on the living sofa facing the TV.
 */
export function CondoCouple({ selected = null, onSelect }: CondoCoupleProps) {
	const tonyRef = useRef<THREE.Group>(null);
	const alexRef = useRef<THREE.Group>(null);
	const seats = useMemo(() => sofaSeats(), []);

	function focusOf(id: PersonId, node: THREE.Group | null): PersonFocus {
		const v = new THREE.Vector3();
		if (node) node.getWorldPosition(v);
		else {
			const p = id === 'tony' ? seats.tony : seats.alex;
			v.set(p[0], seats.seatY, p[2]);
		}
		return {
			id,
			position: [v.x, seats.seatY + HEIGHTS[id] * 0.35, v.z],
			height: HEIGHTS[id],
		};
	}

	return (
		<group>
			<group ref={tonyRef} position={seats.tony} rotation={[0, seats.yaw, 0]}>
				<TonyAvatar
					sitting
					selected={selected === 'tony'}
					onSelect={() => onSelect?.(focusOf('tony', tonyRef.current))}
				/>
			</group>
			<group ref={alexRef} position={seats.alex} rotation={[0, seats.yaw, 0]}>
				<AlexAvatar
					sitting
					selected={selected === 'alex'}
					onSelect={() => onSelect?.(focusOf('alex', alexRef.current))}
				/>
			</group>
		</group>
	);
}
