import { writable } from 'svelte/store';
import type { PersonalInputs } from '$lib/model/types';

export const personalInputs = writable<PersonalInputs>({
	incomeTarget: 75_000,
	currentSavings: 50_000,
	monthlySavings: 1_000,
	selectedSector: 'Technology/Software'
});
