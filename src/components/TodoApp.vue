<script setup>
import { useTodos } from '../composables/useTodos'
import { useTheme } from '../composables/useTheme'
import ThemeToggle from './ThemeToggle.vue'
import TodoHeader from './TodoHeader.vue'
import TodoInput from './TodoInput.vue'
import TodoProgress from './TodoProgress.vue'
import TodoFilters from './TodoFilters.vue'
import TodoList from './TodoList.vue'

const {
	filter,
	filteredTodos,
	addTodo,
	removeTodo,
	clearCompleted,
	totalCount,
	remainingCount,
	progress,
} = useTodos()

const { isDark, toggleTheme } = useTheme()
</script>

<template>
	<div class="d-flex justify-content-center align-items-start align-items-sm-center min-vh-100 py-5 px-3">
		<div class="todo-card card border-0 shadow-lg w-100">
			<div class="card-body p-3 p-sm-4 position-relative">
				<ThemeToggle :is-dark="isDark" @toggle="toggleTheme" />

				<TodoHeader />

				<TodoInput @add="addTodo" />

				<template v-if="totalCount">
					<TodoProgress :remaining-count="remainingCount" :total-count="totalCount" :progress="progress" />
					<TodoFilters v-model="filter" />
				</template>

				<TodoList
					:todos="filteredTodos"
					:total-count="totalCount"
					:remaining-count="remainingCount"
					@remove="removeTodo"
					@clear-completed="clearCompleted"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped>
.todo-card {
	max-width: 560px;
	border-radius: 20px;
	background: var(--surface);
	transition: background 0.3s ease;
}
</style>
