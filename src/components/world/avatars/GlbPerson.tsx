import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { attachTonyGlasses, styleAvatar, type PersonKind } from './styleAvatar';

export type { PersonKind };

type Props = {
	kind: PersonKind;
	height: number;
	slim?: number;
	selected?: boolean;
	onSelect?: () => void;
	idle?: boolean;
	paused?: boolean;
	showLabel?: boolean;
	label: { title: string; sub: string };
	phase?: number;
};

const ASSETS = {
	tony: {
		model: '/avatars/tony.glb',
		walk: '/avatars/m_walk.glb',
		idle: '/avatars/m_idle.glb',
		nativeHeight: 1.83,
	},
	alex: {
		model: '/avatars/alex.glb',
		walk: '/avatars/f_walk.glb',
		idle: '/avatars/f_idle.glb',
		nativeHeight: 1.74,
	},
} as const;

/**
 * Rigged 3D avatar — walk/idle skeleton, styled clothes + hair to match Tony / Alex.
 */
export function GlbPerson({
	kind,
	height,
	slim = 1,
	selected,
	onSelect,
	idle = false,
	paused = false,
	showLabel = true,
	label,
}: Props) {
	const assets = ASSETS[kind];
	const { scene } = useGLTF(assets.model);
	const { animations: walkClips } = useGLTF(assets.walk);
	const { animations: idleClips } = useGLTF(assets.idle);

	const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
	const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone]);
	const walkAction = useRef<THREE.AnimationAction | null>(null);
	const idleAction = useRef<THREE.AnimationAction | null>(null);
	const modeRef = useRef<'walk' | 'idle'>('walk');
	const [hovered, setHovered] = useState(false);
	const [ready, setReady] = useState(false);

	const yScale = height / assets.nativeHeight;
	const xzScale = yScale * slim;

	useEffect(() => {
		let cancelled = false;
		setReady(false);
		(async () => {
			await styleAvatar(clone, kind);
			if (kind === 'tony') {
				clone.updateMatrixWorld(true);
				attachTonyGlasses(clone);
			}
			if (!cancelled) setReady(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [clone, kind]);

	useEffect(() => {
		const walk = walkClips[0];
		const idleClip = idleClips[0];
		if (!walk || !idleClip) return;

		walkAction.current = mixer.clipAction(walk);
		idleAction.current = mixer.clipAction(idleClip);
		walkAction.current.setLoop(THREE.LoopRepeat, Infinity);
		idleAction.current.setLoop(THREE.LoopRepeat, Infinity);

		if (idle || paused) {
			idleAction.current.play();
			modeRef.current = 'idle';
		} else {
			walkAction.current.play();
			modeRef.current = 'walk';
		}

		return () => {
			mixer.stopAllAction();
			walkAction.current = null;
			idleAction.current = null;
		};
	}, [mixer, walkClips, idleClips]);

	useEffect(() => {
		const wantIdle = idle || paused;
		const next = wantIdle ? 'idle' : 'walk';
		if (next === modeRef.current) return;
		if (!walkAction.current || !idleAction.current) return;
		modeRef.current = next;
		const from = next === 'idle' ? walkAction.current : idleAction.current;
		const to = next === 'idle' ? idleAction.current : walkAction.current;
		to.reset().setEffectiveWeight(1).fadeIn(0.25).play();
		from.fadeOut(0.25);
	}, [idle, paused]);

	useFrame((_, delta) => {
		mixer.update(delta);
	});

	const outline = !idle && (selected || hovered);

	return (
		<group
			visible={ready}
			onClick={(e) => {
				e.stopPropagation();
				onSelect?.();
			}}
			onPointerOver={(e) => {
				if (idle) return;
				e.stopPropagation();
				document.body.style.cursor = 'pointer';
				setHovered(true);
			}}
			onPointerOut={() => {
				if (idle) return;
				document.body.style.cursor = 'auto';
				setHovered(false);
			}}
		>
			<group scale={[xzScale, yScale, xzScale]}>
				<primitive object={clone} />
			</group>

			{outline && (
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[0.28 * slim, 0.38 * slim, 40]} />
					<meshBasicMaterial
						color={selected ? '#f0e6c8' : '#dfe8e2'}
						transparent
						opacity={0.9}
					/>
				</mesh>
			)}

			{showLabel && (
				<Html
					position={[0, height + 0.32, 0]}
					center
					distanceFactor={12}
					style={{ pointerEvents: 'none', userSelect: 'none' }}
				>
					<div className={`poi-label${selected ? ' is-selected' : ''}`}>
						<span className="poi-label__title">{label.title}</span>
						<span className="poi-label__sub">{label.sub}</span>
					</div>
				</Html>
			)}
		</group>
	);
}

useGLTF.preload('/avatars/tony.glb');
useGLTF.preload('/avatars/alex.glb');
useGLTF.preload('/avatars/m_walk.glb');
useGLTF.preload('/avatars/f_walk.glb');
useGLTF.preload('/avatars/m_idle.glb');
useGLTF.preload('/avatars/f_idle.glb');
