<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Are We Screwed? — AI Displacement Financial Calculator</title>
	<meta name="description" content="AI is replacing jobs. Can you survive as an investor? Calculate your personal outlook under different AI automation scenarios." />
</svelte:head>

{@render children()}
