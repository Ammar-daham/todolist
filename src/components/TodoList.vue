<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'
import TodoBulkBar from './TodoBulkBar.vue'

const props = defineProps({
	todos: { type: Array, required: true },
	totalCount: { type: Number, required: true },
	remainingCount: { type: Number, required: true },
	hasAnyTodos: { type: Boolean, required: true },
	selectMode: { type: Boolean, required: true },
	selectedIds: { type: Array, required: true },
})
const emit = defineEmits([
	'toggle',
	'edit',
	'set-due-date',
	'set-priority',
	'remove',
	'clear-completed',
	'toggle-select-mode',
	'toggle-select',
	'select-all',
	'clear-selection',
	'bulk-complete',
	'bulk-set-priority',
	'bulk-delete',
])

// "Select all" only ever covers what's currently rendered (i.e. matches the
// active filters), so this stays in sync with that rather than every todo.
const allSelected = computed(() => props.todos.length > 0 && props.selectedIds.length === props.todos.length)

function handleToggleSelectAll() {
	emit(allSelected.value ? 'clear-selection' : 'select-all')
}
</script>

<template>
	<transition-group tag="ul" name="todo-list" class="list-unstyled mb-0 todo-list">
		<TodoItem
			v-for="todo in todos"
			:key="todo.id"
			:todo="todo"
			:select-mode="selectMode"
			:selected="selectedIds.includes(todo.id)"
			@toggle="$emit('toggle', $event)"
			@edit="(id, text) => $emit('edit', id, text)"
			@set-due-date="(id, date) => $emit('set-due-date', id, date)"
			@set-priority="(id, priority) => $emit('set-priority', id, priority)"
			@remove="$emit('remove', $event)"
			@toggle-select="$emit('toggle-select', $event)"
		/>
	</transition-group>

	<div v-if="!hasAnyTodos" class="text-center text-muted py-5">
		<i class="bi bi-clipboard-check fs-1 d-block mb-2 opacity-50"></i>
		Your list is empty. Add your first task above!
	</div>

	<div v-else-if="!totalCount" class="text-center text-muted py-5">
		<i class="bi bi-search fs-1 d-block mb-2 opacity-50"></i>
		No tasks match your search or filters.
	</div>

	<div v-else-if="!todos.length" class="text-center text-muted py-5">
		<i class="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
		Nothing here yet.
	</div>

	<TodoBulkBar
		v-if="selectMode"
		class="mt-3"
		:selected-count="selectedIds.length"
		:all-selected="allSelected"
		@toggle-select-all="handleToggleSelectAll"
		@complete="$emit('bulk-complete')"
		@set-priority="(priority) => $emit('bulk-set-priority', priority)"
		@delete="$emit('bulk-delete')"
		@cancel="$emit('toggle-select-mode')"
	/>
	<div v-else-if="totalCount" class="d-flex justify-content-end align-items-center gap-3 mt-3">
		<button
			type="button"
			class="btn btn-sm btn-link text-decoration-none text-muted"
			@click="$emit('toggle-select-mode')"
		>
			<i class="bi bi-check2-square me-1"></i>Select
		</button>
		<button
			v-if="remainingCount !== totalCount"
			type="button"
			class="btn btn-sm btn-link text-decoration-none text-muted"
			@click="$emit('clear-completed')"
		>
			<i class="bi bi-x-circle me-1"></i>Clear completed
		</button>
	</div>
</template>

<style scoped>
.todo-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 360px;
	overflow-y: auto;
}

.todo-list-move,
.todo-list-enter-active,
.todo-list-leave-active {
	transition: all 0.25s ease;
}
.todo-list-enter-from {
	opacity: 0;
	transform: translateY(-8px);
}
.todo-list-leave-to {
	opacity: 0;
	transform: translateX(12px);
}
.todo-list-leave-active {
	position: absolute;
	width: calc(100% - 28px);
}
</style>
