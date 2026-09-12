<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
	lists: { type: Array, required: true },
	activeListId: { type: String, required: true },
})
const emit = defineEmits(['select', 'add', 'rename', 'remove'])

const activeList = computed(() => props.lists.find((l) => l.id === props.activeListId) ?? props.lists[0])

// Renaming and delete-confirm are both per-row, single-flight states — only
// one list can be mid-edit or mid-confirm at a time, so a plain id is enough
// rather than a Set.
const renamingId = ref(null)
const renameText = ref('')
const renameInput = ref(null)
const confirmingId = ref(null)

// A plain `ref="renameInput"` would collect into an array here since this
// element sits inside the list's v-for — a function ref sidesteps that and
// gives us the single input element directly.
function setRenameInput(el) {
	renameInput.value = el
}

function startRename(list) {
	confirmingId.value = null
	renamingId.value = list.id
	renameText.value = list.name
	nextTick(() => renameInput.value?.focus())
}

function submitRename() {
	if (renamingId.value) emit('rename', renamingId.value, renameText.value)
	renamingId.value = null
}

function cancelRename() {
	renamingId.value = null
}

const newListOpen = ref(false)
const newListName = ref('')
const newListInput = ref(null)

function openNewList() {
	newListOpen.value = true
	nextTick(() => newListInput.value?.focus())
}

function submitNewList() {
	if (!newListName.value.trim()) return
	emit('add', newListName.value)
	newListName.value = ''
	newListOpen.value = false
}
</script>

<template>
	<div class="dropdown list-switcher">
		<button
			type="button"
			class="btn list-switcher-btn"
			data-bs-toggle="dropdown"
			aria-expanded="false"
			aria-label="Switch or manage lists"
		>
			<span class="list-switcher-name text-truncate">{{ activeList?.name }}</span>
			<i class="bi bi-chevron-down list-switcher-caret"></i>
		</button>
		<div class="dropdown-menu list-switcher-menu p-2" @click.stop>
			<div class="list-switcher-items">
				<div v-for="list in lists" :key="list.id" class="list-switcher-row" :class="{ active: list.id === activeListId }">
					<template v-if="renamingId === list.id">
						<form class="flex-grow-1" @submit.prevent="submitRename">
							<input
								:ref="setRenameInput"
								v-model="renameText"
								type="text"
								class="form-control form-control-sm list-rename-input"
								@blur="submitRename"
								@keydown.escape="cancelRename"
							/>
						</form>
					</template>
					<template v-else-if="confirmingId === list.id">
						<span class="flex-grow-1 small list-switcher-confirm">Delete this list and its tasks?</span>
						<button type="button" class="btn btn-sm btn-confirm-delete" @click="$emit('remove', list.id)">Delete</button>
						<button type="button" class="btn btn-sm btn-cancel" @click="confirmingId = null">Cancel</button>
					</template>
					<template v-else>
						<button
							type="button"
							class="list-switcher-select flex-grow-1 d-flex align-items-center gap-2"
							@click="$emit('select', list.id)"
						>
							<i class="bi" :class="list.id === activeListId ? 'bi-check2 text-accent' : 'bi-list-ul'"></i>
							<span class="text-truncate">{{ list.name }}</span>
						</button>
						<div class="list-switcher-actions flex-shrink-0">
							<button type="button" class="btn-icon-sm" aria-label="Rename list" @click="startRename(list)">
								<i class="bi bi-pencil"></i>
							</button>
							<button
								v-if="lists.length > 1"
								type="button"
								class="btn-icon-sm"
								aria-label="Delete list"
								@click="confirmingId = list.id"
							>
								<i class="bi bi-trash3"></i>
							</button>
						</div>
					</template>
				</div>
			</div>

			<hr class="dropdown-divider" />

			<form v-if="newListOpen" class="d-flex gap-2" @submit.prevent="submitNewList">
				<input
					ref="newListInput"
					v-model="newListName"
					type="text"
					class="form-control form-control-sm"
					placeholder="List name"
					@keydown.escape="newListOpen = false"
					@blur="!newListName.trim() && (newListOpen = false)"
				/>
				<button type="submit" class="btn btn-sm btn-accent flex-shrink-0" :disabled="!newListName.trim()">Add</button>
			</form>
			<button v-else type="button" class="list-switcher-new d-flex align-items-center gap-2" @click="openNewList">
				<i class="bi bi-plus-lg"></i>New list
			</button>
		</div>
	</div>
</template>

<style scoped>
.list-switcher-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	background: transparent;
	border: none;
	padding: 0;
	min-width: 0;
	font-size: 1.1rem;
	font-weight: 700;
	color: inherit;
}
.list-switcher-btn:hover .list-switcher-name {
	color: var(--accent);
}

.list-switcher-name {
	min-width: 0;
}

.list-switcher-caret {
	font-size: 0.65rem;
	color: var(--text-done);
	flex-shrink: 0;
}

.list-switcher-menu {
	background: var(--surface);
	border-color: var(--border);
	border-radius: 12px;
	min-width: 230px;
	max-width: 280px;
}

.list-switcher-items {
	max-height: 240px;
	overflow-y: auto;
}

.list-switcher-row {
	display: flex;
	align-items: center;
	gap: 4px;
	border-radius: 8px;
	padding: 2px;
}
.list-switcher-row:hover {
	background: var(--surface-alt-hover);
}
.list-switcher-row.active .list-switcher-select {
	font-weight: 600;
}

.list-switcher-select {
	border: none;
	background: transparent;
	color: inherit;
	padding: 6px 8px;
	border-radius: 8px;
	font-size: 0.9rem;
	min-width: 0;
	text-align: left;
}

.list-switcher-actions {
	display: flex;
	gap: 2px;
}

.btn-icon-sm {
	border: none;
	background: transparent;
	color: var(--text-done);
	width: 26px;
	height: 26px;
	border-radius: 6px;
	font-size: 0.8rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.btn-icon-sm:hover {
	background: var(--surface-alt);
	color: var(--danger);
}

.list-rename-input,
.list-switcher-row .form-control {
	background: var(--surface);
	border-color: var(--accent);
	color: inherit;
}
.list-rename-input:focus {
	box-shadow: none;
}

.list-switcher-confirm {
	color: var(--danger);
	padding-left: 8px;
}

.btn-confirm-delete {
	font-weight: 600;
	font-size: 0.75rem;
	color: #fff;
	background: var(--danger);
	border: 1px solid var(--danger);
	border-radius: 999px;
	padding: 2px 10px;
	flex-shrink: 0;
}
.btn-confirm-delete:hover {
	filter: brightness(0.92);
}

.btn-cancel {
	font-weight: 500;
	font-size: 0.75rem;
	color: var(--text-done);
	background: var(--surface-alt-hover);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 2px 10px;
	flex-shrink: 0;
}
.btn-cancel:hover {
	background: var(--surface-alt);
}

.dropdown-divider {
	border-color: var(--border);
	margin: 8px 4px;
}

.list-switcher-new {
	border: none;
	background: transparent;
	color: var(--accent);
	font-size: 0.9rem;
	font-weight: 500;
	padding: 6px 8px;
	width: 100%;
	border-radius: 8px;
}
.list-switcher-new:hover {
	background: var(--surface-alt-hover);
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
	opacity: 0.6;
}

.text-accent {
	color: var(--accent) !important;
}
</style>
