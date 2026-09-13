<script setup>
import { ref, computed, nextTick } from 'vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'
import { formatRelativeTime, formatDueDate, getDueStatus } from '../utils/time'

const props = defineProps({
	todo: { type: Object, required: true },
	selectMode: { type: Boolean, default: false },
	selected: { type: Boolean, default: false },
})
const emit = defineEmits([
	'toggle',
	'edit',
	'set-due-date',
	'set-priority',
	'set-notes',
	'add-tag',
	'remove-tag',
	'add-subtask',
	'edit-subtask',
	'toggle-subtask',
	'remove-subtask',
	'remove',
	'toggle-select',
])

const isEditing = ref(false)
const draftText = ref('')
const editInput = ref(null)

function startEdit() {
	draftText.value = props.todo.text
	isEditing.value = true
	nextTick(() => editInput.value?.focus())
}

function saveEdit() {
	if (!isEditing.value) return
	isEditing.value = false
	const trimmed = draftText.value.trim()
	if (trimmed && trimmed !== props.todo.text) {
		emit('edit', props.todo.id, trimmed)
	}
}

function cancelEdit() {
	isEditing.value = false
}

const isEditingDue = ref(false)
const draftDue = ref('')
const draftDueTime = ref('')
const dueInput = ref(null)
const dueTimeInput = ref(null)
const dueStatus = computed(() => getDueStatus(props.todo.dueDate, props.todo.done))

function startEditDue() {
	draftDue.value = props.todo.dueDate || ''
	draftDueTime.value = props.todo.dueTime || ''
	isEditingDue.value = true
	nextTick(() => dueInput.value?.focus())
}

function saveEditDue() {
	if (!isEditingDue.value) return
	isEditingDue.value = false
	emit('set-due-date', props.todo.id, draftDue.value || null, draftDue.value ? draftDueTime.value || null : null)
}

function cancelEditDue() {
	isEditingDue.value = false
}

function clearDue() {
	isEditingDue.value = false
	emit('set-due-date', props.todo.id, null, null)
}

// Tabbing/clicking from the date field into the new time field shouldn't
// commit early — only save once focus actually leaves both fields.
function handleDateBlur(event) {
	if (event.relatedTarget && event.relatedTarget === dueTimeInput.value) return
	saveEditDue()
}

const isEditingNotes = ref(false)
const draftNotes = ref('')
const notesInput = ref(null)

function startEditNotes() {
	draftNotes.value = props.todo.notes || ''
	isEditingNotes.value = true
	nextTick(() => notesInput.value?.focus())
}

function saveEditNotes() {
	if (!isEditingNotes.value) return
	isEditingNotes.value = false
	emit('set-notes', props.todo.id, draftNotes.value.trim() || null)
}

function cancelEditNotes() {
	isEditingNotes.value = false
}

function clearNotes() {
	isEditingNotes.value = false
	emit('set-notes', props.todo.id, null)
}

// Adding a tag is a single atomic action (unlike text/notes, there's no
// draft-then-save step) — the input just clears itself and stays focused so
// several tags can be typed in a row.
const isAddingTag = ref(false)
const newTagText = ref('')
const newTagInput = ref(null)

function startAddTag() {
	isAddingTag.value = true
	nextTick(() => newTagInput.value?.focus())
}

function submitNewTag() {
	if (!newTagText.value.trim()) return
	emit('add-tag', props.todo.id, newTagText.value)
	newTagText.value = ''
}

function stopAddingTag() {
	isAddingTag.value = false
	newTagText.value = ''
}

// Open by default whenever the task already has a checklist, so progress is
// visible at a glance; collapsed otherwise to keep a plain task compact.
const subtasksOpen = ref(props.todo.subtasks.length > 0)
const newSubtaskText = ref('')
const newSubtaskInput = ref(null)
const subtaskCount = computed(() => props.todo.subtasks.length)
const subtaskDoneCount = computed(() => props.todo.subtasks.filter((s) => s.done).length)

function toggleSubtasksPanel() {
	subtasksOpen.value = !subtasksOpen.value
	if (subtasksOpen.value) nextTick(() => newSubtaskInput.value?.focus())
}

