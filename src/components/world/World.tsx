import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarPreview } from './AvatarPreview';
import { BellAveHome } from './BellAveHome';
import { CameraFlight, type CameraGoal, type CameraState } from './CameraFlight';
import { CondoInterior } from './CondoInterior';
import { CoupleWalkers, type PersonFocus, type PersonId } from './CoupleWalkers';
import { isCatId, type CatFocus, type CatId } from './CatWalkers';
import { GroundClick } from './GroundClick';
import { NAV_ROOMS, ROOM_COPY, ROOM_GOALS, type CondoRoomId } from './InteriorWalk';
import { WorldPostFX } from './effects/WorldPostFX';
import { Neighborhood } from './Neighborhood';
import styles from './World.module.scss';

type PlaceId = 'home' | PersonId | CatId | null;

/** Bell Ave listing-photo angle — turret left, bays running right. */
const DEFAULT_CAMERA: CameraState = {
	az: 1.35,
	el: 0.14,
	dist: 36,
	tx: 5,
	ty: 5,
	tz: 2,
};

const HOME_GOAL: CameraGoal = {
	target: [2.5, 4.5, 1],
	distance: 22,
	az: 1.25,
	el: 0.18,
};

const OVERVIEW_GOAL: CameraGoal = {
	target: [DEFAULT_CAMERA.tx, DEFAULT_CAMERA.ty, DEFAULT_CAMERA.tz],
	distance: DEFAULT_CAMERA.dist,
	az: DEFAULT_CAMERA.az,
	el: DEFAULT_CAMERA.el,
};

function clampCamera(state: CameraState): CameraState {
	return {
		az: Number.isFinite(state.az) ? state.az : DEFAULT_CAMERA.az,
		el: THREE.MathUtils.clamp(
			Number.isFinite(state.el) ? state.el : DEFAULT_CAMERA.el,
			0.08,
			1.2,
		),
		dist: THREE.MathUtils.clamp(
			Number.isFinite(state.dist) ? state.dist : DEFAULT_CAMERA.dist,
			2.5,
			80,
		),
		tx: THREE.MathUtils.clamp(
			Number.isFinite(state.tx) ? state.tx : DEFAULT_CAMERA.tx,
			-80,
			80,
		),
		ty: THREE.MathUtils.clamp(
			Number.isFinite(state.ty) ? state.ty : DEFAULT_CAMERA.ty,
			0.5,
			20,
		),
		tz: THREE.MathUtils.clamp(
			Number.isFinite(state.tz) ? state.tz : DEFAULT_CAMERA.tz,
			-80,
			80,
		),
	};
}

function parseCameraFromUrl(): CameraState {
	if (typeof window === 'undefined') return DEFAULT_CAMERA;
	const params = new URLSearchParams(window.location.search);
	const raw = params.get('camera');
	if (!raw) return DEFAULT_CAMERA;
	const parts = raw.split(',').map(Number);
	if (parts.length < 6 || parts.some((n) => Number.isNaN(n))) return DEFAULT_CAMERA;
	const [az, el, dist, tx, ty, tz] = parts;
	return clampCamera({ az, el, dist, tx, ty, tz });
}

function writeCameraToUrl(state: CameraState, at: PlaceId) {
	const s = clampCamera(state);
	const value = [
		s.az.toFixed(2),
		s.el.toFixed(2),
		s.dist.toFixed(1),
		s.tx.toFixed(2),
		s.ty.toFixed(2),
		s.tz.toFixed(2),
	].join(',');
	const url = new URL(window.location.href);
	url.searchParams.set('camera', value);
	if (at) url.searchParams.set('at', at);
	else url.searchParams.delete('at');
	window.history.replaceState({}, '', url);
}

function sphericalToPosition(state: CameraState): [number, number, number] {
	const s = clampCamera(state);
	const x = s.tx + s.dist * Math.cos(s.el) * Math.sin(s.az);
	const y = s.ty + s.dist * Math.sin(s.el);
	const z = s.tz + s.dist * Math.cos(s.el) * Math.cos(s.az);
	return [x, y, z];
}

function personGoal(focus: PersonFocus): CameraGoal {
	const [x, , z] = focus.position;
	const faceY = focus.height * 0.78;
	return {
		target: [x, faceY, z],
		distance: Math.max(3.2, focus.height * 1.55),
		az: Math.PI / 2,
		el: 0.1,
	};
}

