import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { PersonKind } from './styleAvatar';

const PORTRAITS: Record<PersonKind, string> = {
	tony: '/avatars/refs/tony-face.png',
	alex: '/avatars/refs/alex-face.png',
};

type Props = {
	kind: PersonKind;
	avatarRoot: THREE.Object3D;
	height: number;
};

/**
 * Stylized face+hair plate that tracks the head bone and billboards toward the camera.
 */
export function LikenessHead({ kind, avatarRoot, height }: Props) {
	const group = useRef<THREE.Group>(null);
	const { camera } = useThree();
	const map = useTexture(PORTRAITS[kind]);

	useLayoutEffect(() => {
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 8;
		map.needsUpdate = true;
	}, [map]);

	const headBone = useMemo(() => {
		return (
			avatarRoot.getObjectByName('Bip01 Head') ??
			avatarRoot.getObjectByName('Head') ??
			null
		);
	}, [avatarRoot]);

	const w = height * (kind === 'tony' ? 0.22 : 0.2);
	const h = height * 0.3;

	const worldPos = useMemo(() => new THREE.Vector3(), []);
	const camPos = useMemo(() => new THREE.Vector3(), []);
	const toCam = useMemo(() => new THREE.Vector3(), []);
	const localPos = useMemo(() => new THREE.Vector3(), []);
	const parentQ = useMemo(() => new THREE.Quaternion(), []);
	const camQ = useMemo(() => new THREE.Quaternion(), []);

	useFrame(() => {
		if (!group.current || !headBone) return;

		headBone.getWorldPosition(worldPos);
		camera.getWorldPosition(camPos);
		toCam.copy(camPos).sub(worldPos).normalize();
		worldPos.addScaledVector(toCam, height * 0.045);
		worldPos.y += height * 0.025;

		localPos.copy(worldPos);
		group.current.parent?.worldToLocal(localPos);
		group.current.position.copy(localPos);

		camQ.copy(camera.quaternion);
		if (group.current.parent) {
			group.current.parent.getWorldQuaternion(parentQ);
			group.current.quaternion.copy(parentQ).invert().multiply(camQ);
		} else {
			group.current.quaternion.copy(camQ);
		}
	});

	return (
		<group ref={group} frustumCulled={false}>
			<mesh renderOrder={20} frustumCulled={false}>
				<planeGeometry args={[w, h]} />
				<meshBasicMaterial
					map={map}
					transparent
					alphaTest={0.05}
					depthWrite={false}
					toneMapped
					side={THREE.DoubleSide}
				/>
			</mesh>
		</group>
	);
}

useTexture.preload(PORTRAITS.tony);
useTexture.preload(PORTRAITS.alex);
