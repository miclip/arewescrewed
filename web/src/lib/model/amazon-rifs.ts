/**
 * Amazon Reduction-in-Force (RIF) data since November 2022.
 *
 * Sources: SEC filings, press reports, internal memos.
 * Caveat: early rounds were largely post-COVID correction / cost-cutting.
 * The 2025-2026 rounds (~30K) coincide with $125B AI CapEx and are
 * increasingly AI-displacement-driven.
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
	/** Whether this round is primarily AI-driven */
	aiDriven: boolean;
}

export const AMAZON_RIFS: RifRound[] = [
	{
		label: "Nov '22",
		date: '2022-11',
		jobsCut: 10000,
		divisions: 'Devices, Alexa, Retail',
		aiDriven: false
	},
	{
		label: "Jan '23",
		date: '2023-01',
		jobsCut: 8000,
		divisions: 'Corporate (second wave)',
		aiDriven: false
	},
	{
		label: "Mar '23",
		date: '2023-03',
		jobsCut: 9000,
		divisions: 'AWS, Ads, Twitch, HR',
		aiDriven: false
	},
	{
		label: "Jan '24",
		date: '2024-01',
		jobsCut: 1500,
		divisions: 'Prime Video, MGM, Twitch, Audible',
		aiDriven: false
	},
	{
		label: "Apr '24",
		date: '2024-04',
		jobsCut: 400,
		divisions: 'AWS (cloud computing)',
		aiDriven: false
	},
	{
		label: "Jun '24",
		date: '2024-06',
		jobsCut: 200,
		divisions: 'Buy With Prime, Alexa',
		aiDriven: false
	},
	{
		label: "Sep '24",
		date: '2024-09',
		jobsCut: 200,
		divisions: 'Communications, Sustainability',
		aiDriven: false
	},
	{
		label: "Oct '25",
		date: '2025-10',
		jobsCut: 14000,
		divisions: 'Corporate layers (anti-bureaucracy)',
		aiDriven: true
	},
	{
		label: "Jan '26",
		date: '2026-01',
		jobsCut: 16000,
		divisions: 'Corporate (AI restructuring)',
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
	{ year: 2025, headcount: 1576000, label: '2025' }
];
