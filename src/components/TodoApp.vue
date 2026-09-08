<script setup>
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'todo-app.todos'

const todos = ref(loadTodos())
const newTodo = ref('')
const filter = ref('all')

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

watch(
  todos,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true }
)

function addTodo() {
  const text = newTodo.value.trim()
  if (!text) return
  todos.value.push({ id: Date.now(), text, done: false })
  newTodo.value = ''
}

function removeTodo(id) {
  todos.value = todos.value.filter((todo) => todo.id !== id)
}

function clearCompleted() {
  todos.value = todos.value.filter((todo) => !todo.done)
}

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'completed') return todos.value.filter((t) => t.done)
  return todos.value
})

const remainingCount = computed(() => todos.value.filter((t) => !t.done).length)
</script>

<template>
  <div class="container py-5" style="max-width: 600px">
    <h1 class="text-center mb-4">Todo App</h1>

    <form class="input-group mb-4" @submit.prevent="addTodo">
      <input
        v-model="newTodo"
        type="text"
        class="form-control"
        placeholder="What needs to be done?"
      />
      <button class="btn btn-primary" type="submit">Add</button>
    </form>

    <div v-if="todos.length" class="d-flex justify-content-between align-items-center mb-3">
      <div class="btn-group btn-group-sm" role="group">
        <button
          type="button"
          class="btn"
          :class="filter === 'all' ? 'btn-primary' : 'btn-outline-primary'"
          @click="filter = 'all'"
        >
          All
        </button>
        <button
          type="button"
          class="btn"
          :class="filter === 'active' ? 'btn-primary' : 'btn-outline-primary'"
          @click="filter = 'active'"
        >
          Active
        </button>
        <button
          type="button"
          class="btn"
          :class="filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'"
          @click="filter = 'completed'"
        >
          Completed
        </button>
      </div>
      <span class="text-muted small">{{ remainingCount }} left</span>
    </div>

    <ul class="list-group mb-3">
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="list-group-item d-flex align-items-center"
      >
        <input
          class="form-check-input me-2"
          type="checkbox"
          v-model="todo.done"
        />
        <span class="flex-grow-1" :class="{ 'text-decoration-line-through text-muted': todo.done }">
          {{ todo.text }}
        </span>
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          @click="removeTodo(todo.id)"
          aria-label="Delete todo"
        >
          &times;
        </button>
      </li>
      <li v-if="!filteredTodos.length" class="list-group-item text-center text-muted">
        Nothing to show
      </li>
    </ul>

    <div v-if="todos.length" class="text-end">
      <button
        type="button"
        class="btn btn-sm btn-link text-muted"
        @click="clearCompleted"
      >
        Clear completed
      </button>
    </div>
  </div>
</template>
