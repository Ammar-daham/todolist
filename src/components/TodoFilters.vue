<script setup>
defineProps({
	modelValue: { type: String, required: true },
})
defineEmits(['update:modelValue'])

const filters = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active' },
	{ key: 'completed', label: 'Completed' },
	{ key: 'removed', label: 'Removed' },
]
</script>

<template>
	<div class="btn-group w-100 mb-3 filter-group" role="group">
		<button
			v-for="f in filters"
			:key="f.key"
			type="button"
			class="btn"
			:class="modelValue === f.key ? 'btn-accent' : 'btn-surface text-muted'"
			@click="$emit('update:modelValue', f.key)"
		>
			{{ f.label }}
		</button>
	</div>
</template>

<style scoped>
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

.btn-surface {
	background: var(--surface-alt);
	border-color: var(--surface-alt);
}
.btn-surface:hover {
	background: var(--surface-alt-hover);
	border-color: var(--surface-alt-hover);
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
</style>
