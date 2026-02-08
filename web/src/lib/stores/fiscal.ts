import { writable } from 'svelte/store';
import { DEFAULT_FISCAL_PARAMS, type FiscalParams } from '$lib/model/fiscal-engine';

export const fiscalParams = writable<FiscalParams>({ ...DEFAULT_FISCAL_PARAMS });
