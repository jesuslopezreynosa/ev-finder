<script setup lang="ts">
import { computed, ref, toRaw, watch, onMounted, onBeforeUnmount } from 'vue';

export interface FilterState {
    manufacturer: string[];
    drivetrain: string[];
    sizeClass: string[];
    batteryChemistry: string[];
    chargingPort: string[];
    countryOfAssembly: string[];
    infotainmentOperatingSystem: string[];
    soundSystemBrand: string[];

    modelYear: { min: number; max: number | null; };
    rangeEpaCombined: { min: number; max: number | null; };
    chargingSpeedDc: { min: number; max: number | null; };

    supportBatteryPreconditioning: boolean | null;
    supportTeslaSupercharging: boolean | null;
    supportIso15118: boolean | null;
    supportPhoneAsAKey: boolean | null;
    hasPoweredLiftgate: boolean | null;
    supportOnePedalDrive: boolean | null;
    hasAdaptiveCruiseControl: boolean | null;
    hasGlassRoof: boolean | null;
    supportsAppleCarPlay: boolean | null;
    supportsAndroidAuto: boolean | null;
    hasPoweredSeats: boolean | null;
    hasVentilatedSeats: boolean | null;
    hasHeatedSeats: boolean | null;
    hasHeatedSteeringWheel: boolean | null;
    hasHeatPump: boolean | null;
    hasPoweredSideMirrors: boolean | null;
    hasDashcam: boolean | null;
    hasAutoDimmingMirrors: boolean | null;
}

interface RangeBounds {
    min: number;
    max: number;
}

interface BoundsProp {
    modelYear: RangeBounds;
    rangeEpaCombined: RangeBounds;
    chargingSpeedDc: RangeBounds;
}

interface StringGroupConfig {
    title: string;
    key: StringCategoryKey;
    choices: string[];
}

type StringCategoryKey = 'manufacturer' | 'drivetrain' | 'sizeClass' | 'batteryChemistry' | 'chargingPort' | 'countryOfAssembly' | 'infotainmentOperatingSystem' | 'soundSystemBrand';
type BooleanFilterKey = 'supportBatteryPreconditioning' | 'supportTeslaSupercharging' | 'supportIso15118' | 'supportPhoneAsAKey' | 'hasPoweredLiftgate' | 'supportOnePedalDrive' | 'hasAdaptiveCruiseControl' | 'hasGlassRoof' | 'supportsAppleCarPlay' | 'supportsAndroidAuto' | 'hasPoweredSeats' | 'hasVentilatedSeats' | 'hasHeatedSeats' | 'hasHeatedSteeringWheel' | 'hasHeatPump' | 'hasPoweredSideMirrors' | 'hasDashcam' | 'hasAutoDimmingMirrors';

const props = defineProps<{
    bounds: BoundsProp;
    options: Record<string, string[]>;
}>();

const emitChange = defineEmits<{
    (e: 'filter-change', activeFilters: any): void;
}>();

const activePopoverKey = ref<string | null>(null);

const yearMin = ref(props.bounds?.modelYear?.min ?? 2018);
const rangeMin = ref(props.bounds?.rangeEpaCombined?.min ?? 0);
const speedMin = ref(props.bounds?.chargingSpeedDc?.min ?? 0);

const selectedFilters = ref({
    manufacturer: [] as string[],
    drivetrain: [] as string[],
    sizeClass: [] as string[],
    batteryChemistry: [] as string[],
    chargingPort: [] as string[],
    countryOfAssembly: [] as string[],
    infotainmentOperatingSystem: [] as string[],
    soundSystemBrand: [] as string[],

    supportBatteryPreconditioning: null as boolean | null,
    supportTeslaSupercharging: null as boolean | null,
    supportIso15118: null as boolean | null,
    supportPhoneAsAKey: null as boolean | null,
    hasPoweredLiftgate: null as boolean | null,
    supportOnePedalDrive: null as boolean | null,
    hasAdaptiveCruiseControl: null as boolean | null,
    hasGlassRoof: null as boolean | null,
    supportsAppleCarPlay: null as boolean | null,
    supportsAndroidAuto: null as boolean | null,
    hasPoweredSeats: null as boolean | null,
    hasVentilatedSeats: null as boolean | null,
    hasHeatedSeats: null as boolean | null,
    hasHeatedSteeringWheel: null as boolean | null,
    hasHeatPump: null as boolean | null,
    hasPoweredSideMirrors: null as boolean | null,
    hasDashcam: null as boolean | null,
    hasAutoDimmingMirrors: null as boolean | null
});

