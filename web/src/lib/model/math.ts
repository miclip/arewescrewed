/** Smoothstep S-curve: slow start, fast middle, slow end */
export function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}
