<script setup>
import { ref } from 'vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'

const emit = defineEmits(['add'])

const text = ref('')
const priority = ref('medium')
const dueDate = ref('')
const dueTime = ref('')

function submit() {
	if (!text.value.trim()) return
	emit('add', text.value, priority.value, dueDate.value || null, dueDate.value ? dueTime.value || null : null)
	text.value = ''
	priority.value = 'medium'
	dueDate.value = ''
	dueTime.value = ''
}

function clearDue() {
	dueDate.value = ''
	dueTime.value = ''
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

		<div class="todo-input-controls d-flex flex-wrap align-items-center gap-2">
			<select v-model="priority" class="form-select form-select-sm w-auto priority-select" aria-label="Priority">
				<option v-for="key in PRIORITY_ORDER" :key="key" :value="key">{{ PRIORITIES[key].label }}</option>
			</select>

			<div class="due-date-row d-flex align-items-center gap-2">
				<i class="bi bi-calendar-event text-muted"></i>
				<input v-model="dueDate" type="date" class="form-control form-control-sm due-date-input" aria-label="Due date (optional)" />
				<input
					v-if="dueDate"
					v-model="dueTime"
					type="time"
					class="form-control form-control-sm due-time-input"
					aria-label="Due time (optional)"
				/>
				<button v-if="dueDate" type="button" class="btn btn-sm btn-link text-muted p-0 due-date-clear" @click="clearDue">
					Clear
				</button>
			</div>

			<button class="btn btn-accent px-4 ms-auto" type="submit" :disabled="!text.trim()">
				Add
			</button>
		</div>
	</form>
</template>

<style scoped>
.todo-input-group .form-control:focus {
	box-shadow: none;
}

.todo-input-group .input-group-text,
.todo-input-group .form-control,
.priority-select {
	border-color: var(--border);
	background: var(--surface);
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

.due-date-input {
	max-width: 150px;
	background: var(--surface);
	border-color: var(--border);
	color: inherit;
}
.due-date-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.due-time-input {
	max-width: 110px;
	background: var(--surface);
	border-color: var(--border);
	color: inherit;
}
.due-time-input:focus {
	box-shadow: none;
	border-color: var(--accent);
}

.due-date-clear {
	font-size: 0.8rem;
	text-decoration: none;
}
.due-date-clear:hover {
	text-decoration: underline;
}
</style>
