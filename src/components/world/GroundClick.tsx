import { useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

type Props = {
	onFlyTo: (point: [number, number, number]) => void;
};

/**
 * Double-click the ground to fly there (Maps-style). Single click is ignored
 * so orbit drags and accidental taps don't yeet the camera.
 */
export function GroundClick({ onFlyTo }: Props) {
	const last = useRef(0);

	function handleClick(e: ThreeEvent<MouseEvent>) {
		e.stopPropagation();
		const now = performance.now();
		if (now - last.current > 350) {
			last.current = now;
			return; // wait for a second click
		}
		last.current = 0;
		const x = Math.max(-60, Math.min(60, e.point.x));
		const z = Math.max(-60, Math.min(60, e.point.z));
		onFlyTo([x, 0, z]);
	}

	return (
		<mesh
			rotation={[-Math.PI / 2, 0, 0]}
			position={[0, 0.04, 0]}
			onDoubleClick={handleClick}
			onClick={handleClick}
		>
			<planeGeometry args={[160, 160]} />
			<meshBasicMaterial transparent opacity={0} depthWrite={false} />
		</mesh>
	);
}