const places = {
	home: {
		id: 'home' as const,
		kind: 'Place',
		title: 'Home',
		subtitle: '1553 N Bell Ave, Unit 2F',
		body: 'End of the block at North & Bell — conical corner turret, limestone bands, Bell Ave bays, and the mural by the stoop. Unit 2F is home base.',
		facts: ['Conical turret', '2 bed · 2 bath', 'Wicker Park', 'Chicago, IL'],
	},
	tony: {
		id: 'tony' as const,
		kind: 'Person',
		title: 'Tony Neumayer',
		subtitle: 'One half of the story',
		body: '',
		facts: ['Partner', 'Chicago'],
	},
	alex: {
		id: 'alex' as const,
		kind: 'Person',
		title: 'Alex Parks',
		subtitle: 'One half of the story',
		body: '',
		facts: ['Partner', 'Chicago'],
	},
	olive: {
		id: 'olive' as const,
		kind: 'Cat',
		title: 'Olive',
		subtitle: 'Black & white tuxedo',
		body: 'The black-and-white one — curious, precise, and usually first to the kitchen.',
		facts: ['Tuxedo', 'Unit 2F', 'Loves counters'],
	},
	neil: {
		id: 'neil' as const,
		kind: 'Cat',
		title: 'Neil',
		subtitle: 'Brown tabby',
		body: 'The striped one — warmer fur, softer pace, never far from Olive.',
		facts: ['Tabby', 'Unit 2F', 'Loves sun patches'],
	},
};

function Scene({
	selected,
	inside,
	condoRoom,
	flightGoal,
	onSelectPlace,
	onSelectPerson,
	onSelectCat,
	onEnterCondo,
	onGroundFly,
	onFlightArrived,
	onCameraChange,
}: {
	selected: PlaceId;
	inside: boolean;
	condoRoom: Exclude<CondoRoomId, 'hall'>;
	flightGoal: CameraGoal | null;
	onSelectPlace: (id: PlaceId) => void;
	onSelectPerson: (focus: PersonFocus) => void;
	onSelectCat: (focus: CatFocus) => void;
	onEnterCondo: () => void;
	onGroundFly: (point: [number, number, number]) => void;
	onFlightArrived: (state: CameraState) => void;
	onCameraChange: (state: CameraState) => void;
}) {
	const focusingPerson = !inside && (selected === 'tony' || selected === 'alex');
	const selectedCat = inside && isCatId(selected) ? selected : null;
	const roomGoal = ROOM_GOALS[condoRoom];
	const roomCamPos = useMemo(
		() =>
			sphericalToPosition({
				az: roomGoal.az,
				el: roomGoal.el,
				dist: roomGoal.distance,
				tx: roomGoal.target[0],
				ty: roomGoal.target[1],
				tz: roomGoal.target[2],
			}),
		[roomGoal],
	);

	if (inside) {
		return (
			<>
				<color attach="background" args={['#cfc6ba']} />
				<PerspectiveCamera
					makeDefault
					fov={48}
					near={0.15}
					far={80}
					position={roomCamPos}
					up={[0, 1, 0]}
				/>
				<ambientLight intensity={0.85} />
				<directionalLight position={[6, 14, 8]} intensity={0.9} castShadow />
				<hemisphereLight args={['#fff8f0', '#6a5a4a', 0.5]} />
				<CondoInterior selectedCat={selectedCat} onSelectCat={onSelectCat} />
				<OrbitControls
					makeDefault
					enablePan={false}
					enableDamping
					dampingFactor={0.1}
					target={roomGoal.target}
					minDistance={3}
					maxDistance={11}
					minPolarAngle={0.4}
					maxPolarAngle={Math.PI / 2.3}
				/>
			</>
		);
	}

	return (
		<>
			<color attach="background" args={['#b8c9c4']} />
			<fog attach="fog" args={['#c5d4cf', 35, 85]} />
			<ambientLight intensity={0.95} />
			<directionalLight
				castShadow
				position={[22, 36, 14]}
				intensity={0.85}
				shadow-mapSize={[1024, 1024]}
				shadow-camera-far={100}
				shadow-camera-left={-40}
				shadow-camera-right={40}
				shadow-camera-top={40}
				shadow-camera-bottom={-40}
				shadow-bias={-0.0004}
				shadow-normalBias={0.04}
			/>
			<directionalLight position={[-12, 18, -8]} intensity={0.45} color="#c8d4e0" />
			<hemisphereLight args={['#e8f0ec', '#8a9a86', 0.7]} />
			<Environment preset="city" environmentIntensity={0.35} />
			<Sky
				sunPosition={[60, 28, 18]}
				turbidity={4}
				rayleigh={0.85}
				mieCoefficient={0.004}
				mieDirectionalG={0.7}
			/>
			<GroundClick onFlyTo={onGroundFly} />
			<Neighborhood />
			<BellAveHome
				position={[0, 0, 0]}
				selected={selected === 'home'}
				onSelect={() => onSelectPlace('home')}
				onEnterCondo={onEnterCondo}
			/>
			<CoupleWalkers
				selected={focusingPerson ? selected : null}
				onSelect={onSelectPerson}
			/>
			<WorldPostFX />
			<CameraFlight goal={flightGoal} onArrived={onFlightArrived} />
			<OrbitControls
				makeDefault
				enablePan
				enableDamping
				dampingFactor={0.08}
				minDistance={focusingPerson ? 2.5 : 8}
				maxDistance={70}
				minPolarAngle={0.15}
				maxPolarAngle={Math.PI / 2.2}
				onEnd={(e) => {
					const controls = e.target as unknown as {
						object: THREE.Camera & { position: THREE.Vector3 };
						target: THREE.Vector3;
					};
					const cam = controls.object.position;
					const t = controls.target;
					const offset = cam.clone().sub(t);
					const dist = offset.length();
					if (!Number.isFinite(dist) || dist < 0.5) return;
					const el = Math.asin(THREE.MathUtils.clamp(offset.y / dist, -1, 1));
					const az = Math.atan2(offset.x, offset.z);
					onCameraChange(
						clampCamera({
							az,
							el,
							dist,
							tx: t.x,
							ty: t.y,
							tz: t.z,
						}),
					);
				}}
			/>
		</>
	);
}

