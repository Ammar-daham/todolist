<script setup>
import { watch } from 'vue'

const props = defineProps({
	// { type: 'undo' | 'redo', description: string } | null
	action: { type: Object, default: null },
})
const emit = defineEmits(['dismiss', 'undo', 'redo'])

let hideTimer = null
watch(
	() => props.action,
	(value) => {
		if (hideTimer) clearTimeout(hideTimer)
		if (value) hideTimer = setTimeout(() => emit('dismiss'), 5000)
	}
)
</script>

<template>
	<transition name="toast-fade">
		<div v-if="action" class="undo-toast d-flex align-items-center gap-2" role="status">
			<i class="bi flex-shrink-0" :class="action.type === 'undo' ? 'bi-arrow-counterclockwise' : 'bi-arrow-clockwise'"></i>
			<span class="flex-grow-1 undo-toast-body">
				{{ action.type === 'undo' ? 'Undid' : 'Redid' }}: {{ action.description }}
			</span>
			<button
				type="button"
				class="btn-undo-toast-action"
				@click="$emit(action.type === 'undo' ? 'redo' : 'undo')"
			>
				{{ action.type === 'undo' ? 'Redo' : 'Undo' }}
			</button>
			<button type="button" class="btn-close-toast" @click="$emit('dismiss')" aria-label="Dismiss">
				<i class="bi bi-x-lg"></i>
			</button>
		</div>
	</transition>
</template>

<style scoped>
.undo-toast {
	position: fixed;
	/* Sits above the due-alert toast's slot so the two can never overlap if
	   both happen to be showing at once. */
	bottom: 84px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1080;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 10px 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
	max-width: 340px;
	width: calc(100% - 32px);
}

.undo-toast i.bi-arrow-counterclockwise,
.undo-toast i.bi-arrow-clockwise {
	color: var(--accent);
	font-size: 1.05rem;
}

.undo-toast-body {
	font-size: 0.82rem;
	word-break: break-word;
	min-width: 0;
}

.btn-undo-toast-action {
	flex-shrink: 0;
	border: none;
	background: var(--accent-soft);
	color: var(--accent-strong);
	border-radius: 8px;
	padding: 0.2rem 0.6rem;
	font-size: 0.78rem;
	font-weight: 700;
}
.btn-undo-toast-action:hover {
	background: var(--accent);
	color: var(--accent-contrast);
}

.btn-close-toast {
	border: none;
	background: transparent;
	color: var(--text-done);
	padding: 0;
	line-height: 1;
	flex-shrink: 0;
}
.btn-close-toast:hover {
	color: var(--danger);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
	opacity: 0;
	transform: translate(-50%, 8px);
}
</style>
