<script setup>
import { ref, nextTick } from 'vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'
import { formatDueDate } from '../utils/time'

const emit = defineEmits(['add'])

const text = ref('')
const priority = ref('medium')
const dueDate = ref('')
const dueTime = ref('')
const notes = ref('')
const tags = ref([])
const newTagText = ref('')

// The due-date/time pickers open in a panel below the fixed priority/due/Add
// row instead of inline, so that row never has to squeeze to fit them — see
// CLAUDE-guided mobile layout redesign.
const dueOpen = ref(false)
const dueDateInput = ref(null)

// Notes are opt-in too, and rare enough on task creation that it isn't worth
// a permanent row — a small toggle keeps the common (title-only) case tidy.
const notesOpen = ref(false)
const notesInput = ref(null)

function submit() {
	if (!text.value.trim()) return
	emit(
		'add',
		text.value,
		priority.value,
		dueDate.value || null,
		dueDate.value ? dueTime.value || null : null,
		notes.value.trim() || null,
		tags.value
	)
	text.value = ''
	priority.value = 'medium'
	dueDate.value = ''
	dueTime.value = ''
	dueOpen.value = false
	notes.value = ''
	notesOpen.value = false
	tags.value = []
	newTagText.value = ''
}

function addTagFromInput() {
	const trimmed = newTagText.value.trim()
	if (!trimmed) return
	if (!tags.value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
		tags.value.push(trimmed)
	}
	newTagText.value = ''
}

function removeTagAt(index) {
	tags.value.splice(index, 1)
}

function toggleDuePanel() {
	dueOpen.value = !dueOpen.value
	if (dueOpen.value) nextTick(() => dueDateInput.value?.focus())
}

function clearDue() {
	dueDate.value = ''
	dueTime.value = ''
}

function toggleNotesPanel() {
	notesOpen.value = !notesOpen.value
	if (notesOpen.value) nextTick(() => notesInput.value?.focus())
}

function clearNotes() {
	notes.value = ''
}
</script>

<template>
	<form class="mb-4" @submit.prevent="submit">
		<div class="input-group input-group-lg todo-input-group mb-2">
			<span class="input-group-text border-end-0">
				<i class="bi bi-plus-lg text-muted"></i>
			</span>
			<input
				v-model="text"
				type="text"
				class="form-control border-start-0 ps-0"
				placeholder="What needs to be done?"
			/>
		</div>

		<div class="d-flex justify-content-end mb-2">
			<button type="button" class="btn btn-sm btn-link p-0 notes-toggle" @click="toggleNotesPanel">
				<i class="bi bi-card-text"></i> {{ notes ? 'Edit notes' : 'Add notes' }}
			</button>
		</div>
		<div v-if="notesOpen" class="notes-panel mb-2">
			<textarea
				ref="notesInput"
				v-model="notes"
				rows="2"
				class="form-control form-control-sm notes-panel-input"
				placeholder="Notes (optional)"
				@keyup.esc="notesOpen = false"
			></textarea>
			<div class="d-flex align-items-center justify-content-between mt-2">
				<button v-if="notes" type="button" class="btn btn-sm btn-link p-0 due-panel-clear" @click="clearNotes">
					Clear notes
				</button>
				<span v-else></span>
				<button type="button" class="btn btn-sm btn-accent due-panel-done" @click="notesOpen = false">Done</button>
			</div>
		</div>

		<div class="tags-row d-flex flex-wrap align-items-center gap-1 mb-2">
			<span v-for="(tag, index) in tags" :key="tag" class="tag-chip">
				{{ tag }}
				<button type="button" class="tag-chip-remove" @click="removeTagAt(index)" :aria-label="`Remove tag ${tag}`">
					<i class="bi bi-x"></i>
				</button>
			</span>
			<input
				v-model="newTagText"
				type="text"
				class="tag-new-input"
				placeholder="Add tag"
				@keyup.enter="addTagFromInput"
				@blur="addTagFromInput"
			/>
		</div>

		<!-- Fixed 3-up grid: priority, due (a button that never changes size),
		     Add. Never wraps, regardless of what's picked. -->
		<div class="input-row">
			<select v-model="priority" class="form-select priority-select" aria-label="Priority">
				<option v-for="key in PRIORITY_ORDER" :key="key" :value="key">{{ PRIORITIES[key].label }}</option>
			</select>

			<button
				type="button"
				class="btn due-toggle"
				:class="{ 'due-toggle-set': dueDate, 'due-toggle-open': dueOpen }"
				:aria-expanded="dueOpen"
				@click="toggleDuePanel"
			>
				<i class="bi" :class="dueTime ? 'bi-alarm' : 'bi-calendar-event'"></i>
				<span class="text-truncate">{{ dueDate ? formatDueDate(dueDate, dueTime) : 'Due date' }}</span>
			</button>

			<button class="btn btn-accent" type="submit" :disabled="!text.trim()">Add</button>
		</div>

		<!-- The panel grows the card instead of squeezing into the row above. -->
		<div v-if="dueOpen" class="due-panel">
			<div class="d-flex align-items-center gap-2">
				<input
					ref="dueDateInput"
					v-model="dueDate"
					type="date"
					class="form-control form-control-sm due-panel-input"
					aria-label="Due date"
				/>
				<input
					v-if="dueDate"
					v-model="dueTime"
					type="time"
					class="form-control form-control-sm due-panel-input"
					aria-label="Due time (optional)"
				/>
			</div>
			<div class="d-flex align-items-center justify-content-between mt-2">
				<button
					v-if="dueDate"
					type="button"
					class="btn btn-sm btn-link p-0 due-panel-clear"
					@click="clearDue"
				>
					Clear due date
				</button>
				<span v-else></span>
				<button type="button" class="btn btn-sm btn-accent due-panel-done" @click="dueOpen = false">Done</button>
			</div>
		</div>
	</form>