const stringFilterGroups = computed((): StringGroupConfig[] => [
    { title: 'Manufacturer', key: 'manufacturer', choices: props.options.manufacturer || [] },
    { title: 'Drivetrain', key: 'drivetrain', choices: props.options.drivetrain || [] },
    { title: 'Size Class', key: 'sizeClass', choices: props.options.sizeClass || [] },
    { title: 'Battery Chemistry', key: 'batteryChemistry', choices: props.options.batteryChemistry || [] },
    { title: 'Charging Port', key: 'chargingPort', choices: props.options.chargingPort || [] },
    { title: 'Country of Assembly', key: 'countryOfAssembly', choices: props.options.countryOfAssembly || [] },
    { title: 'Operating System', key: 'infotainmentOperatingSystem', choices: props.options.infotainmentOperatingSystem || [] },
    { title: 'Sound Brand', key: 'soundSystemBrand', choices: props.options.soundSystemBrand || [] }
]);

const booleanFilters = [
    { key: 'supportBatteryPreconditioning', label: 'Battery Preconditioning' },
    { key: 'supportTeslaSupercharging', label: 'Tesla Supercharging' },
    { key: 'supportIso15118', label: 'ISO 15118 (Plug & Charge)' },
    { key: 'supportPhoneAsAKey', label: 'Phone as a Key' },
    { key: 'hasPoweredLiftgate', label: 'Powered Liftgate' },
    { key: 'supportOnePedalDrive', label: 'One-Pedal Drive' },
    { key: 'hasAdaptiveCruiseControl', label: 'Adaptive Cruise Control' },
    { key: 'hasGlassRoof', label: 'Glass Roof' },
    { key: 'supportsAppleCarPlay', label: 'Apple CarPlay' },
    { key: 'supportsAndroidAuto', label: 'Android Auto' },
    { key: 'hasPoweredSeats', label: 'Powered Seats' },
    { key: 'hasVentilatedSeats', label: 'Ventilated Seats' },
    { key: 'hasHeatedSeats', label: 'Heated Seats' },
    { key: 'hasHeatedSteeringWheel', label: 'Heated Steering Wheel' },
    { key: 'hasHeatPump', label: 'Heat Pump' },
    { key: 'hasPoweredSideMirrors', label: 'Powered Side Mirrors' },
    { key: 'hasDashcam', label: 'Built-in Dashcam' },
    { key: 'hasAutoDimmingMirrors', label: 'Auto-Dimming Mirrors' }
] as const;

const activeChipsList = computed(() => {
    const list: { type: 'string' | 'boolean'; categoryKey: string; displayValue: string; }[] = [];

    stringFilterGroups.value.forEach(group => {
        const value = selectedFilters.value[group.key];
        if (Array.isArray(value)) {
            value.forEach(val => {
                list.push({ type: 'string', categoryKey: group.key, displayValue: val });
            });
        }
    });

    booleanFilters.forEach(f => {
        const val = selectedFilters.value[f.key];
        if (val !== null) {
            list.push({
                type: 'boolean',
                categoryKey: f.key,
                displayValue: `${f.label}: ${val ? 'Yes' : 'No'}`
            });
        }
    });

    return list;
});

const removeChip = (chip: { type: 'string' | 'boolean'; categoryKey: string; displayValue: string; }) => {
    if (chip.type === 'string') {
        const key = chip.categoryKey as StringCategoryKey;
        selectedFilters.value[key] = selectedFilters.value[key].filter(item => item !== chip.displayValue);
    } else {
        const key = chip.categoryKey as BooleanFilterKey;
        selectedFilters.value[key] = null;
    }
};

