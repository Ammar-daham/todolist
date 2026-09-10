<script setup>
import { ref } from 'vue'
import { formatRelativeTime } from '../utils/time'

const props = defineProps({
	todo: { type: Object, required: true },
})
const emit = defineEmits(['restore', 'delete'])

const confirming = ref(false)

function confirmDelete() {
	confirming.value = false
	emit('delete', props.todo.id)
}
</script>

<template>
	<li class="removed-item d-flex align-items-center gap-3">
		<template v-if="!confirming">
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
				@click="confirming = true"
				aria-label="Delete permanently"
			>
				<i class="bi bi-trash3"></i>
			</button>
		</template>
		<template v-else>
			<div class="flex-grow-1 removed-confirm small">Delete permanently? This can't be undone.</div>
			<button type="button" class="btn btn-sm btn-confirm-delete flex-shrink-0" @click="confirmDelete">Delete</button>
			<button type="button" class="btn btn-sm btn-cancel flex-shrink-0" @click="confirming = false">Cancel</button>
		</template>
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

.removed-confirm {
	color: var(--danger);
	font-weight: 500;
}

.btn-confirm-delete {
	font-weight: 600;
	font-size: 0.8rem;
	color: #fff;
	background: var(--danger);
	border: 1px solid var(--danger);
	border-radius: 999px;
	padding: 3px 14px;
}
.btn-confirm-delete:hover {
	filter: brightness(0.92);
}

.btn-cancel {
	font-weight: 500;
	font-size: 0.8rem;
	color: var(--text-done);
	background: var(--surface-alt-hover);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 3px 14px;
}
.btn-cancel:hover {
	background: var(--surface-alt);
}
</style>
