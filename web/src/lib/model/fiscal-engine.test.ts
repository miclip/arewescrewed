import { describe, it, expect } from 'vitest';
import {
	computeFiscalProjection,
	DEFAULT_FISCAL_PARAMS,
	type FiscalParams
} from './fiscal-engine';
import { runScenario } from './scenario-engine';
import { PORTFOLIO_COMPANIES } from './companies';
import { PRESETS, PRESET_ORDER } from './presets';
import type { ScenarioParams } from './types';

/** Helper: run the full fiscal pipeline for a given preset */
function runFiscalForPreset(presetName: keyof typeof PRESETS, overrides?: Partial<FiscalParams>) {
	const params = PRESETS[presetName].params;
	const companies = PORTFOLIO_COMPANIES;
	const companyProjections = companies.map((c) => runScenario(params, c));
	const fiscalParams = { ...DEFAULT_FISCAL_PARAMS, ...overrides };
	return computeFiscalProjection(companyProjections, companies, params, fiscalParams);
}

describe('fiscal-engine', () => {
	it('year 0 baselines match inputs', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		// Year 0: no displacement yet, so income/payroll should equal baseline
		expect(yr0.corporateTaxRevenue).toBeCloseTo(DEFAULT_FISCAL_PARAMS.baselineCorporateTaxRevenue, -6);
		expect(yr0.incomeTaxRevenue).toBeCloseTo(DEFAULT_FISCAL_PARAMS.baselineIncomeTaxRevenue, -6);
		expect(yr0.payrollTaxRevenue).toBeCloseTo(DEFAULT_FISCAL_PARAMS.baselinePayrollTaxRevenue, -6);
	});

	it('year 0 deficit is ~$1.8T (matches FY2025 actual)', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		// FY2025 actual deficit was $1.8T
		expect(yr0.annualDeficit / 1e12).toBeCloseTo(1.8, 0);
	});

	it('correct projection length (yearsForward + 1)', () => {
		const result = runFiscalForPreset('moderate');
		expect(result.yearlyProjections.length).toBe(PRESETS.moderate.params.yearsForward + 1);
	});

	it('corporate tax grows as profits grow', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		const yr15 = result.yearlyProjections[15];
		expect(yr15.corporateTaxRevenue).toBeGreaterThan(yr0.corporateTaxRevenue);
	});

	it('income tax shrinks with displacement', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		const yr15 = result.yearlyProjections[15];
		expect(yr15.incomeTaxRevenue).toBeLessThan(yr0.incomeTaxRevenue);
	});

	it('payroll tax shrinks with displacement', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		const yr15 = result.yearlyProjections[15];
		expect(yr15.payrollTaxRevenue).toBeLessThan(yr0.payrollTaxRevenue);
	});

	it('capital gains tax > 0 when displacement > 0', () => {
		const result = runFiscalForPreset('moderate');
		const yr10 = result.yearlyProjections[10];
		expect(yr10.capitalGainsTaxRevenue).toBeGreaterThan(0);
	});

	it('national debt monotonically increases', () => {
		const result = runFiscalForPreset('moderate');
		for (let i = 1; i < result.yearlyProjections.length; i++) {
			expect(result.yearlyProjections[i].totalNationalDebt).toBeGreaterThanOrEqual(
				result.yearlyProjections[i - 1].totalNationalDebt
			);
		}
	});

	it('debt-to-GDP increases over time', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		const last = result.yearlyProjections[result.yearlyProjections.length - 1];
		expect(last.debtToGDP).toBeGreaterThan(yr0.debtToGDP);
	});

	it('extreme scenario has bigger fiscal hole than conservative', () => {
		const conservative = runFiscalForPreset('conservative');
		const extreme = runFiscalForPreset('extreme');
		const lastCons = conservative.yearlyProjections[conservative.yearlyProjections.length - 1];
		const lastExt = extreme.yearlyProjections[extreme.yearlyProjections.length - 1];
		expect(lastExt.totalNationalDebt).toBeGreaterThan(lastCons.totalNationalDebt);
	});

	it('safety net = 0 when investorModelAdoption = 1.0', () => {
		const params: ScenarioParams = { ...PRESETS.moderate.params, investorModelAdoption: 1.0 };
		const companies = PORTFOLIO_COMPANIES;
		const companyProjections = companies.map((c) => runScenario(params, c));
		const result = computeFiscalProjection(
			companyProjections,
			companies,
			params,
			DEFAULT_FISCAL_PARAMS
		);
		// With 100% adoption, all displaced workers become investors — zero unemployed
		for (const yr of result.yearlyProjections) {
			expect(yr.safetyNetSpending).toBe(0);
			expect(yr.unemployedWorkers).toBe(0);
		}
	});

	it('equalize toggle raises more capital gains revenue', () => {
		const normal = runFiscalForPreset('moderate', { equalizeCapGainsTax: false });
		const equalized = runFiscalForPreset('moderate', { equalizeCapGainsTax: true });
		const yr15Normal = normal.yearlyProjections[15];
		const yr15Equal = equalized.yearlyProjections[15];
		expect(yr15Equal.capitalGainsTaxRevenue).toBeGreaterThan(yr15Normal.capitalGainsTaxRevenue);
	});

	it('all 4 presets produce valid results (no NaN)', () => {
		for (const name of PRESET_ORDER) {
			const result = runFiscalForPreset(name);
			expect(result.yearlyProjections.length).toBeGreaterThan(0);
			for (const yr of result.yearlyProjections) {
				expect(Number.isNaN(yr.totalFederalRevenue)).toBe(false);
				expect(Number.isNaN(yr.totalNationalDebt)).toBe(false);
				expect(Number.isNaN(yr.debtToGDP)).toBe(false);
				expect(Number.isNaN(yr.annualDeficit)).toBe(false);
			}
		}
	});

	it('interest compounds on prior debt', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		const yr10 = result.yearlyProjections[10];
		// Interest should grow as debt grows
		expect(yr10.interestOnDebt).toBeGreaterThan(yr0.interestOnDebt);
	});

	it('GDP tracks demand model', () => {
		const result = runFiscalForPreset('moderate');
		const yr0 = result.yearlyProjections[0];
		// Year 0 GDP should equal baseline
		expect(yr0.estimatedGDP).toBeCloseTo(DEFAULT_FISCAL_PARAMS.baselineGDP, -6);
		// At moderate displacement with 70% adoption, GDP should change from baseline
		const yr15 = result.yearlyProjections[15];
		expect(yr15.estimatedGDP).not.toBeCloseTo(DEFAULT_FISCAL_PARAMS.baselineGDP, -6);
	});
});
