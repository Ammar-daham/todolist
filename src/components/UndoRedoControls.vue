<script setup>
defineProps({
	canUndo: { type: Boolean, required: true },
	canRedo: { type: Boolean, required: true },
})
defineEmits(['undo', 'redo'])
</script>

<template>
	<button
		type="button"
		class="btn btn-sm btn-icon toolbar-icon-btn"
		:disabled="!canUndo"
		@click="$emit('undo')"
		aria-label="Undo"
		title="Undo (Ctrl+Z)"
	>
		<i class="bi bi-arrow-counterclockwise"></i>
	</button>
	<button
		type="button"
		class="btn btn-sm btn-icon toolbar-icon-btn"
		:disabled="!canRedo"
		@click="$emit('redo')"
		aria-label="Redo"
		title="Redo (Ctrl+Shift+Z)"
	>
		<i class="bi bi-arrow-clockwise"></i>
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
.toolbar-icon-btn:hover:not(:disabled) {
	color: var(--accent);
	background: var(--surface-alt-hover);
}
.toolbar-icon-btn:disabled {
	opacity: 0.35;
	cursor: default;
}
</style>
