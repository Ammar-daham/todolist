<script setup>
defineProps({
	isDark: { type: Boolean, required: true },
})
defineEmits(['toggle'])
</script>

<template>
	<button
		type="button"
		class="btn btn-sm btn-icon theme-toggle"
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
	transition: opacity 0.15s ease, color 0.15s ease;
}

.theme-toggle {
	position: absolute;
	top: 16px;
	right: 16px;
	font-size: 1.2rem;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	color: var(--accent);
}
.theme-toggle:hover {
	color: var(--accent-strong) !important;
}
</style>
