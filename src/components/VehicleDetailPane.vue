<script setup lang="ts">
import type { Vehicle } from '../VehicleGrid.vue';

defineProps<{
    activeVehicle: Vehicle;
    activeTabId: string;
    technicalCategories: readonly { id: string; title: string; }[];
    activeVehicleSpecs: { label: string; val: any; originalKey: string; }[];
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'select-tab', tabId: string): void;
}>();
</script>

<template>
    <div class="expanded-detail-pane">
        <div class="expanded-pane-header">
            <h2>{{ activeVehicle.modelYear }} {{ activeVehicle.manufacturer }} {{ activeVehicle.model }}</h2>
            <button class="close-expanded-btn" @click="emit('close')" aria-label="Close details view">&times;</button>
        </div>
        <div class="specs-expanded-drawer">
            <div class="hero-specs-dashboard">
                <div class="hero-meta-block">
                    <span class="hero-subtitle-pill">{{ activeVehicle.trim }}</span>
                    <span class="hero-subtitle-text">
                        {{ activeVehicle.driveAxle }} &bull; {{ activeVehicle.vehicleType }}
                    </span>
                </div>
                <div class="hero-metrics-row">
                    <div class="hero-metric-card highlight-range">
                        <span class="hero-value">
                            {{ activeVehicle.epaCombinedRangeMi || '—' }}<span class="hero-value-unit">mi</span>
                        </span>
                        <span class="hero-label">EPA Rated Range</span>
                    </div>
                    <div class="hero-metric-card highlight-battery">
                        <span class="hero-value">
                            {{ activeVehicle.netBatteryCapacityKwh || '—' }}<span class="hero-value-unit">kWh</span>
                        </span>
                        <span class="hero-label">Net Capacity ({{ activeVehicle.batteryChemistry || '' }})</span>
                    </div>
                    <div class="hero-metric-card highlight-speed">
                        <span class="hero-value">
                            {{ activeVehicle.dcChargingSpeedKw || '—' }}<span class="hero-value-unit">kW</span>
                        </span>
                        <span class="hero-label">Peak DC Charging Speed</span>
                    </div>
                </div>
            </div>
            <div class="tabs-navigation-bar">
                <button v-for="tab in technicalCategories" :key="tab.id" type="button" class="tab-nav-btn"
                    :class="{ 'is-active-tab': activeTabId === tab.id }" @click="emit('select-tab', tab.id)">
                    {{ tab.title }}
                </button>
            </div>
            <div class="tab-content-panel">
                <div class="specs-matrix-grid">
                    <div v-for="spec in activeVehicleSpecs" :key="spec.label" class="spec-matrix-row">
                        <span class="spec-label">{{ spec.label }}</span>
                        <span class="spec-value">{{ spec.val }}</span>
                    </div>

                    <div v-if="activeVehicleSpecs.length === 0" class="empty-tab-notice">
                        No secondary attributes mapped within this specification slice.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.expanded-detail-pane {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    position: relative;
    min-width: 0;
    box-sizing: border-box;
}

html.dark .expanded-detail-pane {
    background-color: #1e293b;
    border-color: #334155;
}

.expanded-pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 12px;
    margin-bottom: 16px;
}

html.dark .expanded-pane-header {
    border-bottom-color: #334155;
}

.expanded-pane-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
}

html.dark .expanded-pane-header h2 {
    color: #ffffff;
}

.close-expanded-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
    line-height: 1;
}

html.dark .close-expanded-btn {
    color: #cbd5e1;
}

.specs-expanded-drawer {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.hero-specs-dashboard {
    background: #f8fafc;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #e2e8f0;
}

html.dark .hero-specs-dashboard {
    background-color: #1e293b;
    border-color: #334155;
}

.hero-meta-block {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.hero-subtitle-pill {
    background: #e2e8f0;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
}

html.dark .hero-subtitle-pill {
    background: #475569;
    color: #f1f5f9;
}

.hero-subtitle-text {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
}

html.dark .hero-subtitle-text {
    color: #94a3b8;
}

.hero-metrics-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.hero-metric-card {
    display: flex;
    flex-direction: column;
    flex: 1 1 120px;
    min-width: 0;
}

.hero-value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0f172a;
    line-height: 1;
}

@media (min-width: 640px) {
    .hero-value {
        font-size: 36px;
    }
}

html.dark .hero-value {
    color: #ffffff;
}

.hero-value-unit {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: normal;
    color: #64748b;
    margin-left: 4px;
}

html.dark .hero-value-unit {
    color: #94a3b8;
}

.hero-label {
    font-size: 11px;
    color: #64748b;
    margin-top: 6px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

html.dark .hero-label {
    color: #94a3b8;
}

.highlight-range .hero-value {
    color: #2563eb;
}

html.dark .highlight-range .hero-value {
    color: #38bdf8;
}

.highlight-battery .hero-value {
    color: #166534;
}

html.dark .highlight-battery .hero-value {
    color: #34d399;
}

.highlight-speed .hero-value {
    color: #b45309;
}

html.dark .highlight-speed .hero-value {
    color: #facc15;
}

.tabs-navigation-bar {
    display: flex;
    gap: 4px;
    border-bottom: 2px solid #f1f5f9;
    overflow-x: auto;
    max-width: 100%;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.tabs-navigation-bar::-webkit-scrollbar {
    display: none;
}

html.dark .tabs-navigation-bar {
    border-bottom-color: #334155;
}

.tab-nav-btn {
    background: transparent;
    border: none;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    position: relative;
    bottom: -2px;
    transition: all 0.15s ease;
    border-bottom: 2px solid transparent;
    flex-shrink: 0;
    white-space: nowrap;
}

html.dark .tab-nav-btn {
    color: #94a3b8;
}

.tab-nav-btn:hover {
    color: #0f172a;
}

html.dark .tab-nav-btn:hover {
    color: #ffffff;
}

.tab-nav-btn.is-active-tab {
    color: #2563eb;
    border-bottom-color: #2563eb;
}

html.dark .tab-nav-btn.is-active-tab {
    color: #38bdf8;
    border-bottom-color: #38bdf8;
}

.tab-content-panel {
    padding: 4px 0;
}

.specs-matrix-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px 24px;
}

.spec-matrix-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
    min-width: 0;
}

html.dark .spec-matrix-row {
    border-bottom-color: #1e293b;
}

.spec-label {
    color: #64748b;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

html.dark .spec-label {
    color: #94a3b8;
}

.spec-value {
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    word-break: break-word;
}

html.dark .spec-value {
    color: #f1f5f9;
}

.empty-tab-notice {
    grid-column: 1 / -1;
    padding: 24px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
    font-style: italic;
}
</style>