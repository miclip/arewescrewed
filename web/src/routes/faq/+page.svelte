<script lang="ts">
	import FAQ from '$lib/components/FAQ.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { base } from '$app/paths';
</script>

<nav class="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-bg-input">
	<div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
		<a
			href="{base}/"
			class="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors"
		>
			<svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2">
				<polyline points="15 18 9 12 15 6" />
			</svg>
			Home
		</a>
	</div>
</nav>

<main class="max-w-3xl mx-auto px-4 py-8">
	<FAQ />
</main>

<Footer />
