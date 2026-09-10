import { ref, computed, watch } from 'vue'
import { PRIORITY_ORDER } from '../constants/priorities'

const STORAGE_KEY = 'todo-app.todos'

function loadTodos() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		const parsed = raw ? JSON.parse(raw) : []
		return parsed.map((todo) => ({
			completedAt: null,
			removedAt: null,
			...todo,
			createdAt: todo.createdAt ?? Date.now(),
		}))
	} catch {
		return []
	}
}

export function useTodos() {
	const todos = ref(loadTodos())
	const filter = ref('all')

	watch(
		todos,
		(value) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
		},
		{ deep: true }
	)

	function addTodo(text, priority) {
		const trimmed = text.trim()
		if (!trimmed) return
		todos.value.push({
			id: Date.now(),
			text: trimmed,
			done: false,
			priority,
			createdAt: Date.now(),
			completedAt: null,
			removedAt: null,
		})
	}

	function toggleTodo(id) {
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		todo.done = !todo.done
		todo.completedAt = todo.done ? Date.now() : null
	}

	function removeTodo(id) {
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.removedAt = Date.now()
	}

	function restoreTodo(id) {
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.removedAt = null
	}

	function deleteTodoPermanently(id) {
		todos.value = todos.value.filter((todo) => todo.id !== id)
	}

	function clearCompleted() {
		const now = Date.now()
		todos.value.forEach((todo) => {
			if (todo.done && !todo.removedAt) todo.removedAt = now
		})
	}

	const activeTodos = computed(() => todos.value.filter((t) => !t.removedAt))

	const filteredTodos = computed(() => {
		let list = activeTodos.value
		if (filter.value === 'active') list = list.filter((t) => !t.done)
		if (filter.value === 'completed') list = list.filter((t) => t.done)
		return [...list].sort(
			(a, b) => PRIORITY_ORDER.indexOf(a.priority || 'medium') - PRIORITY_ORDER.indexOf(b.priority || 'medium')
		)
	})

	const removedTodos = computed(() =>
		[...todos.value].filter((t) => t.removedAt).sort((a, b) => b.removedAt - a.removedAt)
	)

	const allTodos = computed(() => todos.value)

	const totalCount = computed(() => activeTodos.value.length)
	const remainingCount = computed(() => activeTodos.value.filter((t) => !t.done).length)
	const progress = computed(() =>
		totalCount.value ? Math.round(((totalCount.value - remainingCount.value) / totalCount.value) * 100) : 0
	)

	return {
		filter,
		filteredTodos,
		removedTodos,
		allTodos,
		addTodo,
		toggleTodo,
		removeTodo,
		restoreTodo,
		deleteTodoPermanently,
		clearCompleted,
		totalCount,
		remainingCount,
		progress,
	}
}