function submitNewSubtask() {
	if (!newSubtaskText.value.trim()) return
	emit('add-subtask', props.todo.id, newSubtaskText.value)
	newSubtaskText.value = ''
	nextTick(() => newSubtaskInput.value?.focus())
}

const editingSubtaskId = ref(null)
const draftSubtaskText = ref('')

function startEditSubtask(subtask) {
	editingSubtaskId.value = subtask.id
	draftSubtaskText.value = subtask.text
}

function saveEditSubtask(subtaskId) {
	if (editingSubtaskId.value !== subtaskId) return
	editingSubtaskId.value = null
	const trimmed = draftSubtaskText.value.trim()
	const subtask = props.todo.subtasks.find((s) => s.id === subtaskId)
	if (trimmed && subtask && trimmed !== subtask.text) {
		emit('edit-subtask', props.todo.id, subtaskId, trimmed)
	}
}

function cancelEditSubtask() {
	editingSubtaskId.value = null
}
</script>

<template>
	<li
		class="todo-item d-flex align-items-center gap-3"
		:class="{ 'todo-item-done': todo.done }"
		:style="{ borderInlineStartColor: PRIORITIES[todo.priority || 'medium'].color }"
	>
		<label v-if="!selectMode" class="todo-check flex-shrink-0" :class="{ checked: todo.done }">
			<input type="checkbox" :checked="todo.done" @change="$emit('toggle', todo.id)" />
			<span class="todo-check-box">
				<i class="bi bi-check-lg"></i>
			</span>
		</label>
		<label v-else class="todo-check flex-shrink-0" :class="{ checked: selected }">
			<input type="checkbox" :checked="selected" @change="$emit('toggle-select', todo.id)" />
			<span class="todo-check-box">
				<i class="bi bi-check-lg"></i>
			</span>
		</label>
		<div class="flex-grow-1 todo-content">
			<input
				v-if="isEditing"
				ref="editInput"
				v-model="draftText"
				type="text"
				class="form-control form-control-sm todo-edit-input"
				@keyup.enter="saveEdit"
				@keyup.esc="cancelEdit"
				@blur="saveEdit"
			/>
			<template v-else>
				<span class="todo-text" @dblclick="!selectMode && startEdit()">{{ todo.text }}</span>
				<div class="todo-meta small text-muted">
					<span>Created {{ formatRelativeTime(todo.createdAt) }}</span>
					<span v-if="todo.completedAt"> · Completed {{ formatRelativeTime(todo.completedAt) }}</span>
				</div>

				<div v-if="!isEditingDue" class="todo-due-row">
					<button
						type="button"
						class="due-badge"
						:class="todo.dueDate ? `due-${dueStatus}` : 'due-empty'"
						@click="startEditDue"
					>
						<i class="bi" :class="todo.dueTime ? 'bi-alarm' : 'bi-calendar-event'"></i>
						{{ todo.dueDate ? formatDueDate(todo.dueDate, todo.dueTime) : 'Add due date' }}
					</button>
				</div>
				<div v-else class="due-edit d-flex align-items-center gap-2">
					<input
						ref="dueInput"
						v-model="draftDue"
						type="date"
						class="form-control form-control-sm due-edit-input"
						@keyup.enter="saveEditDue"
						@keyup.esc="cancelEditDue"
						@blur="handleDateBlur"
					/>
					<input
						v-if="draftDue"
						ref="dueTimeInput"
						v-model="draftDueTime"
						type="time"
						class="form-control form-control-sm due-edit-time-input"
						@keyup.enter="saveEditDue"
						@keyup.esc="cancelEditDue"
						@blur="saveEditDue"
					/>
					<button type="button" class="btn btn-sm btn-link p-0 due-clear" @mousedown.prevent="clearDue">Clear</button>
				</div>

				<div v-if="!isEditingNotes" class="todo-notes-row">
					<button
						type="button"
						class="notes-badge"
						:class="todo.notes ? 'notes-filled' : 'notes-empty'"
						@click="startEditNotes"
					>
						<i class="bi bi-card-text"></i>
						<span v-if="todo.notes" class="notes-preview">{{ todo.notes }}</span>
						<span v-else>Add notes</span>
					</button>
				</div>
				<div v-else class="notes-edit">
					<textarea
						ref="notesInput"
						v-model="draftNotes"
						rows="2"
						class="form-control form-control-sm notes-edit-input"
						placeholder="Notes"
						@keyup.esc="cancelEditNotes"
						@blur="saveEditNotes"
					></textarea>
					<button type="button" class="btn btn-sm btn-link p-0 due-clear" @mousedown.prevent="clearNotes">
						Clear
					</button>
				</div>

				<div class="todo-tags-row d-flex flex-wrap align-items-center gap-1">
					<span v-for="tag in todo.tags" :key="tag" class="tag-chip">
						{{ tag }}
						<button
							type="button"
							class="tag-chip-remove"
							@click="emit('remove-tag', todo.id, tag)"
							:aria-label="`Remove tag ${tag}`"
						>
							<i class="bi bi-x"></i>
						</button>
					</span>
					<input
						v-if="isAddingTag"
						ref="newTagInput"
						v-model="newTagText"
						type="text"
						class="tag-new-input"
						placeholder="Tag"
						@keyup.enter="submitNewTag"
						@keyup.esc="stopAddingTag"
						@blur="stopAddingTag"
					/>
					<button v-else type="button" class="tag-add-btn" @click="startAddTag">
						<i class="bi bi-plus"></i>{{ todo.tags.length ? '' : 'Add tag' }}
					</button>
				</div>

				<div class="todo-subtasks-row">
					<button
						type="button"
						class="subtasks-badge"
						:class="subtaskCount ? 'subtasks-filled' : 'subtasks-empty'"
						@click="toggleSubtasksPanel"
					>
						<i class="bi bi-list-check"></i>
						<span v-if="subtaskCount">{{ subtaskDoneCount }}/{{ subtaskCount }} subtasks</span>
						<span v-else>Add subtasks</span>
					</button>
				</div>
				<div v-if="subtasksOpen" class="subtasks-panel">
					<ul class="list-unstyled mb-2 subtasks-list">
						<li v-for="subtask in todo.subtasks" :key="subtask.id" class="subtask-row d-flex align-items-center gap-2">
							<label class="subtask-check flex-shrink-0" :class="{ checked: subtask.done }">
								<input
									type="checkbox"
									:checked="subtask.done"
									@change="emit('toggle-subtask', todo.id, subtask.id)"
								/>
								<span class="subtask-check-box">
									<i class="bi bi-check-lg"></i>
								</span>
							</label>
							<input
								v-if="editingSubtaskId === subtask.id"
								v-model="draftSubtaskText"
								type="text"
								class="form-control form-control-sm subtask-edit-input"
								@keyup.enter="saveEditSubtask(subtask.id)"
								@keyup.esc="cancelEditSubtask"
								@blur="saveEditSubtask(subtask.id)"
							/>
							<span
								v-else
								class="subtask-text flex-grow-1"
								:class="{ 'subtask-done': subtask.done }"
								@dblclick="startEditSubtask(subtask)"
							>
								{{ subtask.text }}
							</span>
							<button
								type="button"
								class="btn btn-sm btn-icon text-muted flex-shrink-0"
								@click="emit('remove-subtask', todo.id, subtask.id)"
								aria-label="Remove subtask"
							>
								<i class="bi bi-x-lg"></i>
							</button>
						</li>
					</ul>
					<div class="d-flex align-items-center gap-2">
						<input
							ref="newSubtaskInput"
							v-model="newSubtaskText"
							type="text"
							class="form-control form-control-sm subtask-new-input"
							placeholder="Add a subtask"
							@keyup.enter="submitNewSubtask"
						/>
						<button
							type="button"
							class="btn btn-sm btn-icon text-muted flex-shrink-0"
							:disabled="!newSubtaskText.trim()"
							@click="submitNewSubtask"
							aria-label="Add subtask"
						>
							<i class="bi bi-plus-lg"></i>
						</button>
					</div>
				</div>
			</template>
		</div>
		<template v-if="!isEditing && !selectMode">
			<div class="dropdown flex-shrink-0">
				<button
					type="button"
					class="btn btn-sm priority-badge"
					:class="`badge-${PRIORITIES[todo.priority || 'medium'].badge}`"
					data-bs-toggle="dropdown"
					aria-expanded="false"
				>
					{{ PRIORITIES[todo.priority || 'medium'].label }}
				</button>
				<ul class="dropdown-menu dropdown-menu-end">
					<li v-for="key in PRIORITY_ORDER" :key="key">
						<button
							type="button"
							class="dropdown-item d-flex align-items-center gap-2"
							@click="emit('set-priority', todo.id, key)"
						>
							<span class="priority-dot" :style="{ background: PRIORITIES[key].color }"></span>
							{{ PRIORITIES[key].label }}
						</button>
					</li>
				</ul>
			</div>
			<button type="button" class="btn btn-sm btn-icon text-muted" @click="startEdit" aria-label="Edit todo">
				<i class="bi bi-pencil"></i>
			</button>
			<button
				type="button"
				class="btn btn-sm btn-icon text-muted"
				@click="$emit('remove', todo.id)"
				aria-label="Delete todo"
			>
				<i class="bi bi-trash3"></i>
			</button>
		</template>
	</li>
