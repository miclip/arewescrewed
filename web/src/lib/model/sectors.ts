import type { SectorProfile } from './types';

export const SECTORS: SectorProfile[] = [
	{
		name: 'Warehouse/Logistics',
		displacementPct: 0.75,
		rampYears: 10,
		description: 'Robotics, Amazon-style automation'
	},
	{
		name: 'Manufacturing',
		displacementPct: 0.65,
		rampYears: 12,
		description: 'Industrial robots, already underway'
	},
	{
		name: 'Transportation',
		displacementPct: 0.7,
		rampYears: 12,
		description: 'Autonomous vehicles'
	},
	{
		name: 'Retail/Service',
		displacementPct: 0.55,
		rampYears: 14,
		description: 'Self-checkout, AI assistants'
	},
	{
		name: 'Finance/Accounting',
		displacementPct: 0.5,
		rampYears: 14,
		description: 'AI analysis, automated processing'
	},
	{
		name: 'Creative/Media',
		displacementPct: 0.45,
		rampYears: 15,
		description: 'AI generation tools'
	},
	{
		name: 'Legal',
		displacementPct: 0.4,
		rampYears: 16,
		description: 'Doc review automated, judgment stays'
	},
	{
		name: 'Technology/Software',
		displacementPct: 0.45,
		rampYears: 16,
		description: 'AI coding, but also creates new roles'
	},
	{
		name: 'Healthcare',
		displacementPct: 0.3,
		rampYears: 18,
		description: 'Regulatory barriers, human trust'
	},
	{
		name: 'Education',
		displacementPct: 0.25,
		rampYears: 20,
		description: 'Human element valued'
	},
	{
		name: 'Government/Admin',
		displacementPct: 0.25,
		rampYears: 20,
		description: 'Bureaucratic resistance'
	}
];

export function getSector(name: string): SectorProfile {
	return SECTORS.find((s) => s.name === name) ?? SECTORS[7]; // Default: Technology/Software
}

const MODERATE_RAMP_YEARS = 15; // baseline for scaling sector ramp
const MODERATE_LABOR_REDUCTION = 0.5; // baseline for scaling sector displacement

/**
 * Compute the year when your job is more likely than not to be gone.
 *
 * Three key mechanics:
 * 1. Sector displacement scales with scenario aggressiveness.
 *    The sector's displacementPct is its baseline under moderate (50%).
 *    Under extreme (95%), it scales up: tech goes from 45% → 85.5%.
 * 2. Each sector has its own ramp speed, also scaled by scenario.
 * 3. Threshold: when cumulative displacement passes 50% (coin flip for your job).
 *    If the sector can't reach 50% even at full ramp, use half of its max instead.
 */
export function computeDisplacementYear(
	sector: SectorProfile,
	baseYear: number,
	scenarioRampYears: number,
	scenarioLaborReductionPct: number = MODERATE_LABOR_REDUCTION
): number {
	// Scale sector displacement by scenario aggressiveness
	const effectiveDisplacement = Math.min(
		sector.displacementPct * (scenarioLaborReductionPct / MODERATE_LABOR_REDUCTION),
		0.95
	);

	// Scale sector ramp by scenario speed
	const rampScale = scenarioRampYears / MODERATE_RAMP_YEARS;
	const effectiveRamp = sector.rampYears * rampScale;

	// Threshold: absolute 50% if reachable, otherwise half of sector max
	let target: number;
	if (effectiveDisplacement >= 0.5) {
		// Coin flip: when does your sector pass 50% displaced?
		target = 0.5 / effectiveDisplacement;
	} else {
		// Sector won't hit 50% — use half of its max as the "serious risk" point
		target = 0.5;
	}

	// Inverse smoothstep: find t where t^2(3-2t) = target
	let lo = 0,
		hi = 1;
	for (let i = 0; i < 50; i++) {
		const mid = (lo + hi) / 2;
		const val = mid * mid * (3 - 2 * mid);
		if (val < target) lo = mid;
		else hi = mid;
	}

	const t = (lo + hi) / 2;
	return Math.round(baseYear + effectiveRamp * t);
}
