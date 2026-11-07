<script setup lang="ts">
import type { Vehicle } from './VehicleGrid.vue';

interface ComparisonCategory {
    id: string;
    title: string;
    keys: string[];
}

defineProps<{
    isOpen: boolean;
    selectedVehicles: Vehicle[];
    categories: ComparisonCategory[];
    highlightDifferences: boolean;
    getSpecValueByLabel: (vehicle: Vehicle, label: string) => string;
    evaluateRowDifference: (label: string) => boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'toggleCompare', vehicle: Vehicle): void;
    (e: 'update:highlightDifferences', value: boolean): void;
}>();
</script>

<template>
    <div v-if="isOpen" class="compare-modal-overlay" @click.self="emit('close')">
        <div class="compare-modal">
            <div class="compare-modal-header">
                <h2>Vehicle Comparison Matrix</h2>
                <div class="compare-header-controls">
                    <label class="toggle-differences-label">
                        <input type="checkbox" :checked="highlightDifferences"
                            @change="emit('update:highlightDifferences', ($event.target as HTMLInputElement).checked)" />
                        Highlight Differences
                    </label>
                    <button class="compare-close-btn" @click="emit('close')" type="button">&times;</button>
                </div>
            </div>
            <div class="compare-modal-body">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th class="col-spec-header">Specification</th>
                            <th v-for="v in selectedVehicles"
                                :key="v.modelYear + String(v.manufacturer) + String(v.model) + String(v.trim ?? '')"
                                class="col-vehicle-header" :style="{ width: `calc(80% / ${selectedVehicles.length})` }">
                                <div class="compare-column-header">
                                    <button class="remove-v-btn" @click="emit('toggleCompare', v)"
                                        type="button">&times;</button>
                                    <strong>{{ v.modelYear }} {{ v.manufacturer }} {{ v.model }}</strong>
                                    <span>{{ v.trim }}</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody v-for="category in categories" :key="category.id">
                        <tr class="category-header-row">
                            <td :colspan="selectedVehicles.length + 1">
                                <h3>{{ category.title }}</h3>
                            </td>
                        </tr>
                        <tr v-for="keyLabel in category.keys" :key="keyLabel"
                            :class="{ 'diff-highlight': highlightDifferences && evaluateRowDifference(keyLabel) }">
                            <td class="compare-spec-key">{{ keyLabel }}</td>
                            <td v-for="v in selectedVehicles"
                                :key="v.modelYear + String(v.manufacturer) + String(v.model) + String(v.trim ?? '')">
                                {{ getSpecValueByLabel(v, keyLabel) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.compare-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

html.dark .compare-modal-overlay {
    background-color: rgba(2, 6, 23, 0.85);
}

.compare-modal {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(203, 213, 225, 0.85);
    border-radius: 16px;
    width: 100%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
    overflow: hidden;
}

html.dark .compare-modal {
    background: rgba(15, 23, 42, 0.98);
    border-color: rgba(51, 65, 85, 0.9);
}

.compare-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
}

.compare-modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
}

.compare-close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
    padding: 4px 8px;
    border-radius: 6px;
}

.compare-modal-body {
    padding: 24px;
    overflow-x: auto;
    overflow-y: auto;
}

.compare-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    table-layout: fixed;
}

.compare-table th,
.compare-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    font-size: 13px;
    word-wrap: break-word;
    color: #334155;
}

html.dark .compare-table th,
html.dark .compare-table td {
    color: #e2e8f0;
}

.col-spec-header {
    width: 20%;
    color: var(--text-primary);
    font-weight: 700;
}

.compare-column-header {
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: 8px;
}

.compare-column-header strong {
    color: var(--text-primary);
    font-size: 14px;
}

.compare-column-header span {
    color: #64748b;
    font-size: 12px;
}

.remove-v-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.compare-spec-key {
    font-weight: 600;
    color: #475569;
    background: #f8fafc;
}

html.dark .compare-spec-key {
    background: rgba(11, 19, 43, 0.7);
    color: #f1f5f9;
}

.compare-header-controls {
    display: flex;
    align-items: center;
    gap: 20px;
}

.toggle-differences-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

html.dark .toggle-differences-label {
    color: var(--text-primary);
}

.category-header-row td {
    background-color: #f1f5f9;
    padding: 10px 16px;
    border-bottom: 2px solid #cbd5e1;
    border-top: 2px solid #cbd5e1;
}

html.dark .category-header-row td {
    background-color: rgba(11, 19, 43, 0.8);
    border-bottom-color: #475569;
    border-top-color: #475569;
}

.category-header-row h3 {
    margin: 0;
    font-size: 12px;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
}

html.dark .category-header-row h3 {
    color: #94a3b8;
}

.diff-highlight td {
    background-color: #fef08a !important;
    color: #854d0e !important;
}

html.dark .diff-highlight td {
    background-color: #422006 !important;
    color: #fde047 !important;
}
</style>