</template>

<style scoped>
.todo-item {
	padding: 12px 14px;
	border-radius: 12px;
	background: var(--surface-alt);
	border-inline-start: 4px solid transparent;
	transition: background 0.2s ease;
}
.todo-item:hover {
	background: var(--surface-alt-hover);
}

.priority-badge {
	font-weight: 600;
	font-size: 0.72rem;
	padding: 3px 10px;
	border-radius: 999px;
	border: none;
}
.badge-danger {
	background: var(--danger-bg);
	color: var(--danger);
}
.badge-warning {
	background: var(--warning-bg);
	color: var(--warning);
}
.badge-success {
	background: var(--success-bg);
	color: var(--success);
}

.priority-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	display: inline-block;
}

.todo-content {
	min-width: 0;
}

.todo-text {
	word-break: break-word;
	transition: color 0.2s ease;
}

.todo-item-done .todo-text {
	text-decoration: line-through;
	color: var(--text-done);
}

.todo-meta {
	margin-top: 2px;
	font-size: 0.72rem;
}

.todo-edit-input {
	background: var(--surface);
	border-color: var(--accent);
	color: inherit;
}
.todo-edit-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.todo-due-row {
	margin-top: 4px;
}

.due-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border: none;
	border-radius: 999px;
	padding: 2px 8px;
	font-size: 0.7rem;
	font-weight: 600;
	cursor: pointer;
	background: var(--surface-alt-hover);
	color: var(--text-done);
}
.due-badge:hover {
	filter: brightness(0.96);
}

