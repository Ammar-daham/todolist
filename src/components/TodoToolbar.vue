<script setup>
import { computed } from 'vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'
import { SORT_OPTIONS, DEFAULT_SORT } from '../constants/sort'
import { STATUSES, DEFAULT_STATUS } from '../constants/status'
import { VIEWS, DEFAULT_VIEW } from '../constants/view'
import { DUE_FILTERS } from '../constants/due'
import TodoSearch from './TodoSearch.vue'

const props = defineProps({
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

// How many independent filter groups are narrowing the list, for the Clear
// bar's label. Not the same as hasActiveFilters (a boolean already owned by
// useTodos) — this just counts which of that same state is non-default.
const activeFilterCount = computed(() => {
	let count = 0
	if (props.statusFilter !== DEFAULT_STATUS) count++
	if (props.priorityFilters.length) count++
	if (props.dueFilters.length) count++
	if (props.searchQuery.trim()) count++
	return count
})
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

		<!-- Status only narrows the task list; the bin and the log have no active/completed split. -->
		<div v-if="view === 'tasks'" class="segmented segmented-full mb-2" role="group" aria-label="Status filter">
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

		<button v-else type="button" class="btn btn-back mb-2" @click="$emit('update:view', DEFAULT_VIEW)">
			<i class="bi bi-arrow-left"></i>
			<span>{{ VIEWS.find((v) => v.key === view).label }}</span>
		</button>

		<!-- One scrolling rail instead of a wrapping flex row, so the chips
		     always read as a single line regardless of card width. Priority
		     and due filters narrow every view, not just Tasks — same as before. -->
		<div class="chip-rail mb-2">
			<!-- No "All" chip: nothing selected already means every priority. -->
			<div class="d-flex flex-shrink-0 gap-2" role="group" aria-label="Priority filter">
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

			<span class="filter-divider"></span>

			<!-- No "All" chip here either — same convention as priority. -->
			<div class="d-flex flex-shrink-0 gap-2" role="group" aria-label="Due date filter">
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
		</div>

		<!-- Clear's home is fixed here, never on a wrapping row's ms-auto, so it
		     can't jump position depending on how the chips above wrapped. -->
		<div v-if="hasActiveFilters" class="filter-result">
			<span class="filter-result-count">{{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} active</span>
			<button type="button" class="btn btn-clear" @click="$emit('clear-filters')">
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
/* Full-width so status filtering never competes for space with the chips —
   each option gets an equal share instead of shrinking to fit its label. */
.segmented-full {
	display: flex;
	width: 100%;
}
.segmented-full .segmented-btn {
	flex: 1 1 0;
	text-align: center;
}
.segmented-btn {
	border: none;
	background: transparent;
	border-radius: 8px;
	padding: 0.35rem 0.7rem;
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

/* Scrolls sideways instead of wrapping, so the two chip groups always read
   as one line — the divider between them no longer needs to hide itself
   below a breakpoint to avoid an awkward wrap. */
.chip-rail {
	display: flex;
	align-items: center;
	gap: 8px;
	overflow-x: auto;
	scrollbar-width: none;
	-webkit-overflow-scrolling: touch;
	padding-bottom: 2px;
}
.chip-rail::-webkit-scrollbar {
	display: none;
}

.filter-divider {
	width: 1px;
	flex-shrink: 0;
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
	white-space: nowrap;
	flex-shrink: 0;
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

/* Its own row with a fixed shape, so Clear can no longer land wherever an
   ms-auto happened to break a wrapping row — see the mobile layout redesign. */
.filter-result {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--accent-soft);
	border-radius: 10px;
	padding: 0.4rem 0.6rem;
}
.filter-result-count {
	font-size: 0.78rem;
	font-weight: 500;
	color: var(--accent-strong);
}

.btn-clear {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: none;
	background: transparent;
	padding: 0.3rem 0.5rem;
	font-size: 0.8rem;
	font-weight: 600;
	color: var(--accent-strong);
}
.btn-clear:hover {
	color: var(--danger);
}
</style>
