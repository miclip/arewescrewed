import { writable } from 'svelte/store';
import { DEFAULT_PROVIDER_PARAMS, type ProviderParams } from '$lib/model/provider-engine';

export const providerParams = writable<ProviderParams>({ ...DEFAULT_PROVIDER_PARAMS });
