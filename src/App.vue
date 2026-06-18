<script setup lang="ts">
import { onMounted } from 'vue';
import VehicleGrid from './VehicleGrid.vue';
import EvData from '@/assets/ev-specs.json';

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
  <VehicleGrid :vehicles="EvData" />
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