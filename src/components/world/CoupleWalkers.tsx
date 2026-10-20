import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HighFidelityPerson } from './avatars/HighFidelityPerson';

/** World units ≈ meters. */
const FT = 0.3048;
const ALEX_M = (5 + 4 / 12) * FT; // 5'4"
const TONY_M = (6 + 5 / 12) * FT; // 6'5"

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
