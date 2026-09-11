<script setup>
defineProps({
	modelValue: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>

<template>
	<div class="input-group input-group-sm todo-search">
		<span class="input-group-text border-end-0">
			<i class="bi bi-search text-muted"></i>
		</span>
		<input
			:value="modelValue"
			type="text"
			class="form-control border-start-0"
			:class="{ 'border-end-0': modelValue }"
			placeholder="Search tasks..."
			@input="$emit('update:modelValue', $event.target.value)"
		/>
		<button
			v-if="modelValue"
			type="button"
			class="btn search-clear"
			aria-label="Clear search"
			@click="$emit('update:modelValue', '')"
		>
			<i class="bi bi-x-lg"></i>
		</button>
	</div>
</template>

<style scoped>
.todo-search .form-control:focus {
	box-shadow: none;
}
.todo-search .input-group-text,
.todo-search .form-control,
.todo-search .search-clear {
	border-color: var(--border);
	background: var(--surface);
}

.search-clear {
	color: var(--text-done);
}
.search-clear:hover {
	color: var(--danger);
}
</style>
