<script setup lang="ts">
import VehicleGrid from './VehicleGrid.vue';
import EvData from '@/assets/ev-specs.json';
</script>

<template>
  <VehicleGrid :vehicles="EvData" />
</template>

<style scoped></style>