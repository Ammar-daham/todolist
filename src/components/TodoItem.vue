<script setup>
import { ref, computed, nextTick } from 'vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'
import { formatRelativeTime, formatDueDate, getDueStatus } from '../utils/time'

const props = defineProps({
	todo: { type: Object, required: true },
})
const emit = defineEmits(['toggle', 'edit', 'set-due-date', 'set-priority', 'remove'])

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
const dueInput = ref(null)
const dueStatus = computed(() => getDueStatus(props.todo.dueDate, props.todo.done))

function startEditDue() {
	draftDue.value = props.todo.dueDate || ''
	isEditingDue.value = true
	nextTick(() => dueInput.value?.focus())
}

function saveEditDue() {
	if (!isEditingDue.value) return
	isEditingDue.value = false
	emit('set-due-date', props.todo.id, draftDue.value || null)
}

function cancelEditDue() {
	isEditingDue.value = false
}

function clearDue() {
	isEditingDue.value = false
	emit('set-due-date', props.todo.id, null)
}
</script>

<template>
	<li
		class="todo-item d-flex align-items-center gap-3"
		:class="{ 'todo-item-done': todo.done }"
		:style="{ borderInlineStartColor: PRIORITIES[todo.priority || 'medium'].color }"
	>
		<label class="todo-check flex-shrink-0" :class="{ checked: todo.done }">
			<input type="checkbox" :checked="todo.done" @change="$emit('toggle', todo.id)" />
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
				<span class="todo-text" @dblclick="startEdit">{{ todo.text }}</span>
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
						<i class="bi bi-calendar-event"></i>
						{{ todo.dueDate ? formatDueDate(todo.dueDate) : 'Add due date' }}
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
						@blur="saveEditDue"
					/>
					<button type="button" class="btn btn-sm btn-link p-0 due-clear" @mousedown.prevent="clearDue">Clear</button>
				</div>
			</template>
		</div>
		<template v-if="!isEditing">
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
.due-clear {
	font-size: 0.72rem;
	color: var(--danger);
	text-decoration: none;
}
.due-clear:hover {
	text-decoration: underline;
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
