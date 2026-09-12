<script setup>
import { watch } from 'vue'

const props = defineProps({
	toast: { type: Object, default: null },
})
const emit = defineEmits(['dismiss'])

let hideTimer = null
watch(
	() => props.toast,
	(value) => {
		if (hideTimer) clearTimeout(hideTimer)
		if (value) hideTimer = setTimeout(() => emit('dismiss'), 6000)
	}
)
</script>

<template>
	<transition name="toast-fade">
		<div v-if="toast" class="due-toast d-flex align-items-start gap-2" role="alert">
			<i class="bi bi-alarm flex-shrink-0"></i>
			<div class="flex-grow-1 min-w-0">
				<div class="due-toast-title">{{ toast.title }}</div>
				<div class="due-toast-body">{{ toast.body }}</div>
			</div>
			<button type="button" class="btn-close-toast" @click="$emit('dismiss')" aria-label="Dismiss">
				<i class="bi bi-x-lg"></i>
			</button>
		</div>
	</transition>
</template>

<style scoped>
.due-toast {
	position: fixed;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1080;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 12px 14px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
	max-width: 340px;
	width: calc(100% - 32px);
}

.min-w-0 {
	min-width: 0;
}

.due-toast i.bi-alarm {
	color: var(--accent);
	font-size: 1.1rem;
	margin-top: 2px;
}

.due-toast-title {
	font-weight: 600;
	font-size: 0.85rem;
}

.due-toast-body {
	font-size: 0.85rem;
	color: var(--text-done);
	word-break: break-word;
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
