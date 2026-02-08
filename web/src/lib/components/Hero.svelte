<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';

	const siteUrl = 'https://arewescrewed.ai';
	const shareText = 'AI is replacing jobs. Can you survive as an investor? This model runs the math.';

	let copied = $state(false);

	function copyLink() {
		if (!browser) return;
		navigator.clipboard.writeText(siteUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<section class="flex flex-col items-center justify-center py-8 md:py-12 px-4 text-center">
	<div class="flex items-center gap-4 md:gap-6 mb-6">
		<img src="{base}/logo.png" alt="arewescrewed.ai logo" class="h-20 md:h-40 lg:h-48" />
		<h1 class="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-left">
			Are We<br /><span class="text-accent">Screwed</span>?
		</h1>
	</div>
	<p class="text-lg md:text-xl text-text-muted max-w-2xl mb-8">
		AI is replacing jobs. Can you survive as an investor in AI-run companies in an AI-driven economy?
	</p>

	<p class="text-sm text-text-muted animate-bounce mb-8">
		&#8595; Find out below
	</p>

	<!-- Share buttons -->
	<div class="flex flex-wrap justify-center items-center gap-3">
		<span class="text-xs text-text-muted uppercase tracking-wide">Share the Gloom</span>
		<a
			href="https://twitter.com/intent/tweet?text={encodeURIComponent(shareText)}&url={encodeURIComponent(siteUrl)}"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-full bg-bg-card border border-bg-input hover:border-accent hover:text-accent transition-colors text-text-muted"
			aria-label="Share on X"
		>
			<svg viewBox="0 0 24 24" class="w-5 h-5 md:w-4 md:h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
		</a>
		<a
			href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(siteUrl)}"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-full bg-bg-card border border-bg-input hover:border-accent hover:text-accent transition-colors text-text-muted"
			aria-label="Share on LinkedIn"
		>
			<svg viewBox="0 0 24 24" class="w-5 h-5 md:w-4 md:h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
		</a>
		<a
			href="https://reddit.com/submit?url={encodeURIComponent(siteUrl)}&title={encodeURIComponent(shareText)}"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-full bg-bg-card border border-bg-input hover:border-accent hover:text-accent transition-colors text-text-muted"
			aria-label="Share on Reddit"
		>
			<svg viewBox="0 0 24 24" class="w-5 h-5 md:w-4 md:h-4 fill-current"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.463.327.327 0 00-.462 0c-.545.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.205-.094z"/></svg>
		</a>
		<a
			href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(siteUrl)}"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-full bg-bg-card border border-bg-input hover:border-accent hover:text-accent transition-colors text-text-muted"
			aria-label="Share on Facebook"
		>
			<svg viewBox="0 0 24 24" class="w-5 h-5 md:w-4 md:h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
		</a>
		<button
			onclick={copyLink}
			class="inline-flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-full bg-bg-card border border-bg-input hover:border-accent hover:text-accent transition-colors text-text-muted"
			aria-label="Copy link"
		>
			{#if copied}
				<svg viewBox="0 0 24 24" class="w-5 h-5 md:w-4 md:h-4 fill-none stroke-current" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
			{:else}
				<svg viewBox="0 0 24 24" class="w-5 h-5 md:w-4 md:h-4 fill-none stroke-current" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
			{/if}
		</button>
		<span class="text-xs text-text-muted uppercase tracking-wide">Misery loves company.</span>
	</div>
</section>
