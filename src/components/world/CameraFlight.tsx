import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type CameraGoal = {
	target: [number, number, number];
	distance: number;
	az: number;
	el: number;
};

export type CameraState = {
	az: number;
	el: number;
	dist: number;
	tx: number;
	ty: number;
	tz: number;
};

type Props = {
	goal: CameraGoal | null;
	onArrived?: (state: CameraState) => void;
};

const MAX_FRAMES = 90; // ~1.5s then snap

function sphericalPos(
	target: THREE.Vector3,
	az: number,
	el: number,
	dist: number,
	out: THREE.Vector3,
) {
	const elev = THREE.MathUtils.clamp(el, 0.08, 1.2);
	const d = THREE.MathUtils.clamp(dist, 2.5, 80);
	out.set(
		target.x + d * Math.cos(elev) * Math.sin(az),
		target.y + d * Math.sin(elev),
		target.z + d * Math.cos(elev) * Math.cos(az),
	);
}

/**
 * Smooth Maps-style fly-to. Always uses an explicit az/el so a bad prior
 * camera pose can't poison the flight.
 */
export function CameraFlight({ goal, onArrived }: Props) {
	const { camera, controls } = useThree();
	const goalTarget = useRef(new THREE.Vector3());
	const goalPos = useRef(new THREE.Vector3());
	const flying = useRef(false);
	const frames = useRef(0);
	const onArrivedRef = useRef(onArrived);
	onArrivedRef.current = onArrived;

	useEffect(() => {
		if (!goal) {
			flying.current = false;
			return;
		}
		goalTarget.current.set(
			THREE.MathUtils.clamp(goal.target[0], -80, 80),
			THREE.MathUtils.clamp(goal.target[1], 0.5, 20),
			THREE.MathUtils.clamp(goal.target[2], -80, 80),
		);
		sphericalPos(goalTarget.current, goal.az, goal.el, goal.distance, goalPos.current);
		flying.current = true;
		frames.current = 0;
	}, [goal]);

	useFrame(() => {
		if (!flying.current || !goal) return;

		const ctrl = controls as unknown as {
			target: THREE.Vector3;
			update: () => void;
			enabled?: boolean;
		} | null;

		frames.current += 1;
		const t = Math.min(1, frames.current / 45);
		// Ease-out so we settle cleanly
		const alpha = 1 - (1 - t) * (1 - t);

		camera.position.lerp(goalPos.current, 0.12 + alpha * 0.2);
		if (ctrl?.target) {
			ctrl.target.lerp(goalTarget.current, 0.14 + alpha * 0.2);
			ctrl.update();
		} else {
			camera.lookAt(goalTarget.current);
		}

		const posClose = camera.position.distanceTo(goalPos.current) < 0.45;
		const tgtClose = ctrl ? ctrl.target.distanceTo(goalTarget.current) < 0.3 : true;
		const timedOut = frames.current >= MAX_FRAMES;

		if ((posClose && tgtClose) || timedOut) {
			flying.current = false;
			camera.position.copy(goalPos.current);
			if (ctrl?.target) {
				ctrl.target.copy(goalTarget.current);
				ctrl.update();
			}
			const target = goalTarget.current;
			const offset = camera.position.clone().sub(target);
			const dist = offset.length();
			const el = Math.asin(THREE.MathUtils.clamp(offset.y / dist, -1, 1));
			const az = Math.atan2(offset.x, offset.z);
			onArrivedRef.current?.({
				az,
				el,
				dist,
				tx: target.x,
				ty: target.y,
				tz: target.z,
			});
		}
	});

	return null;
}
