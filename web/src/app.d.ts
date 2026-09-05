// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	/**
	 * Injected by the `define` block in vite.config.ts. Must be declared inside
	 * `declare global` — this file is a module (it has `export {}`), so a
	 * top-level `declare const` would only be visible within app.d.ts itself.
	 */
	const __EM_DASH_COUNT__: number;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
