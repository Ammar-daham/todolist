<script setup>
import { formatRelativeTime } from '../utils/time'

defineProps({
	todo: { type: Object, required: true },
})
defineEmits(['restore', 'delete'])
</script>

<template>
	<li class="removed-item d-flex align-items-center gap-3">
		<div class="flex-grow-1 removed-content">
			<span class="removed-text">{{ todo.text }}</span>
			<div class="removed-meta small text-muted">Removed {{ formatRelativeTime(todo.removedAt) }}</div>
		</div>
		<button type="button" class="btn btn-sm btn-restore flex-shrink-0" @click="$emit('restore', todo.id)">
			<i class="bi bi-arrow-counterclockwise me-1"></i>Restore
		</button>
		<button
			type="button"
			class="btn btn-sm btn-icon text-muted flex-shrink-0"
			@click="$emit('delete', todo.id)"
			aria-label="Delete permanently"
		>
			<i class="bi bi-trash3"></i>
		</button>
	</li>
</template>

<style scoped>
.removed-item {
	padding: 12px 14px;
	border-radius: 12px;
	background: var(--surface-alt);
	transition: background 0.2s ease;
}
.removed-item:hover {
	background: var(--surface-alt-hover);
}

.removed-content {
	min-width: 0;
}

.removed-text {
	text-decoration: line-through;
	color: var(--text-done);
	word-break: break-word;
}

.removed-meta {
	margin-top: 2px;
	font-size: 0.72rem;
}

.btn-restore {
	font-weight: 500;
	font-size: 0.8rem;
	color: var(--accent);
	background: transparent;
	border: 1px solid var(--accent);
	border-radius: 999px;
	padding: 3px 12px;
}
.btn-restore:hover {
	background: var(--accent);
	color: var(--accent-contrast);
}

.btn-icon {
	border: none;
	background: transparent;
	opacity: 0.6;
	transition: opacity 0.15s ease, color 0.15s ease;
}
.btn-icon:hover {
	opacity: 1;
	color: var(--danger) !important;
}
</style>