const syncAndEmit = () => {
    const payload = {
        ...structuredClone(toRaw(selectedFilters.value)),
        modelYear: { min: Number(yearMin.value), max: null },
        rangeEpaCombined: { min: Number(rangeMin.value), max: null },
        chargingSpeedDc: { min: Number(speedMin.value), max: null }
    };
    emitChange('filter-change', payload);
};

const resetAllFilters = () => {
    stringFilterGroups.value.forEach(group => { selectedFilters.value[group.key] = []; });
    booleanFilters.forEach(f => { selectedFilters.value[f.key] = null; });

    if (props.bounds) {
        yearMin.value = props.bounds.modelYear.min;
        rangeMin.value = props.bounds.rangeEpaCombined.min;
        speedMin.value = props.bounds.chargingSpeedDc.min;
    }
    syncAndEmit();
};

const togglePopover = (key: string) => {
    activePopoverKey.value = activePopoverKey.value === key ? null : key;
};

const handleOutsideClick = (event: MouseEvent) => {
    const targetNode = event.target as HTMLElement;
    if (!targetNode) return;

    if (targetNode.closest('.popover-dropdown-anchor') || targetNode.closest('.dropdown-popover-box') || targetNode.closest('.features-popover-grid')) {
        return;
    }
    activePopoverKey.value = null;
};

const getPercent = (value: number, min: number, max: number): number => {
    if (max === min) return 100;
    return ((value - min) / (max - min)) * 100;
};

const applyBounds = (boundsSource: BoundsProp) => {
    if (!boundsSource) return;
    yearMin.value = boundsSource.modelYear.min;
    rangeMin.value = boundsSource.rangeEpaCombined.min;
    speedMin.value = boundsSource.chargingSpeedDc.min;
};

onMounted(() => {
    window.addEventListener('click', handleOutsideClick);
    applyBounds(props.bounds);
    syncAndEmit();
});

onBeforeUnmount(() => {
    window.removeEventListener('click', handleOutsideClick);
});

watch(() => props.bounds, (newBounds) => {
    if (!newBounds) return;
    applyBounds(newBounds);
    syncAndEmit();
});

watch(selectedFilters, () => { syncAndEmit(); }, { deep: true });
</script>

