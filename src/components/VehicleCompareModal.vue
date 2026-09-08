<script setup lang="ts">
import type { Vehicle } from '../VehicleGrid.vue';

interface ComparisonCategory {
    id: string;
    title: string;
    keys: string[];
}

const props = defineProps<{
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
                    <button class="compare-close-btn" @click="emit('close')">&times;</button>
                </div>
            </div>
            <div class="compare-modal-body">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th class="col-spec-header">Specification</th>
                            <th v-for="v in selectedVehicles" :key="v.modelYear + v.manufacturer + v.model + v.trim"
                                class="col-vehicle-header" :style="{ width: `calc(80% / ${selectedVehicles.length})` }">
                                <div class="compare-column-header">
                                    <button class="remove-v-btn" @click="emit('toggleCompare', v)">&times;</button>
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
                            <td v-for="v in selectedVehicles" :key="v.modelYear + v.manufacturer + v.model + v.trim">
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
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

html.dark .compare-modal-overlay {
    background-color: rgba(2, 6, 23, 0.8);
}

.compare-modal {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

html.dark .compare-modal {
    background: #0f172a;
    border: 1px solid #334155;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
}

.compare-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
}

html.dark .compare-modal-header {
    border-bottom-color: #1e293b;
    background-color: #0f172a;
}

.compare-modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: #0f172a;
}

html.dark .compare-modal-header h2 {
    color: #f8fafc;
}

.compare-close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
    transition: color 0.15s ease;
}

html.dark .compare-close-btn {
    color: #94a3b8;
}

html.dark .compare-close-btn:hover {
    color: #f8fafc;
}

.compare-modal-body {
    padding: 24px;
    overflow-x: auto;
    overflow-y: auto;
}

html.dark .compare-modal-body {
    background-color: #0f172a;
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
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #334155;
}

html.dark .compare-table th,
html.dark .compare-table td {
    border-bottom-color: #1e293b;
    color: #e2e8f0;
}

.col-spec-header {
    width: 20%;
    color: #0f172a;
    font-weight: 700;
}

html.dark .col-spec-header {
    color: #f8fafc;
}

.compare-column-header {
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: 8px;
}

.compare-column-header strong {
    color: #0f172a;
    font-size: 14px;
}

html.dark .compare-column-header strong {
    color: #f8fafc;
}

.compare-column-header span {
    color: #64748b;
    font-size: 12px;
}

html.dark .compare-column-header span {
    color: #94a3b8;
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
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.remove-v-btn:hover {
    background: #dc2626;
}

.compare-spec-key {
    font-weight: 600;
    color: #475569;
    background: #f8fafc;
}

html.dark .compare-spec-key {
    color: #f1f5f9;
    background: #1e293b;
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
    user-select: none;
}

html.dark .toggle-differences-label {
    color: #cbd5e1;
}

.category-header-row td {
    background-color: #f1f5f9;
    padding: 10px 16px;
    border-bottom: 2px solid #cbd5e1;
    border-top: 2px solid #cbd5e1;
}

html.dark .category-header-row td {
    background-color: #1e293b;
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

.diff-highlight .compare-spec-key {
    background-color: #fde047 !important;
    color: #713f12 !important;
}

html.dark .diff-highlight .compare-spec-key {
    background-color: #713f12 !important;
    color: #fef08a !important;
}
</style>