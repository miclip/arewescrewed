/** Format a number as currency (e.g., $1,234,567) */
export function formatCurrency(n: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(n);
}

/** Format large numbers compactly (e.g., $1.9T, $1.9M, $50k) */
export function formatCompact(n: number): string {
	if (Math.abs(n) >= 1_000_000_000_000) return '$' + (n / 1_000_000_000_000).toFixed(1) + 'T';
	if (Math.abs(n) >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
	if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
	if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'k';
	return '$' + Math.round(n).toString();
}

/** Format as percentage (e.g., 42.5%) */
export function formatPct(n: number, decimals = 1): string {
	return n.toFixed(decimals) + '%';
}

/** Format large numbers with commas */
export function formatNumber(n: number): string {
	return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

/** Format year */
export function formatYear(y: number): string {
	return y.toString();
}

/** Format compact number without $ sign */
export function formatCompactNum(n: number): string {
	if (Math.abs(n) >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + 'T';
	if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
	if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
	if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'k';
	return Math.round(n).toString();
}