<template>
    <div class="compact-filter-dashboard">
        <div class="filter-header">
            <h3>Filter Vehicles</h3>
            <button @click="resetAllFilters" class="reset-filters-action-btn">Reset Filters</button>
        </div>

        <div v-if="activeChipsList.length" class="active-chips-line">
            <div v-for="chip in activeChipsList" :key="chip.displayValue" class="filter-chip">
                <span>{{ chip.displayValue }}</span>
                <button class="chip-remove-x" @click="removeChip(chip)">&times;</button>
            </div>
        </div>

        <div class="sliders-row">
            <div class="compact-range-group">
                <span class="range-meta-label">Min Year: <strong>{{ yearMin }}</strong></span>
                <input type="range" :min="bounds.modelYear.min" :max="bounds.modelYear.max" step="1"
                    v-model.number="yearMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, #2563eb 0%, #2563eb ${getPercent(yearMin, bounds.modelYear.min, bounds.modelYear.max)}%, #e2e8f0 ${getPercent(yearMin, bounds.modelYear.min, bounds.modelYear.max)}%, #e2e8f0 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min EPA Range: <strong>{{ rangeMin }} mi</strong></span>
                <input type="range" :min="bounds.rangeEpaCombined.min" :max="bounds.rangeEpaCombined.max" step="10"
                    v-model.number="rangeMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, #2563eb 0%, #2563eb ${getPercent(rangeMin, bounds.rangeEpaCombined.min, bounds.rangeEpaCombined.max)}%, #e2e8f0 ${getPercent(rangeMin, bounds.rangeEpaCombined.min, bounds.rangeEpaCombined.max)}%, #e2e8f0 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min DC Charge: <strong>{{ speedMin }} kW</strong></span>
                <input type="range" :min="bounds.chargingSpeedDc.min" :max="bounds.chargingSpeedDc.max" step="25"
                    v-model.number="speedMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, #2563eb 0%, #2563eb ${getPercent(speedMin, bounds.chargingSpeedDc.min, bounds.chargingSpeedDc.max)}%, #e2e8f0 ${getPercent(speedMin, bounds.chargingSpeedDc.min, bounds.chargingSpeedDc.max)}%, #e2e8f0 100%)` }" />
            </div>
        </div>

        <div class="dropdowns-row">
            <div v-for="group in stringFilterGroups" :key="group.key" class="popover-dropdown-anchor">
                <button class="dropdown-trigger-btn"
                    :class="{ 'has-active-selections': selectedFilters[group.key]?.length }"
                    @click="togglePopover(group.key)">
                    {{ group.title }}
                    <span v-if="selectedFilters[group.key]?.length" class="counter-badge">{{
                        selectedFilters[group.key].length }}</span>
                </button>
                <div v-if="activePopoverKey === group.key" class="dropdown-popover-box">
                    <label v-for="option in group.choices" :key="option" class="popover-checkbox-item">
                        <input type="checkbox" :value="option" v-model="selectedFilters[group.key]" />
                        <span>{{ option }}</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="features-row">
            <div class="popover-dropdown-anchor full-width-anchor">
                <button class="dropdown-trigger-btn features-trigger-btn"
                    @click="togglePopover('features_panel')">Toggle Vehicle Features & Options</button>
                <div v-if="activePopoverKey === 'features_panel'" class="features-popover-grid">
                    <div v-for="feature in booleanFilters" :key="feature.key" class="feature-toggle-pill">
                        <span class="feature-pill-title">{{ feature.label }}</span>
                        <select v-model="selectedFilters[feature.key]" class="feature-select-box">
                            <option :value="null">Any</option>
                            <option :value="true">Yes</option>
                            <option :value="false">No</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.compact-filter-dashboard {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filter-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
}

.reset-filters-action-btn {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 14px;
    border-radius: 6px;
    transition: all 0.15s ease-in-out;
}

.reset-filters-action-btn:hover {
    background-color: #e2e8f0;
    color: #0f172a;
    border-color: #94a3b8;
}

.active-chips-line {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid #f1f5f9;
}

.filter-chip {
    display: flex;
    align-items: center;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.chip-remove-x {
    background: transparent;
    border: none;
    color: #1e40af;
    cursor: pointer;
    margin-left: 6px;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    font-weight: 700;
}

.sliders-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    background: #f8fafc;
    padding: 12px;
    border-radius: 8px;
    gap: 16px;
}

.compact-range-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.range-meta-label {
    font-size: 12px;
    font-weight: 500;
    color: #475569;
}

.compact-range-group input[type="range"] {
    width: 100%;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
}

.compact-range-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #2563eb;
}

.dropdowns-row,
.features-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.popover-dropdown-anchor {
    position: relative;
}

.dropdown-trigger-btn {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
}

.dropdown-trigger-btn:hover {
    background: #f8fafc;
    border-color: #94a3b8;
}

.dropdown-trigger-btn.has-active-selections {
    border-color: #2563eb;
    background: #f0f5ff;
    color: #1d4ed8;
}

.counter-badge {
    background: #2563eb;
    color: white;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 10px;
    font-weight: 700;
}

.dropdown-popover-box {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 6px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
    border-radius: 8px;
    padding: 8px;
    z-index: 100;
    max-height: 220px;
    overflow-y: auto;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.popover-checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

.popover-checkbox-item:hover {
    background: #f1f5f9;
}

.full-width-anchor {
    width: 100%;
}

.features-trigger-btn {
    width: 100%;
    justify-content: center;
    background: #f1f5f9;
    border-color: #e2e8f0;
}

.features-popover-grid {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    padding: 12px;
    margin-top: 6px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
    z-index: 90;
}

.feature-toggle-pill {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.feature-pill-title {
    font-size: 12px;
    color: #475569;
    font-weight: 500;
}

.feature-select-box {
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    background: white;
}
</style>