import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Use sharp if available, else skip image dump
let sharp = null;
try {
	sharp = (await import('sharp')).default;
} catch {
	/* optional */
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

function load(file) {
	const buf = readFileSync(file);
	return new Promise((resolve, reject) => {
		loader.parse(
			buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
			'',
			resolve,
			reject,
		);
	});
}

mkdirSync('public/avatars/tex-preview', { recursive: true });

for (const file of ['public/avatars/tony.glb', 'public/avatars/alex.glb']) {
	const gltf = await load(file);
	const seen = new Set();
	gltf.scene.traverse((o) => {
		if (!o.isMesh) return;
		console.log('MESH', file, o.name, 'bones', !!o.skeleton);
		const list = Array.isArray(o.material) ? o.material : [o.material];
		for (const m of list) {
			if (!m || seen.has(m.uuid)) continue;
			seen.add(m.uuid);
			console.log(
				'  MAT',
				JSON.stringify(m.name),
				m.type,
				'color',
				m.color?.getHexString(),
				'map',
				!!m.map,
				'metal',
				m.metalness,
				'rough',
				m.roughness,
			);
			if (m.map?.source?.data) {
				const data = m.map.source.data;
				console.log('  tex', data.width, data.height, data.constructor?.name);
			}
		}
	});
	const box = new THREE.Box3().setFromObject(gltf.scene);
	console.log('SIZE', file, box.getSize(new THREE.Vector3()).toArray());
}
