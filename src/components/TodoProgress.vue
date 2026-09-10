<script setup>
defineProps({
	remainingCount: { type: Number, required: true },
	totalCount: { type: Number, required: true },
	progress: { type: Number, required: true },
})
</script>

<template>
	<div class="mb-4">
		<div class="d-flex justify-content-between align-items-center mb-2">
			<span class="small text-muted">
				<strong class="text-body-emphasis">{{ remainingCount }}</strong> of {{ totalCount }} remaining
			</span>
			<span class="small fw-semibold text-accent">{{ progress }}%</span>
		</div>
		<div class="progress" style="height: 8px">
			<div
				class="progress-bar bg-accent"
				role="progressbar"
				:style="{ width: progress + '%' }"
				:aria-valuenow="progress"
				aria-valuemin="0"
				aria-valuemax="100"
			></div>
		</div>
	</div>
</template>

<style scoped>
.text-accent {
	color: var(--accent) !important;
}
.bg-accent {
	background: var(--accent) !important;
}
</style>
