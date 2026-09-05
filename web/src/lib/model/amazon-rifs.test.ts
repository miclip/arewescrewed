import { SECTORS } from './sectors';
import { describe, it, expect } from 'vitest';
import {
	AMAZON_RIFS,
	AMAZON_RIF_TOTAL,
	AMAZON_HEADCOUNT_SNAPSHOTS,
	rifJobsBySector
} from './amazon-rifs';
import { PORTFOLIO_COMPANIES } from './companies';

describe('amazon-rifs', () => {
	it('RIF rounds are in chronological order', () => {
		for (let i = 1; i < AMAZON_RIFS.length; i++) {
			expect(AMAZON_RIFS[i].date >= AMAZON_RIFS[i - 1].date).toBe(true);
		}
	});

	it('all RIF rounds have positive job counts', () => {
		for (const rif of AMAZON_RIFS) {
			expect(rif.jobsCut).toBeGreaterThan(0);
		}
	});

	it('AMAZON_RIF_TOTAL equals sum of all rounds', () => {
		const sum = AMAZON_RIFS.reduce((acc, r) => acc + r.jobsCut, 0);
		expect(AMAZON_RIF_TOTAL).toBe(sum);
	});

	it('headcount snapshots are in chronological order', () => {
		for (let i = 1; i < AMAZON_HEADCOUNT_SNAPSHOTS.length; i++) {
			expect(AMAZON_HEADCOUNT_SNAPSHOTS[i].year).toBeGreaterThan(
				AMAZON_HEADCOUNT_SNAPSHOTS[i - 1].year
			);
		}
	});

	it('latest headcount snapshot matches companies.ts', () => {
		const amazon = PORTFOLIO_COMPANIES.find((c) => c.ticker === 'AMZN')!;
		const latest = AMAZON_HEADCOUNT_SNAPSHOTS[AMAZON_HEADCOUNT_SNAPSHOTS.length - 1];
		expect(latest.headcount).toBe(amazon.headcount);
	});

	it('each RIF round has required fields', () => {
		for (const rif of AMAZON_RIFS) {
			expect(rif.label).toBeTruthy();
			expect(rif.date).toMatch(/^\d{4}-\d{2}$/);
			expect(rif.divisions).toBeTruthy();
			expect(typeof rif.aiDriven).toBe('boolean');
		}
	});

	it('every round maps onto sectors that exist in the model', () => {
		const names = new Set(SECTORS.map((s) => s.name));
		for (const round of AMAZON_RIFS) {
			expect(round.sectors.length).toBeGreaterThan(0);
			for (const sector of round.sectors) {
				expect(names.has(sector)).toBe(true);
			}
		}
	});

	it('no Amazon round has yet hit the physical-layer sectors', () => {
		const touched = new Set(AMAZON_RIFS.flatMap((r) => r.sectors));
		expect(touched.has('Warehouse/Logistics')).toBe(false);
		expect(touched.has('Transportation')).toBe(false);
	});

	it('rifJobsBySector conserves the total job count', () => {
		const total = [...rifJobsBySector().values()].reduce((a, b) => a + b, 0);
		expect(total).toBeCloseTo(AMAZON_RIF_TOTAL, 6);
	});
});
