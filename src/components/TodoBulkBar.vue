<script setup>
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'

defineProps({
	selectedCount: { type: Number, required: true },
	allSelected: { type: Boolean, required: true },
})
defineEmits(['toggle-select-all', 'complete', 'delete', 'set-priority', 'cancel'])
</script>

<template>
	<div class="bulk-bar d-flex flex-wrap align-items-center gap-2">
		<button type="button" class="btn btn-sm btn-bulk-select" @click="$emit('toggle-select-all')">
			<i class="bi" :class="allSelected ? 'bi-dash-square' : 'bi-check2-square'"></i>
			{{ allSelected ? 'Deselect all' : 'Select all' }}
		</button>

		<span class="small text-muted bulk-count">{{ selectedCount }} selected</span>

		<div class="d-flex flex-wrap gap-2 ms-auto">
			<div class="dropdown">
				<button
					type="button"
					class="btn btn-sm btn-bulk"
					:disabled="!selectedCount"
					data-bs-toggle="dropdown"
					data-bs-display="static"
					aria-expanded="false"
				>
					<i class="bi bi-flag me-1"></i>Priority
				</button>
				<ul class="dropdown-menu dropdown-menu-end">
					<li v-for="key in PRIORITY_ORDER" :key="key">
						<button
							type="button"
							class="dropdown-item d-flex align-items-center gap-2"
							@click="$emit('set-priority', key)"
						>
							<span class="priority-dot" :style="{ background: PRIORITIES[key].color }"></span>
							{{ PRIORITIES[key].label }}
						</button>
					</li>
				</ul>
			</div>

			<button type="button" class="btn btn-sm btn-bulk" :disabled="!selectedCount" @click="$emit('complete')">
				<i class="bi bi-check2 me-1"></i>Complete
			</button>

			<button type="button" class="btn btn-sm btn-bulk-danger" :disabled="!selectedCount" @click="$emit('delete')">
				<i class="bi bi-trash3 me-1"></i>Delete
			</button>

			<button type="button" class="btn btn-sm btn-bulk-cancel" @click="$emit('cancel')" aria-label="Exit select mode">
				<i class="bi bi-x-lg"></i>
			</button>
		</div>
	</div>
</template>

<style scoped>
.bulk-bar {
	background: var(--surface-alt);
	border-radius: 10px;
	padding: 8px 10px;
}

.bulk-count {
	white-space: nowrap;
}

.btn-bulk-select {
	border: none;
	background: transparent;
	color: var(--accent);
	font-weight: 500;
	font-size: 0.85rem;
	padding: 0.25rem 0.4rem;
	white-space: nowrap;
}
.btn-bulk-select:hover {
	color: var(--accent-strong);
}

.btn-bulk {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 8px;
	font-size: 0.85rem;
	color: inherit;
	white-space: nowrap;
}
.btn-bulk:hover:not(:disabled) {
	background: var(--surface-alt-hover);
}
.btn-bulk:disabled {
	opacity: 0.5;
}

.btn-bulk-danger {
	background: var(--danger-bg);
	border: 1px solid transparent;
	border-radius: 8px;
	font-size: 0.85rem;
	color: var(--danger);
	white-space: nowrap;
}
.btn-bulk-danger:hover:not(:disabled) {
	filter: brightness(0.95);
}
.btn-bulk-danger:disabled {
	opacity: 0.5;
}

.btn-bulk-cancel {
	border: none;
	background: transparent;
	color: var(--text-done);
	padding: 0.25rem 0.5rem;
}
.btn-bulk-cancel:hover {
	color: var(--danger);
}

.dropdown-menu {
	background: var(--surface);
	border-color: var(--border);
	border-radius: 12px;
	padding: 6px;
	min-width: 150px;
}
.dropdown-item {
	border-radius: 8px;
	font-size: 0.9rem;
	color: inherit;
}
.dropdown-item:hover,
.dropdown-item:focus {
	background: var(--surface-alt-hover);
	color: inherit;
}

.priority-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	display: inline-block;
}
</style>
