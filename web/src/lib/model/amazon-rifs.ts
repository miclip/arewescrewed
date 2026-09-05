/**
 * Amazon Reduction-in-Force (RIF) data since November 2022.
 *
 * Sources: SEC filings, press reports, internal memos.
 * Caveat: early rounds were largely post-COVID correction / cost-cutting.
 * The 2025-2026 rounds (~30K) coincide with Amazon's 2026 AI capex guidance of
 * ~$220B (raised from $200B on the Q2 2026 call) and are increasingly
 * AI-displacement-driven.
 *
 * Note on attribution: across the market, roughly half of 2026 layoff events cite
 * AI, but surveyed companies admit to framing cuts as AI-driven when the real
 * driver is financial. Treat `aiDriven` as "company attributed it to AI", not as
 * established causation.
 */

export interface RifRound {
	/** Short label for display (e.g. "Nov '22") */
	label: string;
	/** ISO-ish date for sorting */
	date: string;
	/** Approximate jobs cut in this round */
	jobsCut: number;
	/** Key divisions affected */
	divisions: string;
	/**
	 * Sectors from SECTORS that these divisions map onto. Amazon employs across 9
	 * of the 11 modelled sectors, so its internal cut pattern is a natural
	 * experiment in which sectors displace first — one company, one AI budget,
	 * one management, so industry-specific confounds are held constant.
	 */
	sectors: string[];
	/** Whether this round is primarily AI-driven */
	aiDriven: boolean;
}

export const AMAZON_RIFS: RifRound[] = [
	{
		label: "Nov '22",
		date: '2022-11',
		jobsCut: 10000,
		divisions: 'Devices, Alexa, Retail',
		sectors: ['Manufacturing', 'Technology/Software', 'Retail/Service'],
		aiDriven: false
	},
	{
		label: "Jan '23",
		date: '2023-01',
		jobsCut: 8000,
		divisions: 'Corporate (second wave)',
		sectors: ['Finance/Accounting', 'Government/Admin'],
		aiDriven: false
	},
	{
		label: "Mar '23",
		date: '2023-03',
		jobsCut: 9000,
		divisions: 'AWS, Ads, Twitch, HR',
		sectors: ['Technology/Software', 'Creative/Media', 'Government/Admin'],
		aiDriven: false
	},
	{
		label: "Jan '24",
		date: '2024-01',
		jobsCut: 1500,
		divisions: 'Prime Video, MGM, Twitch, Audible',
		sectors: ['Creative/Media'],
		aiDriven: false
	},
	{
		label: "Apr '24",
		date: '2024-04',
		jobsCut: 400,
		divisions: 'AWS (cloud computing)',
		sectors: ['Technology/Software'],
		aiDriven: false
	},
	{
		label: "Jun '24",
		date: '2024-06',
		jobsCut: 200,
		divisions: 'Buy With Prime, Alexa',
		sectors: ['Technology/Software'],
		aiDriven: false
	},
	{
		label: "Sep '24",
		date: '2024-09',
		jobsCut: 200,
		divisions: 'Communications, Sustainability',
		sectors: ['Government/Admin'],
		aiDriven: false
	},
	{
		label: "Oct '25",
		date: '2025-10',
		jobsCut: 14000,
		divisions: 'Corporate layers (anti-bureaucracy)',
		sectors: ['Finance/Accounting', 'Government/Admin', 'Technology/Software'],
		aiDriven: true
	},
	{
		label: "Jan '26",
		date: '2026-01',
		jobsCut: 16000,
		divisions: 'Corporate (AI restructuring)',
		sectors: ['Technology/Software', 'Creative/Media', 'Healthcare', 'Government/Admin'],
		aiDriven: true
	}
];

/** Running cumulative total */
export const AMAZON_RIF_TOTAL = AMAZON_RIFS.reduce((sum, r) => sum + r.jobsCut, 0);

/** Headcount context snapshots (end of fiscal year, from 10-K filings) */
export const AMAZON_HEADCOUNT_SNAPSHOTS = [
	{ year: 2021, headcount: 1608000, label: '2021 peak' },
	{ year: 2022, headcount: 1541000, label: '2022 (post-COVID)' },
	{ year: 2023, headcount: 1525000, label: '2023' },
	{ year: 2024, headcount: 1556000, label: '2024' },
	{ year: 2025, headcount: 1576000, label: '2025' },
	// Q2 FY2026 (Jun 30, 2026) — headcount is UP 49K YoY despite ~30K corporate
	// cuts, because ~1.2M warehouse/logistics roles were untouched and are still
	// hiring into 20% revenue growth. Corporate displacement is running well ahead
	// of physical-layer displacement.
	{ year: 2026, headcount: 1595000, label: '2026 (Q2, TTM)' }
];

/**
 * Cuts aggregated by modelled sector. Every Amazon round has landed in
 * Technology/Software, Creative/Media, Finance/Accounting, Government/Admin or
 * Healthcare — none in Warehouse/Logistics, Transportation or Retail/Service.
 */
export function rifJobsBySector(rifs: RifRound[] = AMAZON_RIFS): Map<string, number> {
	const bySector = new Map<string, number>();
	for (const round of rifs) {
		if (round.sectors.length === 0) continue;
		// Split each round evenly across the sectors it touched — the filings don't
		// break cuts down per division, so an even split is the honest default.
		const share = round.jobsCut / round.sectors.length;
		for (const sector of round.sectors) {
			bySector.set(sector, (bySector.get(sector) ?? 0) + share);
		}
	}
	return bySector;
}
