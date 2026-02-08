import { writable } from 'svelte/store';
import type { BabyInputs } from '$lib/model/baby-engine';

export const babyInputs = writable<BabyInputs>({
	giftAmount: 50_000,
	unlockAge: 21
});
