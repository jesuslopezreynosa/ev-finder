<script setup lang="ts">
import { ref } from 'vue';

import EvData from '@/assets/ev-specs.json';
import { useTheme } from '@/composables/useTheme';
import VehicleGrid, { type Vehicle } from './VehicleGrid.vue';
import Header from './Header.vue';
import ArticleView from './ArticleView.vue';

useTheme();

// Track which layout or article is currently active
const currentView = ref<string>('grid');

function setView(viewName: string): void {
    currentView.value = viewName;
}

// Sort by these parameters in order: (Manufacturer, Model, Model Year)
const SortedEvData: Vehicle[] = [...EvData].sort((a, b) => {
    return (
        String(a.manufacturer).trim().localeCompare(String(b.manufacturer).trim(), undefined, { numeric: true, sensitivity: 'base' }) ||
        String(a.model).trim().localeCompare(String(b.model).trim(), undefined, { numeric: true, sensitivity: 'base' }) ||
        a.modelYear - b.modelYear
    );
});
</script>

<template>
    <Header :active-view="currentView" @change-view="setView" />

    <VehicleGrid v-if="currentView === 'grid'" :vehicles="SortedEvData" />

    <ArticleView v-else :title="currentView" />
</template>

<style>
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-card: var(--bg-primary);
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --accent-primary: #2563eb;
    --accent-hover: #1d4ed8;
    --border-color: #e2e8f0;
}

html.dark {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-card: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent-primary: #38bdf8;
    --accent-hover: #0ea5e9;
    --border-color: #334155;
}

html,
body {
    margin: 0;
    padding: 0;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.2s ease, color 0.2s ease;
}
</style>