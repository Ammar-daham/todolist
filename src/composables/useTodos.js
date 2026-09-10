import { ref, computed, watch } from 'vue'
import { PRIORITY_ORDER } from '../constants/priorities'

const STORAGE_KEY = 'todo-app.todos'

function loadTodos() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? JSON.parse(raw) : []
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
		todos.value.push({ id: Date.now(), text: trimmed, done: false, priority })
	}

	function removeTodo(id) {
		todos.value = todos.value.filter((todo) => todo.id !== id)
	}

	function clearCompleted() {
		todos.value = todos.value.filter((todo) => !todo.done)
	}

	const filteredTodos = computed(() => {
		let list = todos.value
		if (filter.value === 'active') list = list.filter((t) => !t.done)
		if (filter.value === 'completed') list = list.filter((t) => t.done)
		return [...list].sort(
			(a, b) => PRIORITY_ORDER.indexOf(a.priority || 'medium') - PRIORITY_ORDER.indexOf(b.priority || 'medium')
		)
	})

	const totalCount = computed(() => todos.value.length)
	const remainingCount = computed(() => todos.value.filter((t) => !t.done).length)
	const progress = computed(() =>
		totalCount.value ? Math.round(((totalCount.value - remainingCount.value) / totalCount.value) * 100) : 0
	)

	return {
		filter,
		filteredTodos,
		addTodo,
		removeTodo,
		clearCompleted,
		totalCount,
		remainingCount,
		progress,
	}
}
