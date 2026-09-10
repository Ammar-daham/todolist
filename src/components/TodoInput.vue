<script setup>
import { ref } from 'vue'
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'

const emit = defineEmits(['add'])

const text = ref('')
const priority = ref('medium')

function submit() {
	if (!text.value.trim()) return
	emit('add', text.value, priority.value)
	text.value = ''
	priority.value = 'medium'
}
</script>

<template>
	<form class="input-group input-group-lg mb-4 todo-input-group" @submit.prevent="submit">
		<span class="input-group-text border-end-0">
			<i class="bi bi-plus-lg text-muted"></i>
		</span>
		<input
			v-model="text"
			type="text"
			class="form-control border-start-0 ps-0"
			placeholder="What needs to be done?"
		/>
		<select v-model="priority" class="form-select flex-grow-0 w-auto priority-select" aria-label="Priority">
			<option v-for="key in PRIORITY_ORDER" :key="key" :value="key">{{ PRIORITIES[key].label }}</option>
		</select>
		<button class="btn btn-accent px-4" type="submit" :disabled="!text.trim()">
			Add
		</button>
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
</style>
