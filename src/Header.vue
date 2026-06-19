<script setup lang="ts">
const emit = defineEmits<{
    (e: 'change-view', view: string): void;
}>();

defineProps<{
    activeView: string;
}>();
</script>

<template>
    <div class="header-wrapper">
        <button class="logo-btn" :class="{ active: activeView === 'grid' }" @click="emit('change-view', 'grid')"
            aria-label="Return to EV home grid">
            <h2>EV Finder</h2>
        </button>

        <div class="tabs">
            <!-- <button class="default-btn" :class="{ active: activeView === 'ev-terminology' }"
                @click="emit('change-view', 'ev-terminology')">
                EV Terminology
            </button> -->
            <!-- <button class="default-btn" :class="{ active: activeView === 'batteries' }"
                @click="emit('change-view', 'batteries')">
                Batteries
            </button> -->
            <!-- <button class="default-btn" :class="{ active: activeView === 'tips' }" @click="emit('change-view', 'tips')">
                Tips
            </button> -->
            <button class="default-btn" :class="{ active: activeView === 'backstory' }"
                @click="emit('change-view', 'backstory')">
                Backstory
            </button>
        </div>
    </div>
</template>

<style scoped>
.header-wrapper {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo-btn {
    background: transparent;
    border: none;
    padding: 4px 8px;
    margin: 0;
    cursor: pointer;
    text-align: left;
    border-radius: 6px;
    color: #0f172a;
    transition: background-color 0.15s ease-in-out;
}

.logo-btn h2 {
    margin: 0;
    font-size: 1.5rem;
}

.logo-btn:hover {
    background-color: #f1f5f9;
}

html.dark .logo-btn {
    color: #ffffff;
}

html.dark .logo-btn:hover {
    background-color: #1e293b;
}

.tabs {
    display: flex;
    gap: 8px;
}

.default-btn {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 14px;
    border-radius: 6px;
    transition: all 0.15s ease-in-out;
}

.default-btn:hover,
.default-btn.active {
    background-color: #e2e8f0;
    color: #0f172a;
    border-color: #94a3b8;
}

.default-btn.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
}

html.dark .default-btn {
    background-color: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
}

html.dark .default-btn:hover,
html.dark .default-btn.active {
    background-color: #1e293b;
    color: #ffffff;
    border-color: #475569;
}

html.dark .default-btn.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
}
</style>