export default function World() {
	const [selected, setSelected] = useState<PlaceId>(null);
	const [inside, setInside] = useState(false);
	const [condoRoom, setCondoRoom] = useState<Exclude<CondoRoomId, 'hall'>>('kitchen');
	const [cameraState, setCameraState] = useState<CameraState>(DEFAULT_CAMERA);
	const [flightGoal, setFlightGoal] = useState<CameraGoal | null>(null);
	const [canvasKey, setCanvasKey] = useState(0);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const fromUrl = parseCameraFromUrl();
		setCameraState(fromUrl);
		const at = new URLSearchParams(window.location.search).get('at');
		if (at === 'condo') {
			setInside(true);
			setCondoRoom('kitchen');
			setFlightGoal(null);
			const cat = new URLSearchParams(window.location.search).get('cat');
			setSelected(isCatId(cat) ? cat : 'home');
		} else if (at === 'home') {
			setSelected('home');
			setFlightGoal(HOME_GOAL);
		} else if (at === 'tony' || at === 'alex') {
			setSelected(at);
		}
		setReady(true);
	}, []);

	const handleCameraChange = useCallback(
		(state: CameraState) => {
			const next = clampCamera(state);
			setCameraState(next);
			if (inside) {
				const url = new URL(window.location.href);
				url.searchParams.set('at', 'condo');
				window.history.replaceState({}, '', url);
			} else {
				writeCameraToUrl(next, selected);
			}
		},
		[selected, inside],
	);

	const handleFlightArrived = useCallback(
		(state: CameraState) => {
			const next = clampCamera(state);
			setCameraState(next);
			if (!inside) writeCameraToUrl(next, selected);
			setFlightGoal(null);
		},
		[selected, inside],
	);

	const handleSelectPlace = useCallback((id: PlaceId) => {
		setSelected(id);
		if (id === 'home') {
			setFlightGoal({ ...HOME_GOAL });
		} else if (id === null) {
			setFlightGoal({ ...OVERVIEW_GOAL });
		}
		const url = new URL(window.location.href);
		if (id) url.searchParams.set('at', id);
		else url.searchParams.delete('at');
		window.history.replaceState({}, '', url);
	}, []);

	const handleSelectPerson = useCallback((focus: PersonFocus) => {
		setSelected(focus.id);
		setFlightGoal(personGoal(focus));
		const url = new URL(window.location.href);
		url.searchParams.set('at', focus.id);
		window.history.replaceState({}, '', url);
	}, []);

	const handleSelectCat = useCallback((focus: CatFocus) => {
		setSelected(focus.id);
		const url = new URL(window.location.href);
		url.searchParams.set('at', 'condo');
		url.searchParams.set('cat', focus.id);
		window.history.replaceState({}, '', url);
	}, []);

	const handleGroundFly = useCallback(
		(point: [number, number, number]) => {
			setSelected(null);
			const url = new URL(window.location.href);
			url.searchParams.delete('at');
			window.history.replaceState({}, '', url);

			setCameraState((prev) => {
				const s = clampCamera(prev);
				const nextDist = THREE.MathUtils.clamp(s.dist * 0.78, 12, 40);
				setFlightGoal({
					target: [point[0], 2.5, point[2]],
					distance: nextDist,
					az: s.az,
					el: THREE.MathUtils.clamp(s.el, 0.12, 0.45),
				});
				return s;
			});
		},
		[],
	);

	const handleEnterCondo = useCallback(() => {
		setInside(true);
		setSelected('home');
		setCondoRoom('kitchen');
		setFlightGoal(null);
		const url = new URL(window.location.href);
		url.searchParams.set('at', 'condo');
		window.history.replaceState({}, '', url);
		setCanvasKey((k) => k + 1);
	}, []);

	const handleExitCondo = useCallback(() => {
		setInside(false);
		setSelected('home');
		setCameraState(DEFAULT_CAMERA);
		setFlightGoal({ ...HOME_GOAL });
		writeCameraToUrl(DEFAULT_CAMERA, 'home');
		const url = new URL(window.location.href);
		url.searchParams.delete('cat');
		window.history.replaceState({}, '', url);
		setCanvasKey((k) => k + 1);
	}, []);

	const handleResetView = useCallback(() => {
		setInside(false);
		setSelected(null);
		setCameraState(DEFAULT_CAMERA);
		setFlightGoal(null);
		writeCameraToUrl(DEFAULT_CAMERA, null);
		setCanvasKey((k) => k + 1);
	}, []);

	const handleGoToRoom = useCallback((room: Exclude<CondoRoomId, 'hall'>) => {
		setCondoRoom(room);
		// Remount canvas so each room gets a fresh upright camera
		setCanvasKey((k) => k + 1);
	}, []);

	const place = selected ? places[selected] : null;
	const camPos = sphericalToPosition(cameraState);
	const canvasInstanceKey = inside
		? `condo-k18-${condoRoom}-${canvasKey}`
		: `street-alex-hair-${canvasKey}`;

	return (
		<div className={styles.root}>
			{ready && (
				<Canvas
					key={canvasInstanceKey}
					className={styles.canvas}
					shadows
					dpr={[1, 1.75]}
					camera={
						inside
							? undefined
							: {
									position: camPos,
									fov: 42,
									near: 0.1,
									far: 200,
								}
					}
				>
					<Suspense fallback={null}>
						<Scene
							selected={selected}
							inside={inside}
							condoRoom={condoRoom}
							flightGoal={flightGoal}
							onSelectPlace={handleSelectPlace}
							onSelectPerson={handleSelectPerson}
							onSelectCat={handleSelectCat}
							onEnterCondo={handleEnterCondo}
							onGroundFly={handleGroundFly}
							onFlightArrived={handleFlightArrived}
							onCameraChange={handleCameraChange}
						/>
					</Suspense>
				</Canvas>
			)}

			<header className={styles.chrome}>
				<p className={styles.mark}>{inside ? 'Unit 2F · k18' : 'Our world'}</p>
				<p className={styles.hint}>
					{inside
						? 'Drag to orbit · Scroll to zoom · Click Olive or Neil'
						: 'Click the door by the mural to come inside · Drag to look'}
				</p>
			</header>

			{inside ? (
				<button type="button" className={styles.reset} onClick={handleExitCondo}>
					Exit to street
				</button>
			) : (
				<button type="button" className={styles.reset} onClick={handleResetView}>
					Reset view
				</button>
			)}

			{place && !inside && selected !== 'home' && (
				<aside className={styles.panel} aria-live="polite">
					<button
						type="button"
						className={styles.close}
						onClick={() => handleSelectPlace(null)}
						aria-label="Close"
					>
						×
					</button>
					{(selected === 'tony' || selected === 'alex') && (
						<AvatarPreview person={selected} />
					)}
					<p className={styles.eyebrow}>{place.kind}</p>
					<h1>{place.title}</h1>
					<p className={styles.subtitle}>{place.subtitle}</p>
					{place.body ? <p className={styles.body}>{place.body}</p> : null}
					<ul className={styles.facts}>
						{place.facts.map((fact) => (
							<li key={fact}>{fact}</li>
						))}
					</ul>
				</aside>
			)}

			{inside && isCatId(selected) && place && (
				<aside className={styles.panel} aria-live="polite">
					<button
						type="button"
						className={styles.close}
						onClick={() => setSelected('home')}
						aria-label="Close"
					>
						×
					</button>
					<p className={styles.eyebrow}>{place.kind}</p>
					<h1>{place.title}</h1>
					<p className={styles.subtitle}>{place.subtitle}</p>
					{place.body ? <p className={styles.body}>{place.body}</p> : null}
					<ul className={styles.facts}>
						{place.facts.map((fact) => (
							<li key={fact}>{fact}</li>
						))}
					</ul>
				</aside>
			)}

			{inside && NAV_ROOMS.length > 1 && (
				<nav className={styles.roomNav} aria-label="Rooms">
					{NAV_ROOMS.map((id) => (
						<button
							key={id}
							type="button"
							className={
								condoRoom === id ? `${styles.roomBtn} ${styles.roomBtnActive}` : styles.roomBtn
							}
							onClick={() => handleGoToRoom(id)}
						>
							{ROOM_COPY[id].title}
						</button>
					))}
				</nav>
			)}

			{!place && !inside && (
				<div className={styles.prompt}>
					<span>Click the Unit 2F door by the mural</span>
				</div>
			)}
		</div>
	);
}
