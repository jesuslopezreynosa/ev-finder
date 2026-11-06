<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Vehicle } from './VehicleGrid.vue';
import GlyphHandler from './GlyphHandler.vue';

const props = defineProps<{
    activeVehicle: Vehicle;
    activeTabId: string;
    technicalCategories: readonly { id: string; title: string; }[];
    activeVehicleSpecs: { label: string; val: any; originalKey: string; }[];
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'select-tab', tabId: string): void;
}>();

const categoryMappings: Record<string, string[]> = {
    powertrainPerformance: ['hasHeatPump', 'powerHorsepower', 'torqueFootPounds', 'zeroToSixtyTimeSeconds'],
    energyCharging: ['batteryChemistry', 'batteryNominalVoltage', 'chargingPortTypes', 'dcChargingSpeedKilowatts', 'epaCombinedEfficiencyKilowattHoursPerHundredMiles', 'epaCombinedEfficiencyWattHoursPerMile', 'epaCombinedRangeMiles', 'maxSupportedDcChargingVoltage', 'netBatteryCapacityKilowattHours', 'onboardChargerAmperes', 'plugAndChargeProviders', 'recommendedDailyChargePercent', 'supportsAc277vCharging', 'supportsBatteryPreconditioning', 'supportsPlugAndChargeIso15118', 'supportsSuperchargerAccess', 'supportsVehicleToEverything', 'typicalFullRangeMiles', 'voltageArchitecture'],
    dimensions: ['frunkCapacityLiters', 'grossWeightPounds', 'groundClearanceInches', 'heightInches', 'lengthInches', 'towingCapacityPounds', 'turningRadiusFeet', 'widthInches'],
    cabinConvenience: ['hasAdaptiveCruiseControl', 'hasBuiltInDashcam', 'hasGarageDoorOpener', 'hasGlassRoof', 'hasHeatedSeats', 'hasHeatedSteeringWheel', 'hasOnePedalDrive', 'hasPetMode', 'hasPoweredLiftgate', 'hasPoweredSeats', 'hasPoweredSideMirrors', 'hasVentilatedSeats', 'isOnePedalDrivePersistent', 'maxPhoneKeys', 'seatCount', 'standardSeatMaterial', 'supportsMemoryProfilePerSeatAndMirror', 'supportsPhoneAsAKey', 'supportsUserProfiles'],
    infotainmentConnectivity: ['includedConnectivityFeatures', 'infotainmentOperatingSystem', 'infotainmentScreenResolutionPx', 'infotainmentScreenPpi', 'infotainmentScreenSizeInches', 'navigationProvider', 'optionalConnectivityFeatures', 'optionalSubscriptions', 'requiredFeatureSubscriptions', 'supportsAppleCarPlayAndAndroidAuto', 'supportsAudioDolbyAtmos', 'supportsOverTheAirUpdates', 'audioBrand', 'audioPowerWatts', 'audioSpeakerCount', 'audioSubwooferCount', 'usbPortCount'],
    camerasSensors: ['driverCameraType', 'exteriorCameraCount', 'exteriorSensors', 'interiorCameraCount'],
    warranties: ['batteryWarranty', 'corrosionWarranty', 'driveUnitWarranty', 'vehicleWarranty']
};

const formatDisplaySpecsForVehicle = (vehicle: Vehicle) => {
    const skipKeys = ['modelYear', 'manufacturer', 'model', 'trim', 'driveAxle', 'id'];
    return Object.entries(vehicle)
        .filter(([key, value]) => !skipKeys.includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key]) => ({ originalKey: key }));
};

const availableCategories = computed(() => {
    if (!props.activeVehicle) return props.technicalCategories;
    const rawSpecs = formatDisplaySpecsForVehicle(props.activeVehicle);
    return props.technicalCategories.filter(cat => {
        const targets = (categoryMappings[cat.id] || []).map(k => k.toLowerCase());
        const matched = rawSpecs.filter(spec => targets.includes(spec.originalKey.toLowerCase()));
        return matched.length > 0;
    });
});

// Automatically fallback to the leftmost visible tab if the current active tab has no data
watch(availableCategories, (newCategories) => {
    if (newCategories.length > 0 && !newCategories.some(cat => cat.id === props.activeTabId)) {
        emit('select-tab', newCategories[0]!.id);
    }
}, { immediate: true });

const tabsContainerRef = ref<HTMLElement | null>(null);

