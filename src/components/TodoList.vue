<script setup>
import TodoItem from './TodoItem.vue'

defineProps({
	todos: { type: Array, required: true },
	totalCount: { type: Number, required: true },
	remainingCount: { type: Number, required: true },
})
defineEmits(['toggle', 'remove', 'clear-completed'])
</script>

<template>
	<transition-group tag="ul" name="todo-list" class="list-unstyled mb-0 todo-list">
		<TodoItem
			v-for="todo in todos"
			:key="todo.id"
			:todo="todo"
			@toggle="$emit('toggle', $event)"
			@remove="$emit('remove', $event)"
		/>
	</transition-group>

	<div v-if="totalCount && !todos.length" class="text-center text-muted py-5">
		<i class="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
		Nothing here yet.
	</div>

	<div v-if="!totalCount" class="text-center text-muted py-5">
		<i class="bi bi-clipboard-check fs-1 d-block mb-2 opacity-50"></i>
		Your list is empty. Add your first task above!
	</div>

	<div v-if="remainingCount !== totalCount" class="text-end mt-3">
		<button type="button" class="btn btn-sm btn-link text-decoration-none text-muted" @click="$emit('clear-completed')">
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
