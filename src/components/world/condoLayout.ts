/** Feet → meters */
export const FT = 0.3048;

export type RoomBox = {
	x: number;
	z: number;
	w: number;
	d: number;
};

function ft(n: number) {
	return n * FT;
}

function room(xFt: number, zFt: number, wFt: number, dFt: number): RoomBox {
	return { x: ft(xFt), z: ft(zFt), w: ft(wFt), d: ft(dFt) };
}

export function roomCenter(r: RoomBox): [number, number] {
	return [r.x + r.w / 2, r.z + r.d / 2];
}

/**
 * Unit 2F — origin = kitchen SW. +X east, +Z north.
 *
 * Walk-in (south door, facing north):
 *   Fridge on the WEST wall (left).
 *   Doorway left of fridge (northwest) → into Dining.
 *   Through that door facing west/north-west, Dining opens on your left (north bay).
 *
 * Plan flow from the kitchen door:
 *   Kitchen → Dining (through west doorway) → Living → Primary
 *   Bedroom north of kitchen, door into dining
 */
export const PLAN = {
	/** 12'7" × 12'5" */
	kitchen: room(0, 0, 12 + 7 / 12, 12 + 5 / 12),

	/**
	 * Dining 10'6" × 17'8" — WEST of kitchen (left when you walk in facing north).
	 * Bay on the north. Kitchen doorway enters the east side of dining.
	 */
	dining: room(-(10 + 6 / 12), (12 + 5 / 12 + 8 + 11 / 12) - (17 + 8 / 12), 10 + 6 / 12, 17 + 8 / 12),

	/** 10'1" × 8'11" — north of kitchen; door west into dining */
	bedroom: room(0, 12 + 5 / 12, 10 + 1 / 12, 8 + 11 / 12),

	/** Powder bath — east of kitchen (opposite the dining side) */
	bathPowder: room(12 + 7 / 12, 0, 8 + 4 / 12, 6 + 7 / 12),

	/**
	 * Living 15'5" × 14'7" — west of dining, open.
	 */
	living: room(
		-(10 + 6 / 12) - (15 + 5 / 12),
		(12 + 5 / 12 + 8 + 11 / 12) - (14 + 7 / 12),
		15 + 5 / 12,
		14 + 7 / 12,
	),

	/** Primary — further west, off living */
	primary: room(
		-(10 + 6 / 12) - (15 + 5 / 12) - (16 + 3 / 12),
		(12 + 5 / 12 + 8 + 11 / 12) - (19 + 6 / 12),
		16 + 3 / 12,
		19 + 6 / 12,
	),

	wic: room(
		-(10 + 6 / 12) - (15 + 5 / 12) - (16 + 3 / 12) + 2,
		(12 + 5 / 12 + 8 + 11 / 12) - (19 + 6 / 12) - (6 + 1 / 12),
		10 + 9 / 12,
		6 + 1 / 12,
	),

	/** Laundry + hall bath — south of dining/living */
	laundry: room(-(10 + 6 / 12) + 1, -(4 + 3 / 12), 6, 4 + 3 / 12),
	bathHall: room(-(10 + 6 / 12) + 1 + 6, -(6 + 9 / 12), 8 + 5 / 12, 6 + 9 / 12),
} as const;

export const PLAN_CENTERS = {
	kitchen: roomCenter(PLAN.kitchen),
	dining: roomCenter(PLAN.dining),
	living: roomCenter(PLAN.living),
	guest: roomCenter(PLAN.bedroom),
	primary: roomCenter(PLAN.primary),
	bath: roomCenter(PLAN.bathHall),
	bathPowder: roomCenter(PLAN.bathPowder),
	laundry: roomCenter(PLAN.laundry),
	wic: roomCenter(PLAN.wic),
} as const;

export const PLAN_BOUNDS = {
	minX: PLAN.primary.x - ft(1),
	maxX: PLAN.bathPowder.x + PLAN.bathPowder.w + ft(1),
	minZ: Math.min(PLAN.bathHall.z, PLAN.laundry.z) - ft(1),
	maxZ: PLAN.bedroom.z + PLAN.bedroom.d + ft(2),
};
