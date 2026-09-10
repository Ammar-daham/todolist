<script setup>
import { ref, computed } from 'vue'
import { buildEvents, groupEvents, HISTORY_GRANULARITIES } from '../utils/history'
import { formatRelativeTime } from '../utils/time'

const props = defineProps({
	todos: { type: Array, required: true },
})

const granularity = ref('day')

const events = computed(() => buildEvents(props.todos))
const groups = computed(() => groupEvents(events.value, granularity.value))

const EVENT_META = {
	created: { icon: 'bi-plus-circle', label: 'Created', class: 'text-accent' },
	completed: { icon: 'bi-check-circle', label: 'Completed', class: 'text-success' },
	removed: { icon: 'bi-trash3', label: 'Removed', class: 'text-danger' },
}
</script>

<template>
	<div class="history-granularity btn-group w-100 mb-3" role="group">
		<button
			v-for="g in HISTORY_GRANULARITIES"
			:key="g.key"
			type="button"
			class="btn"
			:class="granularity === g.key ? 'btn-accent' : 'btn-surface text-muted'"
			@click="granularity = g.key"
		>
			{{ g.label }}
		</button>
	</div>

	<div v-if="!events.length" class="text-center text-muted py-5">
		<i class="bi bi-clock-history fs-1 d-block mb-2 opacity-50"></i>
		No history yet.
	</div>

	<div v-else class="history-list">
		<div v-for="group in groups" :key="group.key" class="history-group">
			<div class="history-group-label small fw-semibold text-muted">{{ group.label }}</div>
			<div v-for="event in group.events" :key="event.id" class="history-item d-flex align-items-center gap-2">
				<i class="history-icon" :class="[EVENT_META[event.type].icon, EVENT_META[event.type].class]"></i>
				<span class="flex-grow-1 history-text">{{ event.todo.text }}</span>
				<span class="history-time small text-muted">
					{{ EVENT_META[event.type].label }} {{ formatRelativeTime(event.at) }}
				</span>
			</div>
		</div>
	</div>
</template>

<style scoped>
.btn-accent {
	background: var(--accent);
	border-color: var(--accent);
	color: var(--accent-contrast);
}
.btn-accent:hover,
.btn-accent:focus {
	background: var(--accent-strong);
	border-color: var(--accent-strong);
	color: var(--accent-contrast);
}

.btn-surface {
	background: var(--surface-alt);
	border-color: var(--surface-alt);
}
.btn-surface:hover {
	background: var(--surface-alt-hover);
	border-color: var(--surface-alt-hover);
}

.history-granularity .btn {
	border-radius: 10px !important;
	margin: 0 3px;
	font-weight: 500;
	font-size: 0.9rem;
}
.history-granularity .btn:first-child {
	margin-left: 0;
}
.history-granularity .btn:last-child {
	margin-right: 0;
}

.history-list {
	max-height: 360px;
	overflow-y: auto;
}

.history-group + .history-group {
	margin-top: 16px;
}

.history-group-label {
	margin-bottom: 6px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	font-size: 0.7rem;
}

.history-item {
	padding: 8px 4px;
	border-bottom: 1px solid var(--border);
}
.history-item:last-child {
	border-bottom: none;
}

.history-icon {
	font-size: 0.95rem;
	flex-shrink: 0;
}

.history-text {
	word-break: break-word;
}

.text-accent {
	color: var(--accent) !important;
}
.text-success {
	color: var(--success) !important;
}
.text-danger {
	color: var(--danger) !important;
}
</style>
