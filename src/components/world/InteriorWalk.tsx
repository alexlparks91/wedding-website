import type { CameraGoal } from './CameraFlight';
import { PLAN_CENTERS } from './condoLayout';
import { getBathGoal } from './HallBath';
import { getLivingGoal } from './LivingDining';
import { getPrimaryGoal } from './PrimaryBedroom';

export type CondoRoomId = 'kitchen' | 'living' | 'primary' | 'bath' | 'hall';

export type CondoRoomInfo = {
	id: CondoRoomId;
	title: string;
	subtitle: string;
	body: string;
	facts: string[];
};

export const NAV_ROOMS: Exclude<CondoRoomId, 'hall'>[] = ['kitchen', 'living', 'bath', 'primary'];

const [kx, kz] = PLAN_CENTERS.kitchen;

export const ROOM_GOALS: Record<Exclude<CondoRoomId, 'hall'>, CameraGoal> = {
	kitchen: {
		target: [kx, 1.0, kz],
		distance: 6.8,
		az: Math.PI,
		el: 0.75,
	},
	living: getLivingGoal(),
	bath: getBathGoal(),
	primary: getPrimaryGoal(),
};

export const ROOM_COPY: Record<CondoRoomId, CondoRoomInfo> = {
	kitchen: {
		id: 'kitchen',
		title: 'Kitchen',
		subtitle: 'Unit 2F',
		body: '',
		facts: [],
	},
	living: {
		id: 'living',
		title: 'Living',
		subtitle: 'Through the kitchen doorway',
		body: '',
		facts: [],
	},
	bath: {
		id: 'bath',
		title: 'Bath',
		subtitle: 'First door on the right',
		body: '',
		facts: [],
	},
	primary: {
		id: 'primary',
		title: 'Primary',
		subtitle: 'Through the living doors',
		body: '',
		facts: [],
	},
	hall: {
		id: 'hall',
		title: 'Unit 2F',
		subtitle: 'Home',
		body: '',
		facts: [],
	},
};
