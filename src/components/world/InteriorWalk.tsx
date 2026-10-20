import type { CameraGoal } from './CameraFlight';
import { PLAN_CENTERS } from './condoLayout';

export type CondoRoomId = 'kitchen' | 'hall';

export type CondoRoomInfo = {
	id: CondoRoomId;
	title: string;
	subtitle: string;
	body: string;
	facts: string[];
};

export const NAV_ROOMS: Exclude<CondoRoomId, 'hall'>[] = ['kitchen'];

const [kx, kz] = PLAN_CENTERS.kitchen;

export const ROOM_GOALS: Record<Exclude<CondoRoomId, 'hall'>, CameraGoal> = {
	kitchen: {
		target: [kx, 1.0, kz],
		distance: 6.8,
		/** South → north (walk-in). Screen left=west, top=back wall. */
		az: Math.PI,
		el: 0.75,
	},
};

export const ROOM_COPY: Record<CondoRoomId, CondoRoomInfo> = {
	kitchen: {
		id: 'kitchen',
		title: 'Kitchen',
		subtitle: 'layout k12 · flipped 180°',
		body: 'Kitchen rotated 180° from k11 mockup layout.',
		facts: ['Flipped 180°', 'Street door + fridge', 'SE counter height'],
	},
	hall: {
		id: 'hall',
		title: 'Unit 2F',
		subtitle: 'Kitchen',
		body: 'Kitchen only for now.',
		facts: [],
	},
};
