<script setup>
import { ref, computed } from 'vue'
import TodoItem from './TodoItem.vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'
import { todayDateString } from '../utils/time'

const props = defineProps({
	// Same active-list-scoped, priority/due/tag/search-filtered set the flat
	// Tasks list uses (activeTodos in useTodos) — this view only replaces how
	// they're laid out (by date instead of a flat list), not which ones show.
	todos: { type: Array, required: true },
})
const emit = defineEmits([
	'toggle',
	'edit',
	'set-due-date',
	'set-priority',
	'set-notes',
	'set-recurrence',
	'add-tag',
	'remove-tag',
	'add-subtask',
	'edit-subtask',
	'toggle-subtask',
	'remove-subtask',
	'remove',
])

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toDateKey(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

function fromDateKey(dateKey) {
	const [y, m, d] = dateKey.split('-').map(Number)
	return new Date(y, m - 1, d)
}

const today = todayDateString()
const viewMonth = ref(startOfMonth(new Date()))
const selectedDate = ref(today)

const monthLabel = computed(() => viewMonth.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))

function shiftMonth(delta) {
	const d = viewMonth.value
	viewMonth.value = new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

function goToToday() {
	viewMonth.value = startOfMonth(new Date())
	selectedDate.value = today
}

function selectDay(date) {
	selectedDate.value = toDateKey(date)
	if (date.getMonth() !== viewMonth.value.getMonth() || date.getFullYear() !== viewMonth.value.getFullYear()) {
		viewMonth.value = startOfMonth(date)
	}
}

// A fixed 6-week (42-day) grid, padded with the tail of the previous month
// and the head of the next, so the calendar's height never jumps between
// 4-, 5-, and 6-week months as you navigate.
const calendarDays = computed(() => {
	const first = viewMonth.value
	const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
	return Array.from({ length: 42 }, (_, i) => {
		const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
		return {
			date,
			key: toDateKey(date),
			day: date.getDate(),
			inMonth: date.getMonth() === first.getMonth(),
		}
	})
})

const tasksByDate = computed(() => {
	const map = new Map()
	for (const todo of props.todos) {
		if (!todo.dueDate) continue
		if (!map.has(todo.dueDate)) map.set(todo.dueDate, [])
		map.get(todo.dueDate).push(todo)
	}
	return map
})

const unscheduledCount = computed(() => props.todos.filter((t) => !t.dueDate).length)

function dotsFor(dateKey) {
	return (tasksByDate.value.get(dateKey) || []).slice(0, 4)
}

function overflowFor(dateKey) {
	const count = (tasksByDate.value.get(dateKey) || []).length
	return count > 4 ? count - 4 : 0
}

const selectedDayLabel = computed(() =>
	fromDateKey(selectedDate.value).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
)

const selectedDayTasks = computed(() => {
	const list = tasksByDate.value.get(selectedDate.value) || []
	return [...list].sort((a, b) => {
		if (a.done !== b.done) return a.done ? 1 : -1
		if (a.dueTime && b.dueTime) return a.dueTime < b.dueTime ? -1 : a.dueTime > b.dueTime ? 1 : 0
		if (a.dueTime) return -1
		if (b.dueTime) return 1
		return PRIORITY_ORDER.indexOf(a.priority || 'medium') - PRIORITY_ORDER.indexOf(b.priority || 'medium')
	})
})
</script>

<template>
	<div class="todo-calendar">
		<div class="calendar-header d-flex align-items-center justify-content-between mb-2">
			<button type="button" class="btn btn-sm btn-icon" aria-label="Previous month" @click="shiftMonth(-1)">
				<i class="bi bi-chevron-left"></i>
			</button>
			<div class="d-flex align-items-center gap-2">
				<span class="calendar-month">{{ monthLabel }}</span>
				<button type="button" class="btn btn-sm btn-today" @click="goToToday">Today</button>
			</div>
			<button type="button" class="btn btn-sm btn-icon" aria-label="Next month" @click="shiftMonth(1)">
				<i class="bi bi-chevron-right"></i>
			</button>
		</div>

		<div class="calendar-weekdays">
			<span v-for="label in WEEKDAY_LABELS" :key="label">{{ label }}</span>
		</div>

		<div class="calendar-grid">
			<button
				v-for="cell in calendarDays"
				:key="cell.key"
				type="button"
				class="calendar-day"
				:class="{
					'calendar-day-outside': !cell.inMonth,
					'calendar-day-today': cell.key === today,
					'calendar-day-selected': cell.key === selectedDate,
				}"
				@click="selectDay(cell.date)"
			>
				<span class="calendar-day-number">{{ cell.day }}</span>
				<span v-if="dotsFor(cell.key).length" class="calendar-day-dots">
					<span
						v-for="task in dotsFor(cell.key)"
						:key="task.id"
						class="calendar-dot"
						:style="{ background: PRIORITIES[task.priority || 'medium'].color }"
					></span>
					<span v-if="overflowFor(cell.key)" class="calendar-dot-overflow">+{{ overflowFor(cell.key) }}</span>
				</span>
			</button>
		</div>

		<div class="calendar-agenda">
			<div class="calendar-agenda-header small fw-semibold text-muted">{{ selectedDayLabel }}</div>

			<ul v-if="selectedDayTasks.length" class="list-unstyled mb-0 calendar-agenda-list">
				<TodoItem
					v-for="todo in selectedDayTasks"
					:key="todo.id"
					:todo="todo"
					@toggle="$emit('toggle', $event)"
					@edit="(id, text) => $emit('edit', id, text)"
					@set-due-date="(id, date, time) => $emit('set-due-date', id, date, time)"
					@set-priority="(id, priority) => $emit('set-priority', id, priority)"
					@set-notes="(id, notes) => $emit('set-notes', id, notes)"
					@set-recurrence="(id, recurrence) => $emit('set-recurrence', id, recurrence)"
					@add-tag="(id, tag) => $emit('add-tag', id, tag)"
					@remove-tag="(id, tag) => $emit('remove-tag', id, tag)"
					@add-subtask="(id, text) => $emit('add-subtask', id, text)"
					@edit-subtask="(id, subtaskId, text) => $emit('edit-subtask', id, subtaskId, text)"
					@toggle-subtask="(id, subtaskId) => $emit('toggle-subtask', id, subtaskId)"
					@remove-subtask="(id, subtaskId) => $emit('remove-subtask', id, subtaskId)"
					@remove="$emit('remove', $event)"
				/>
			</ul>
			<div v-else class="text-center text-muted py-4">
				<i class="bi bi-calendar2-check fs-3 d-block mb-2 opacity-50"></i>
				Nothing due this day.
			</div>

			<p v-if="unscheduledCount" class="calendar-unscheduled-note small text-muted mb-0 mt-2">
				{{ unscheduledCount }} task{{ unscheduledCount === 1 ? '' : 's' }} with no due date — see the Tasks view.
			</p>
		</div>
	</div>
