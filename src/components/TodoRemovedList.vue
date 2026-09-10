<script setup>
import RemovedTodoItem from './RemovedTodoItem.vue'

defineProps({
	todos: { type: Array, required: true },
})
defineEmits(['restore', 'delete'])
</script>

<template>
	<transition-group tag="ul" name="todo-list" class="list-unstyled mb-0 todo-list">
		<RemovedTodoItem
			v-for="todo in todos"
			:key="todo.id"
			:todo="todo"
			@restore="$emit('restore', $event)"
			@delete="$emit('delete', $event)"
		/>
	</transition-group>

	<div v-if="!todos.length" class="text-center text-muted py-5">
		<i class="bi bi-trash3 fs-1 d-block mb-2 opacity-50"></i>
		Nothing removed yet.
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
