<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	const SITE = 'https://arewescrewed.ai';
	// Per-page canonical/og:url so each route (e.g. /faq) is indexed on its own,
	// not collapsed into the homepage. pathname is '/' at root, '/faq' on the FAQ page.
	let pageUrl = $derived(SITE + page.url.pathname);
</script>

<svelte:head>
	<title>Are We Screwed? — AI Displacement Financial Calculator</title>
	<meta name="description" content="AI is replacing jobs. Can you survive as an investor? Calculate your personal outlook under different AI automation scenarios." />

	<!-- Canonical -->
	<link rel="canonical" href={pageUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Are We Screwed?" />
	<meta property="og:title" content="Are We Screwed? — AI Displacement Financial Calculator" />
	<meta property="og:description" content="AI is replacing jobs. Can you survive as an investor? Calculate your personal outlook under different AI automation scenarios." />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content="https://arewescrewed.ai/og-image.jpg?v=2" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/jpeg" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Are We Screwed? — AI Displacement Financial Calculator" />
	<meta name="twitter:description" content="AI is replacing jobs. Can you survive as an investor? Calculate your personal outlook under different AI automation scenarios." />
	<meta name="twitter:image" content="https://arewescrewed.ai/og-image.jpg?v=2" />
	<meta name="twitter:image:alt" content="Are We Screwed? AI is replacing jobs. Can you survive as an investor?" />

	<!-- Structured Data — site-level only.
	     Page-specific structured data (e.g. FAQPage) belongs on its own route, or
	     every page advertises a rich result for content it does not contain. -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "Are We Screwed?",
		"url": "https://arewescrewed.ai",
		"description": "AI is replacing jobs. Can you survive as an investor? An interactive financial model exploring AI workforce displacement and the investor model alternative."
	})}</script>`}
</svelte:head>

{@render children()}
