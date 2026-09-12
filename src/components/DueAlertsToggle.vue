<script setup>
const props = defineProps({
	enabled: { type: Boolean, required: true },
	permission: { type: String, required: true },
})
defineEmits(['toggle'])

const label = () => {
	if (props.enabled && props.permission === 'denied') {
		return 'Due-date alerts on (browser notifications blocked — in-app alerts still show)'
	}
	return props.enabled ? 'Turn off due-date alerts' : 'Turn on due-date alerts'
}
</script>

<template>
	<button
		type="button"
		class="btn btn-sm btn-icon due-alerts-toggle"
		:class="{ 'due-alerts-active': enabled }"
		@click="$emit('toggle')"
		:aria-label="label()"
		:title="label()"
	>
		<i :class="enabled ? 'bi bi-bell-fill' : 'bi bi-bell'"></i>
	</button>
</template>

<style scoped>
.btn-icon {
	border: none;
	background: transparent;
	transition: opacity 0.15s ease, color 0.15s ease;
}

.due-alerts-toggle {
	position: absolute;
	top: 16px;
	right: 108px;
	font-size: 1.2rem;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	color: var(--text-done);
}
.due-alerts-toggle:hover {
	color: var(--accent);
}
.due-alerts-active {
	color: var(--accent);
}
</style>
