<script setup>
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'
import { SORT_OPTIONS, DEFAULT_SORT } from '../constants/sort'
import TodoSearch from './TodoSearch.vue'

defineProps({
	view: { type: String, required: true },
	statusFilter: { type: String, required: true },
	priorityFilters: { type: Array, required: true },
	dueFilters: { type: Array, required: true },
	searchQuery: { type: String, required: true },
	sortBy: { type: String, required: true },
	hasActiveFilters: { type: Boolean, required: true },
})
defineEmits([
	'update:view',
	'update:statusFilter',
	'update:searchQuery',
	'update:sortBy',
	'toggle-priority',
	'toggle-due',
	'clear-filters',
])

const STATUSES = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active' },
	{ key: 'completed', label: 'Completed' },
]

// Keys match utils/time.js's getDueStatus, so a chip means exactly what the
// matching per-item due badge already shows.
const DUE_FILTERS = [
	{ key: 'overdue', label: 'Overdue', badge: 'danger', icon: 'bi-exclamation-circle' },
	{ key: 'upcoming', label: 'Upcoming', badge: 'warning', icon: 'bi-hourglass-split' },
]

const VIEWS = [
	{ key: 'tasks', label: 'Tasks', icon: 'bi-list-check' },
	{ key: 'removed', label: 'Removed', icon: 'bi-trash3' },
	{ key: 'history', label: 'History', icon: 'bi-clock-history' },
]
</script>

<template>
	<div class="todo-toolbar mb-3">
		<div class="d-flex align-items-center gap-2 mb-2">
			<TodoSearch
				class="flex-grow-1"
				:model-value="searchQuery"
				@update:model-value="$emit('update:searchQuery', $event)"
			/>

			<!-- Sort only reorders the task list; Removed and History have their own fixed order. -->
			<div v-if="view === 'tasks'" class="dropdown flex-shrink-0">
				<button
					type="button"
					class="btn btn-view"
					:class="{ 'btn-view-active': sortBy !== DEFAULT_SORT }"
					data-bs-toggle="dropdown"
					data-bs-display="static"
					aria-expanded="false"
					aria-label="Sort tasks"
				>
					<i class="bi bi-sort-down"></i>
				</button>
				<ul class="dropdown-menu dropdown-menu-end">
					<li v-for="s in SORT_OPTIONS" :key="s.key">
						<button
							type="button"
							class="dropdown-item d-flex align-items-center gap-2"
							:class="{ active: sortBy === s.key }"
							@click="$emit('update:sortBy', s.key)"
						>
							<i class="bi" :class="s.icon"></i>{{ s.label }}
							<i v-if="sortBy === s.key" class="bi bi-check2 ms-auto"></i>
						</button>
					</li>
				</ul>
			</div>

			<div class="dropdown flex-shrink-0">
				<button
					type="button"
					class="btn btn-view"
					:class="{ 'btn-view-active': view !== 'tasks' }"
					data-bs-toggle="dropdown"
					data-bs-display="static"
					aria-expanded="false"
					aria-label="Switch view"
				>
					<i class="bi bi-three-dots"></i>
				</button>
				<ul class="dropdown-menu dropdown-menu-end">
					<li v-for="v in VIEWS" :key="v.key">
						<button
							type="button"
							class="dropdown-item d-flex align-items-center gap-2"
							:class="{ active: view === v.key }"
							@click="$emit('update:view', v.key)"
						>
							<i class="bi" :class="v.icon"></i>{{ v.label }}
							<i v-if="view === v.key" class="bi bi-check2 ms-auto"></i>
						</button>
					</li>
				</ul>
			</div>
		</div>

		<div class="d-flex flex-wrap align-items-center gap-2 filter-row">
			<!-- Status only narrows the task list; the bin and the log have no active/completed split. -->
			<div v-if="view === 'tasks'" class="segmented" role="group" aria-label="Status filter">
				<button
					v-for="s in STATUSES"
					:key="s.key"
					type="button"
					class="segmented-btn"
					:class="{ 'segmented-btn-active': statusFilter === s.key }"
					:aria-pressed="statusFilter === s.key"
					@click="$emit('update:statusFilter', s.key)"
				>
					{{ s.label }}
				</button>
			</div>

			<button v-else type="button" class="btn btn-back" @click="$emit('update:view', 'tasks')">
				<i class="bi bi-arrow-left"></i>
				<span>{{ VIEWS.find((v) => v.key === view).label }}</span>
			</button>

			<span class="filter-divider d-none d-sm-block"></span>

			<!-- No "All" chip: nothing selected already means every priority. -->
			<div class="d-flex flex-wrap gap-2" role="group" aria-label="Priority filter">
				<button
					v-for="key in PRIORITY_ORDER"
					:key="key"
					type="button"
					class="btn chip d-flex align-items-center gap-1"
					:class="[`chip-${PRIORITIES[key].badge}`, { 'chip-active': priorityFilters.includes(key) }]"
					:aria-pressed="priorityFilters.includes(key)"
					@click="$emit('toggle-priority', key)"
				>
					<span
						class="chip-dot"
						:style="{ background: priorityFilters.includes(key) ? '#fff' : PRIORITIES[key].color }"
					></span>
					{{ PRIORITIES[key].short }}
				</button>
			</div>

			<!-- No "All" chip here either — same convention as priority. -->
			<div class="d-flex flex-wrap gap-2" role="group" aria-label="Due date filter">
				<button
					v-for="d in DUE_FILTERS"
					:key="d.key"
					type="button"
					class="btn chip d-flex align-items-center gap-1"
					:class="[`chip-${d.badge}`, { 'chip-active': dueFilters.includes(d.key) }]"
					:aria-pressed="dueFilters.includes(d.key)"
					@click="$emit('toggle-due', d.key)"
				>
					<i class="bi" :class="d.icon"></i>
					{{ d.label }}
				</button>
			</div>

			<button
				v-if="hasActiveFilters"
				type="button"
				class="btn btn-clear ms-auto"
				@click="$emit('clear-filters')"
			>
				<i class="bi bi-x-lg"></i>Clear
			</button>
		</div>
	</div>