</template>

<style scoped>
.btn-icon {
	border: none;
	background: transparent;
	color: var(--text-done);
	opacity: 0.75;
}
.btn-icon:hover {
	opacity: 1;
	color: var(--accent);
}

.calendar-month {
	font-weight: 700;
	font-size: 0.95rem;
}

.btn-today {
	background: var(--surface-alt);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 0.15rem 0.55rem;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--text-done);
}
.btn-today:hover {
	background: var(--surface-alt-hover);
	color: inherit;
}

.calendar-weekdays {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	text-align: center;
	font-size: 0.68rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--text-done);
	margin-bottom: 4px;
}

.calendar-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 3px;
}

.calendar-day {
	aspect-ratio: 1;
	min-height: 40px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	border: none;
	border-radius: 10px;
	background: var(--surface-alt);
	color: inherit;
	padding: 2px;
}
.calendar-day:hover {
	background: var(--surface-alt-hover);
}
.calendar-day-outside {
	opacity: 0.35;
}
.calendar-day-today .calendar-day-number {
	color: var(--accent);
	font-weight: 700;
}
.calendar-day-selected {
	background: var(--accent);
	color: var(--accent-contrast);
}
.calendar-day-selected .calendar-day-number {
	color: var(--accent-contrast);
}

.calendar-day-number {
	font-size: 0.78rem;
	font-weight: 500;
}

.calendar-day-dots {
	display: flex;
	align-items: center;
	gap: 2px;
	line-height: 1;
}
.calendar-dot {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	display: inline-block;
}
.calendar-day-selected .calendar-dot {
	background: var(--accent-contrast) !important;
	opacity: 0.85;
}
.calendar-dot-overflow {
	font-size: 0.55rem;
	font-weight: 700;
}

.calendar-agenda {
	margin-top: 16px;
}

.calendar-agenda-header {
	text-transform: uppercase;
	letter-spacing: 0.03em;
	font-size: 0.7rem;
	margin-bottom: 8px;
}

.calendar-agenda-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 320px;
	overflow-y: auto;
}

.calendar-unscheduled-note {
	font-style: italic;
}
</style>
