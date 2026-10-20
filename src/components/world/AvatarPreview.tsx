import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { AlexAvatar, TonyAvatar, type PersonId } from './CoupleWalkers';
import { WorldPostFX } from './effects/WorldPostFX';
import styles from './World.module.scss';

type Props = {
	person: PersonId;
};

function SpinningAvatar({ person }: Props) {
	const root = useRef<THREE.Group>(null);
	const height = person === 'tony' ? 1.96 : 1.63;

	useFrame(({ clock }) => {
		// Gentle yaw facing the camera — stay mostly front-on
		if (root.current) root.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.4;
	});

	return (
		<group ref={root} position={[0, 0, 0]}>
			{person === 'tony' ? (
				<TonyAvatar idle showLabel={false} />
			) : (
				<AlexAvatar idle showLabel={false} />
			)}
			<mesh position={[0, height / 2, 0]} visible={false}>
				<boxGeometry args={[0.01, height, 0.01]} />
			</mesh>
		</group>
	);
}

function PreviewScene({ person }: Props) {
	const height = person === 'tony' ? 1.96 : 1.63;
	// Portrait framing: camera looks at upper chest / face
	const lookY = height * 0.62;
	const camY = height * 0.72;
	const camZ = height * 1.55;

	return (
		<>
			<color attach="background" args={['#dfe8e2']} />
			<PerspectiveCamera makeDefault position={[0.15, camY, camZ]} fov={28} near={0.05} far={30} />
			<ambientLight intensity={0.55} />
			<directionalLight position={[2.5, 5, 3]} intensity={1.35} castShadow />
			{/* Rim / kicker — separates face from background like the reference */}
			<directionalLight position={[-3, 2.5, -2]} intensity={0.85} color="#c8d8ff" />
			<directionalLight position={[0.5, 1.5, 4]} intensity={0.4} color="#ffe8d0" />
			<hemisphereLight args={['#ffffff', '#8a9a86', 0.45]} />
			<Environment preset="studio" environmentIntensity={0.45} />

			<SpinningAvatar person={person} />

			{/* Keep camera aimed at the face/chest while they spin */}
			<CameraLookAt y={lookY} />

			<ContactShadows
				position={[0, 0.005, 0]}
				opacity={0.4}
				scale={3}
				blur={2}
				far={2.5}
			/>
			<WorldPostFX preview />
		</>
	);
}

function CameraLookAt({ y }: { y: number }) {
	useFrame(({ camera }) => {
		camera.lookAt(0, y, 0);
	});
	return null;
}

/** Close-up turntable preview for the side panel. */
export function AvatarPreview({ person }: Props) {
	return (
		<div className={styles.preview} aria-hidden="true">
			<Canvas
				key={person}
				className={styles.previewCanvas}
				dpr={[1, 1.75]}
				gl={{ antialias: true, alpha: false }}
			>
				<Suspense fallback={null}>
					<PreviewScene person={person} />
				</Suspense>
			</Canvas>
		</div>
	);
}