</template>

<style scoped>
.todo-input-group .form-control:focus {
	box-shadow: none;
}

.todo-input-group .input-group-text,
.todo-input-group .form-control {
	border-color: var(--border);
	background: var(--surface);
}

.input-row {
	display: grid;
	grid-template-columns: 1fr 1fr 76px;
	gap: 8px;
}

.priority-select {
	height: 44px;
	border-radius: 12px;
	border-color: var(--border);
	background-color: var(--surface);
	color: inherit;
	font-size: 0.85rem;
	font-weight: 500;
	padding-inline: 10px;
}
.priority-select:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.due-toggle {
	height: 44px;
	border-radius: 12px;
	border: 1px dashed var(--border);
	background: var(--surface-alt);
	color: var(--text-done);
	font-size: 0.85rem;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 6px;
	padding-inline: 10px;
	min-width: 0;
}
.due-toggle span {
	min-width: 0;
}
.due-toggle:hover {
	background: var(--surface-alt-hover);
}
.due-toggle-set {
	border-style: solid;
	border-color: var(--border);
	color: inherit;
}
.due-toggle-open {
	border-style: solid;
	border-color: var(--accent);
	background: var(--accent-soft);
	color: var(--accent-strong);
}

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
.btn-accent:disabled {
	background: var(--accent);
	border-color: var(--accent);
}

.input-row > .btn-accent {
	height: 44px;
	border-radius: 12px;
	font-weight: 600;
	padding-inline: 0;
}

.due-panel {
	margin-top: 8px;
	border-radius: 12px;
	background: var(--surface-alt);
	border: 1px solid var(--border);
	padding: 10px;
}

.due-panel-input {
	flex: 1 1 0;
	min-width: 0;
	background: var(--surface);
	border-color: var(--border);
	color: inherit;
}
.due-panel-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.due-panel-clear {
	font-size: 0.8rem;
	color: var(--danger);
	text-decoration: none;
}
.due-panel-clear:hover {
	text-decoration: underline;
}

.due-panel-done {
	border-radius: 9px;
	font-size: 0.85rem;
	padding: 0.35rem 0.9rem;
}

.notes-toggle {
	font-size: 0.8rem;
	color: var(--text-done);
	text-decoration: none;
}
.notes-toggle:hover {
	color: var(--accent-strong);
}

.notes-panel {
	border-radius: 12px;
	background: var(--surface-alt);
	border: 1px solid var(--border);
	padding: 10px;
}

.notes-panel-input {
	background: var(--surface);
	border-color: var(--border);
	color: inherit;
	resize: vertical;
}
.notes-panel-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.tag-chip {
	display: inline-flex;
	align-items: center;
	gap: 3px;
	background: var(--accent-soft);
	color: var(--accent-strong);
	border-radius: 999px;
	padding: 3px 5px 3px 10px;
	font-size: 0.75rem;
	font-weight: 600;
}

.tag-chip-remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: inherit;
	opacity: 0.7;
	padding: 0;
	line-height: 1;
}
.tag-chip-remove:hover {
	opacity: 1;
	color: var(--danger);
}

.tag-new-input {
	border: 1px dashed var(--border);
	border-radius: 999px;
	background: var(--surface-alt);
	color: inherit;
	padding: 3px 10px;
	font-size: 0.78rem;
	flex: 1 1 100px;
	min-width: 90px;
	outline: none;
}
.tag-new-input:focus {
	border-style: solid;
	border-color: var(--accent);
}
</style>
