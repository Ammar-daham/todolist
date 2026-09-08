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

const filters = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'completed') return todos.value.filter((t) => t.done)
  return todos.value
})

const remainingCount = computed(() => todos.value.filter((t) => !t.done).length)
const totalCount = computed(() => todos.value.length)
const progress = computed(() =>
  totalCount.value ? Math.round(((totalCount.value - remainingCount.value) / totalCount.value) * 100) : 0
)
</script>

<template>
  <div class="d-flex justify-content-center align-items-start align-items-sm-center min-vh-100 py-5 px-3">
    <div class="todo-card card border-0 shadow-lg w-100">
      <div class="card-body p-4 p-sm-5">
        <div class="text-center mb-4">
          <div class="todo-icon mb-2">
            <i class="bi bi-check2-square"></i>
          </div>
          <h1 class="h3 fw-bold mb-1">My Tasks</h1>
          <p class="text-muted mb-0">Stay organized, stay focused.</p>
        </div>

        <form class="input-group input-group-lg mb-4 todo-input-group" @submit.prevent="addTodo">
          <span class="input-group-text bg-white border-end-0">
            <i class="bi bi-plus-lg text-muted"></i>
          </span>
          <input
            v-model="newTodo"
            type="text"
            class="form-control border-start-0 ps-0"
            placeholder="What needs to be done?"
          />
          <button class="btn btn-primary px-4" type="submit" :disabled="!newTodo.trim()">
            Add
          </button>
        </form>

        <template v-if="totalCount">
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small text-muted">
                <strong class="text-dark">{{ remainingCount }}</strong> of {{ totalCount }} remaining
              </span>
              <span class="small fw-semibold text-primary">{{ progress }}%</span>
            </div>
            <div class="progress" style="height: 8px">
              <div
                class="progress-bar bg-primary"
                role="progressbar"
                :style="{ width: progress + '%' }"
                :aria-valuenow="progress"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>

          <div class="btn-group w-100 mb-3 filter-group" role="group">
            <button
              v-for="f in filters"
              :key="f.key"
              type="button"
              class="btn"
              :class="filter === f.key ? 'btn-primary' : 'btn-light text-muted'"
              @click="filter = f.key"
            >
              {{ f.label }}
            </button>
          </div>
        </template>

        <transition-group tag="ul" name="todo-list" class="list-unstyled mb-0 todo-list">
          <li
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="todo-item d-flex align-items-center gap-3"
            :class="{ 'todo-item-done': todo.done }"
          >
            <label class="todo-check flex-shrink-0" :class="{ checked: todo.done }">
              <input type="checkbox" v-model="todo.done" />
              <span class="todo-check-box">
                <i class="bi bi-check-lg"></i>
              </span>
            </label>
            <span class="flex-grow-1 todo-text">{{ todo.text }}</span>
            <button
              type="button"
              class="btn btn-sm btn-icon text-muted"
              @click="removeTodo(todo.id)"
              aria-label="Delete todo"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </li>
        </transition-group>

        <div v-if="totalCount && !filteredTodos.length" class="text-center text-muted py-5">
          <i class="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
          Nothing here yet.
        </div>

        <div v-if="!totalCount" class="text-center text-muted py-5">
          <i class="bi bi-clipboard-check fs-1 d-block mb-2 opacity-50"></i>
          Your list is empty. Add your first task above!
        </div>

        <div v-if="remainingCount !== totalCount" class="text-end mt-3">
          <button type="button" class="btn btn-sm btn-link text-decoration-none text-muted" @click="clearCompleted">
            <i class="bi bi-x-circle me-1"></i>Clear completed
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-card {
  max-width: 560px;
  border-radius: 20px;
}

.todo-icon {
  width: 56px;
  height: 56px;
  margin-inline: auto;
  border-radius: 16px;
  background: linear-gradient(135deg, #6a5cf5, #a78bfa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
}

.todo-input-group .form-control:focus {
  box-shadow: none;
}

.todo-input-group .input-group-text,
.todo-input-group .form-control {
  border-color: #dfe1e8;
}

.filter-group .btn {
  border-radius: 10px !important;
  margin: 0 3px;
  font-weight: 500;
  font-size: 0.9rem;
}
.filter-group .btn:first-child {
  margin-left: 0;
}
.filter-group .btn:last-child {
  margin-right: 0;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.todo-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8f9fc;
  transition: background 0.2s ease;
}
.todo-item:hover {
  background: #f0f1fa;
}

.todo-text {
  word-break: break-word;
  transition: color 0.2s ease;
}

.todo-item-done .todo-text {
  text-decoration: line-through;
  color: #adb5bd;
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
  border: 2px solid #ced4da;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.15s ease;
  background: #fff;
}
.todo-check.checked .todo-check-box {
  background: #6a5cf5;
  border-color: #6a5cf5;
  color: #fff;
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
  color: #dc3545 !important;
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
