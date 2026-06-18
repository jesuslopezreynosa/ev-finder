<script setup lang="ts">
import { onMounted, ref } from 'vue';

import EvData from '@/assets/ev-specs.json';

import VehicleGrid from './VehicleGrid.vue';
import Header from './Header.vue';
import ArticleView from './ArticleView.vue';

// Track which layout or article is currently active
const currentView = ref<string>('grid');

function setView(viewName: string): void {
  currentView.value = viewName;
}

onMounted(() => {
  const isDark = localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
</script>

<template>
  <Header :active-view="currentView" @change-view="setView" />

  <VehicleGrid v-if="currentView === 'grid'" :vehicles="EvData" />

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