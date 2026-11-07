<script setup lang="ts">
import { ref } from 'vue';

import EvData from '@/assets/ev-specs.json';
import { useTheme } from '@/composables/useTheme';
import VehicleGrid, { type Vehicle } from './components/VehicleGrid.vue';
import Header from './components/Header.vue';
import ArticleView from './components/ArticleView.vue';

useTheme();

const currentView = ref<string>('grid');

function setView(viewName: string): void {
    currentView.value = viewName;
}

const SortedEvData: Vehicle[] = [...EvData].sort((a, b) => {
    return (
        String(a.manufacturer).trim().localeCompare(String(b.manufacturer).trim(), undefined, { numeric: true, sensitivity: 'base' }) ||
        String(a.model).trim().localeCompare(String(b.model).trim(), undefined, { numeric: true, sensitivity: 'base' }) ||
        Number(a.modelYear) - Number(b.modelYear)
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
    --bg-primary: #eef2f6;
    --bg-card: #fcfdfd;
    --text-primary: #1e293b;
    --text-secondary: #5a6a80;
    --accent-primary: #0284c7;
    --accent-hover: #0369a1;
    --border-color: #d8e1ea;
}

html.dark {
    --bg-primary: #0b132b;
    --bg-card: #1c2541;
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
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>