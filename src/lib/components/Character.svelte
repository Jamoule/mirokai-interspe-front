<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<div class="pointer-events-none absolute inset-0 flex items-end justify-center pb-8 z-20">
	{#if children}
		{@render children()}
	{:else}
		<svg
			width="220"
			height="320"
			viewBox="0 0 220 320"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="#1D3AA2" />
					<stop offset="100%" stop-color="#3995FF" />
				</linearGradient>
				<filter id="glow">
					<feGaussianBlur stdDeviation="8" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<!-- Glow ring -->
			<ellipse
				cx="110"
				cy="290"
				rx="70"
				ry="18"
				fill="#3995FF"
				opacity="0.3"
				filter="url(#glow)"
			/>

			<!-- Body silhouette -->
			<ellipse cx="110" cy="230" rx="65" ry="80" fill="url(#bodyGrad)" filter="url(#glow)" />

			<!-- Head -->
			<circle cx="110" cy="100" r="55" fill="url(#bodyGrad)" filter="url(#glow)" />

			<!-- Neck -->
			<rect x="92" y="148" width="36" height="30" rx="10" fill="url(#bodyGrad)" />
		</svg>
	{/if}
</div>
