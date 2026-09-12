<script setup>
defineProps({
	isDark: { type: Boolean, required: true },
})
defineEmits(['toggle'])
</script>

<template>
	<button
		type="button"
		class="btn btn-sm btn-icon toolbar-icon-btn"
		@click="$emit('toggle')"
		:aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
	>
		<i :class="isDark ? 'bi bi-sun' : 'bi bi-moon-stars'"></i>
	</button>
</template>

<style scoped>
.btn-icon {
	border: none;
	background: transparent;
	transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.toolbar-icon-btn {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	font-size: 1.1rem;
	color: var(--accent);
	display: flex;
	align-items: center;
	justify-content: center;
}
.toolbar-icon-btn:hover {
	color: var(--accent-strong) !important;
	background: var(--surface-alt-hover);
}
</style>
