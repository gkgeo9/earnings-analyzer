<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
	<title>Earnings Call Insight Engine</title>
</svelte:head>

<div class="page-background">
	{@render children()}
</div>

<style>
	.page-background {
		background: linear-gradient(135deg, #f5f7ff 0%, #e0e7ff 100%);
		background-attachment: fixed;
		min-height: 100vh;
	}
</style>