</template>

<style scoped>
.btn-view {
	background: var(--surface-alt);
	border: 1px solid var(--border);
	border-radius: 10px;
	color: var(--text-done);
	padding: 0.25rem 0.6rem;
	line-height: 1.5;
}
.btn-view:hover {
	background: var(--surface-alt-hover);
	color: inherit;
}
.btn-view-active {
	background: var(--accent);
	border-color: var(--accent);
	color: var(--accent-contrast);
}
.btn-view-active:hover {
	background: var(--accent-strong);
	border-color: var(--accent-strong);
	color: var(--accent-contrast);
}

.dropdown-menu {
	background: var(--surface);
	border-color: var(--border);
	border-radius: 12px;
	padding: 6px;
	min-width: 170px;
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
.dropdown-item.active {
	background: var(--accent-soft);
	color: inherit;
}

.segmented {
	display: inline-flex;
	background: var(--surface-alt);
	border-radius: 10px;
	padding: 3px;
	gap: 2px;
}
.segmented-btn {
	border: none;
	background: transparent;
	border-radius: 8px;
	padding: 0.25rem 0.7rem;
	font-size: 0.85rem;
	font-weight: 500;
	color: var(--text-done);
	white-space: nowrap;
}
.segmented-btn:hover {
	color: inherit;
}
.segmented-btn-active {
	background: var(--accent);
	color: var(--accent-contrast);
}
.segmented-btn-active:hover {
	color: var(--accent-contrast);
}

.btn-back {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	background: var(--accent-soft);
	border: none;
	border-radius: 10px;
	padding: 0.3rem 0.75rem;
	font-size: 0.85rem;
	font-weight: 500;
	color: var(--accent);
}
.btn-back:hover {
	background: var(--accent-soft);
	color: var(--accent-strong);
}

.filter-divider {
	width: 1px;
	align-self: stretch;
	min-height: 22px;
	background: var(--border);
}

.chip {
	border: none;
	border-radius: 10px;
	padding: 0.3rem 0.7rem;
	font-size: 0.85rem;
	font-weight: 500;
}
.chip-danger {
	background: var(--danger-bg);
	color: var(--danger);
}
.chip-warning {
	background: var(--warning-bg);
	color: var(--warning);
}
.chip-success {
	background: var(--success-bg);
	color: var(--success);
}
.chip-danger.chip-active {
	background: var(--danger);
	color: #fff;
}
.chip-warning.chip-active {
	background: var(--warning);
	color: #fff;
}
.chip-success.chip-active {
	background: var(--success);
	color: #fff;
}

.chip-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	display: inline-block;
}

.btn-clear {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: none;
	padding: 0.3rem 0.5rem;
	font-size: 0.8rem;
	color: var(--text-done);
}
.btn-clear:hover {
	color: var(--danger);
}
</style>
