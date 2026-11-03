<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        driveAxle?: string | null;
        className?: string;
        size?: number;
    }>(),
    {
        driveAxle: '',
        className: '',
        size: 14
    }
);

const normalized = computed(() => String(props.driveAxle || '').toUpperCase().trim());

const isFrontDriven = computed(() =>
    normalized.value.includes('AWD') ||
    normalized.value.includes('4WD') ||
    normalized.value.includes('FWD') ||
    normalized.value.includes('ALL')
);

const isRearDriven = computed(() =>
    normalized.value.includes('AWD') ||
    normalized.value.includes('4WD') ||
    normalized.value.includes('RWD') ||
    normalized.value.includes('ALL')
);
</script>

<template>
    <svg viewBox="0 0 16 16" :width="size" :height="size" :class="['drivetrain-chassis-svg', className]"
        aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"
            opacity="0.45" />
        <line x1="3.5" y1="4" x2="12.5" y2="4" stroke="currentColor" :stroke-width="isFrontDriven ? '1.5' : '1'"
            stroke-linecap="round" :opacity="isFrontDriven ? '0.9' : '0.35'" />
        <line x1="3.5" y1="12" x2="12.5" y2="12" stroke="currentColor" :stroke-width="isRearDriven ? '1.5' : '1'"
            stroke-linecap="round" :opacity="isRearDriven ? '0.9' : '0.35'" />
        <rect x="1.5" y="2" width="2.2" height="4" rx="0.8" :fill="isFrontDriven ? 'currentColor' : 'none'"
            stroke="currentColor" :stroke-width="isFrontDriven ? '0' : '0.9'" :opacity="isFrontDriven ? '1' : '0.4'" />
        <rect x="12.3" y="2" width="2.2" height="4" rx="0.8" :fill="isFrontDriven ? 'currentColor' : 'none'"
            stroke="currentColor" :stroke-width="isFrontDriven ? '0' : '0.9'" :opacity="isFrontDriven ? '1' : '0.4'" />
        <rect x="1.5" y="10" width="2.2" height="4" rx="0.8" :fill="isRearDriven ? 'currentColor' : 'none'"
            stroke="currentColor" :stroke-width="isRearDriven ? '0' : '0.9'" :opacity="isRearDriven ? '1' : '0.4'" />
        <rect x="12.3" y="10" width="2.2" height="4" rx="0.8" :fill="isRearDriven ? 'currentColor' : 'none'"
            stroke="currentColor" :stroke-width="isRearDriven ? '0' : '0.9'" :opacity="isRearDriven ? '1' : '0.4'" />
    </svg>
</template>

<style scoped>
.drivetrain-chassis-svg {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
}
</style>