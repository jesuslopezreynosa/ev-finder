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
html,
body {
    margin: 0;
    padding: 0;
    transition: background-color 0.2s ease, color 0.2s ease;
}

html.dark body {
    background-color: #0f172a;
}
</style>