.due-empty {
	background: transparent;
	border: 1px dashed var(--border);
	color: var(--text-done);
	opacity: 0.6;
}
.due-empty:hover {
	opacity: 1;
}

.due-overdue {
	background: var(--danger-bg);
	color: var(--danger);
}
.due-upcoming {
	background: var(--warning-bg);
	color: var(--warning);
}
.due-done {
	text-decoration: line-through;
}

.due-edit {
	margin-top: 4px;
}
.due-edit-input {
	max-width: 160px;
	background: var(--surface);
	border-color: var(--accent);
	color: inherit;
}
.due-edit-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}
.due-edit-time-input {
	max-width: 110px;
	background: var(--surface);
	border-color: var(--accent);
	color: inherit;
}
.due-edit-time-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}
.due-clear {
	font-size: 0.72rem;
	color: var(--danger);
	text-decoration: none;
}
.due-clear:hover {
	text-decoration: underline;
}

.todo-notes-row {
	margin-top: 4px;
}

.notes-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	max-width: 100%;
	border: none;
	border-radius: 999px;
	padding: 2px 8px;
	font-size: 0.7rem;
	font-weight: 500;
	cursor: pointer;
	background: var(--surface-alt-hover);
	color: var(--text-done);
}
.notes-badge:hover {
	filter: brightness(0.96);
}
.notes-empty {
	background: transparent;
	border: 1px dashed var(--border);
	opacity: 0.6;
}
.notes-empty:hover {
	opacity: 1;
}
.notes-preview {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 220px;
}

