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
		class="btn btn-sm btn-icon toolbar-icon-btn"
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

.toolbar-icon-btn {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	font-size: 1.1rem;
	color: var(--text-done);
	display: flex;
	align-items: center;
	justify-content: center;
}
.toolbar-icon-btn:hover {
	color: var(--accent);
	background: var(--surface-alt-hover);
}
.due-alerts-active {
	color: var(--accent);
	background: var(--surface);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.due-alerts-active:hover {
	background: var(--surface);
}
</style>