const scrollTabs = (direction: number) => {
    if (tabsContainerRef.value) {
        tabsContainerRef.value.scrollBy({ left: direction * 180, behavior: 'smooth' });
    }
};
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
                    <span class="hero-subtitle-text">
                        {{ activeVehicle.trim }} &bull; {{ activeVehicle.driveAxle }} &bull; {{
                        activeVehicle.vehicleType }}
                    </span>
                </div>
                <div class="hero-metrics-row">
                    <div class="hero-metric-card highlight-range">
                        <span class="hero-value">
                            {{ activeVehicle.epaCombinedRangeMiles || '—' }}<span class="hero-value-unit">mi</span>
                        </span>
                        <span class="hero-label">EPA Rated Range</span>
                    </div>
                    <div class="hero-metric-card highlight-battery">
                        <span class="hero-value">
                            {{ activeVehicle.netBatteryCapacityKilowattHours || '—' }}<span
                                class="hero-value-unit">kWh</span>
                        </span>
                        <span class="hero-label">Net Battery Capacity ({{ activeVehicle.batteryChemistry || 'Lithium-ion'
                        }})</span>
                    </div>
                    <div class="hero-metric-card highlight-speed">
                        <span class="hero-value">
                            {{ activeVehicle.dcChargingSpeedKilowatts || '—' }}<span class="hero-value-unit">kW</span>
                        </span>
                        <span class="hero-label">Peak DC Charging Speed</span>
                    </div>
                </div>
            </div>

            <div class="tabs-container-wrapper">
                <button class="tab-scroll-arrow left" @click="scrollTabs(-1)"
                    aria-label="Scroll tabs left">&#10094;</button>
                <div ref="tabsContainerRef" class="tabs-navigation-bar">
                    <button v-for="tab in availableCategories" :key="tab.id" type="button" class="tab-nav-btn"
                        :class="{ 'is-active-tab': activeTabId === tab.id }" @click="emit('select-tab', tab.id)">
                        {{ tab.title }}
                    </button>
                </div>
                <button class="tab-scroll-arrow right" @click="scrollTabs(1)"
                    aria-label="Scroll tabs right">&#10095;</button>
            </div>

            <div class="tab-content-panel">
                <div class="specs-matrix-grid">
                    <div v-for="spec in activeVehicleSpecs" :key="spec.label" class="spec-matrix-row">
                        <span class="spec-label">{{ spec.label }}</span>
                        <span class="spec-value">{{ String(spec.val) }}</span>
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
    background: rgba(251, 252, 254, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(216, 225, 234, 0.9);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);
    position: relative;
    min-width: 0;
    box-sizing: border-box;
}

html.dark .expanded-detail-pane {
    background: rgba(28, 37, 65, 0.96);
    border-color: rgba(51, 65, 85, 0.9);
}

.expanded-pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 14px;
    margin-bottom: 18px;
}

.expanded-pane-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
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
    color: #94a3b8;
}

.specs-expanded-drawer {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.hero-specs-dashboard {
    background: rgba(238, 242, 246, 0.7);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid var(--border-color);
}

html.dark .hero-specs-dashboard {
    background: rgba(11, 19, 43, 0.6);
}

.hero-meta-block {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
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
    color: var(--text-primary);
    line-height: 1;
}

.hero-value-unit {
    font-size: 14px;
    font-weight: 500;
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
}

html.dark .hero-label {
    color: #94a3b8;
}

.highlight-range .hero-value {
    color: var(--accent-primary);
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

.tabs-container-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.tab-scroll-arrow {
    background: rgba(241, 245, 249, 0.9);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    width: 28px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 11px;
    z-index: 2;
    border-radius: 6px;
    flex-shrink: 0;
}

.tab-scroll-arrow:hover {
    background: #ffffff;
    color: var(--accent-primary);
    border-color: var(--accent-primary);
}

html.dark .tab-scroll-arrow {
    background: rgba(28, 37, 65, 0.9);
    color: #94a3b8;
}

html.dark .tab-scroll-arrow:hover {
    background: #1e293b;
    color: #38bdf8;
}

.tabs-navigation-bar {
    display: flex;
    gap: 4px;
    border-bottom: 2px solid #cbd5e1;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    flex-grow: 1;
    scroll-behavior: smooth;
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
    border-bottom: 2px solid transparent;
    flex-shrink: 0;
}

html.dark .tab-nav-btn {
    color: #94a3b8;
}

.tab-nav-btn.is-active-tab {
    color: var(--accent-primary);
    border-bottom-color: var(--accent-primary);
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
}

html.dark .spec-matrix-row {
    border-bottom-color: rgba(255, 255, 255, 0.08);
}

.spec-label {
    color: #64748b;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
}

html.dark .spec-label {
    color: #94a3b8;
}

.spec-value {
    color: var(--text-primary);
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