.notes-edit {
	margin-top: 4px;
}
.notes-edit-input {
	background: var(--surface);
	border-color: var(--accent);
	color: inherit;
	resize: vertical;
}
.notes-edit-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.todo-tags-row {
	margin-top: 4px;
}

.tag-chip {
	display: inline-flex;
	align-items: center;
	gap: 3px;
	background: var(--accent-soft);
	color: var(--accent-strong);
	border-radius: 999px;
	padding: 2px 4px 2px 8px;
	font-size: 0.68rem;
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

.tag-add-btn {
	display: inline-flex;
	align-items: center;
	border: 1px dashed var(--border);
	border-radius: 999px;
	background: transparent;
	color: var(--text-done);
	opacity: 0.6;
	padding: 2px 8px;
	font-size: 0.7rem;
	font-weight: 500;
}
.tag-add-btn:hover {
	opacity: 1;
}

.tag-new-input {
	border: 1px solid var(--accent);
	border-radius: 999px;
	background: var(--surface);
	color: inherit;
	padding: 2px 8px;
	font-size: 0.7rem;
	width: 90px;
	outline: none;
}

.todo-subtasks-row {
	margin-top: 4px;
}

.subtasks-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border: none;
	border-radius: 999px;
	padding: 2px 8px;
	font-size: 0.7rem;
	font-weight: 500;
	cursor: pointer;
	background: var(--surface-alt-hover);
	color: var(--text-done);
}
.subtasks-badge:hover {
	filter: brightness(0.96);
}
.subtasks-empty {
	background: transparent;
	border: 1px dashed var(--border);
	opacity: 0.6;
}
.subtasks-empty:hover {
	opacity: 1;
}

.subtasks-panel {
	margin-top: 6px;
	border-radius: 12px;
	background: var(--surface);
	border: 1px solid var(--border);
	padding: 8px;
}

.subtasks-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.subtask-check {
	position: relative;
	display: inline-flex;
	cursor: pointer;
}
.subtask-check input {
	position: absolute;
	opacity: 0;
	width: 100%;
	height: 100%;
	margin: 0;
	cursor: pointer;
}
.subtask-check-box {
	width: 18px;
	height: 18px;
	border-radius: 6px;
	border: 2px solid var(--checkbox-border);
	display: flex;
	align-items: center;
	justify-content: center;
	color: transparent;
	transition: all 0.15s ease;
	background: var(--checkbox-bg);
}
.subtask-check.checked .subtask-check-box {
	background: var(--accent);
	border-color: var(--accent);
	color: var(--accent-contrast);
}
.subtask-check-box i {
	font-size: 0.7rem;
}

.subtask-text {
	font-size: 0.85rem;
	word-break: break-word;
}
.subtask-done {
	text-decoration: line-through;
	color: var(--text-done);
}

.subtask-edit-input {
	background: var(--surface);
	border-color: var(--accent);
	color: inherit;
}
.subtask-edit-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.subtask-new-input {
	background: var(--surface-alt);
	border-color: var(--border);
	color: inherit;
}
.subtask-new-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.todo-check {
	position: relative;
	display: inline-flex;
	cursor: pointer;
}
.todo-check input {
	position: absolute;
	opacity: 0;
	width: 100%;
	height: 100%;
	margin: 0;
	cursor: pointer;
}
.todo-check-box {
	width: 24px;
	height: 24px;
	border-radius: 8px;
	border: 2px solid var(--checkbox-border);
	display: flex;
	align-items: center;
	justify-content: center;
	color: transparent;
	transition: all 0.15s ease;
	background: var(--checkbox-bg);
}
.todo-check.checked .todo-check-box {
	background: var(--accent);
	border-color: var(--accent);
	color: var(--accent-contrast);
}
.todo-check-box i {
	font-size: 0.9rem;
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
