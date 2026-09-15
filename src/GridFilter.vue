<script setup lang="ts">
import { computed, ref, toRaw, watch, onMounted, onBeforeUnmount } from 'vue';

import { useTheme } from '@/composables/useTheme';

export interface FilterState {
    manufacturer: string[];
    driveAxle: string[];
    vehicleType: string[];
    batteryChemistry: string[];
    chargingPortTypes: string[];
    countryOfAssembly: string[];
    infotainmentOperatingSystem: string[];
    audioBrand: string[];
    modelYear: { min: number; max: number | null; };
    epaCombinedRangeMiles: { min: number; max: number | null; };
    dcChargingSpeedKilowatts: { min: number; max: number | null; };
    supportsBatteryPreconditioning: boolean | null;
    supportsSuperchargerAccess: boolean | null;
    supportsPlugAndChargeIso15118: boolean | null;
    supportsPhoneAsAKey: boolean | null;
    hasPoweredLiftgate: boolean | null;
    hasOnePedalDrive: boolean | null;
    hasAdaptiveCruiseControl: boolean | null;
    hasGlassRoof: boolean | null;
    supportsAppleCarPlayAndAndroidAuto: boolean | null;
    hasPoweredSeats: boolean | null;
    hasVentilatedSeats: boolean | null;
    hasHeatedSeats: boolean | null;
    hasHeatedSteeringWheel: boolean | null;
    hasHeatPump: boolean | null;
    hasPoweredSideMirrors: boolean | null;
    hasBuiltInDashcam: boolean | null;
    hasPetMode: boolean | null;
    supportsAudioDolbyAtmos: boolean | null;
}

interface RangeBounds {
    min: number;
    max: number;
}

interface BoundsProp {
    modelYear: RangeBounds;
    epaCombinedRangeMiles: RangeBounds;
    dcChargingSpeedKilowatts: RangeBounds;
}

interface StringGroupConfig {
    title: string;
    key: StringCategoryKey;
    choices: string[];
}

type StringCategoryKey =
    | 'manufacturer'
    | 'driveAxle'
    | 'vehicleType'
    | 'batteryChemistry'
    | 'chargingPortTypes'
    | 'countryOfAssembly'
    | 'infotainmentOperatingSystem'
    | 'audioBrand';

type BooleanFilterKey =
    | 'supportsBatteryPreconditioning'
    | 'supportsSuperchargerAccess'
    | 'supportsPlugAndChargeIso15118'
    | 'supportsPhoneAsAKey'
    | 'hasPoweredLiftgate'
    | 'hasOnePedalDrive'
    | 'hasAdaptiveCruiseControl'
    | 'hasGlassRoof'
    | 'supportsAppleCarPlayAndAndroidAuto'
    | 'hasPoweredSeats'
    | 'hasVentilatedSeats'
    | 'hasHeatedSeats'
    | 'hasHeatedSteeringWheel'
    | 'hasHeatPump'
    | 'hasPoweredSideMirrors'
    | 'hasBuiltInDashcam'
    | 'hasPetMode'
    | 'supportsAudioDolbyAtmos';

const props = defineProps<{
    bounds: BoundsProp;
    options: Record<string, string[]>;
}>();

const emitChange = defineEmits<{
    (e: 'filter-change', activeFilters: FilterState): void;
}>();

const { isDark, toggleTheme } = useTheme();

const activePopoverKey = ref<string | null>(null);

const yearMin = ref<number>(props.bounds?.modelYear?.min ?? 2018);
const rangeMin = ref<number>(props.bounds?.epaCombinedRangeMiles?.min ?? 0);
const speedMin = ref<number>(props.bounds?.dcChargingSpeedKilowatts?.min ?? 0);

const selectedFilters = ref({
    manufacturer: [] as string[],
    driveAxle: [] as string[],
    vehicleType: [] as string[],
    batteryChemistry: [] as string[],
    chargingPortTypes: [] as string[],
    countryOfAssembly: [] as string[],
    infotainmentOperatingSystem: [] as string[],
    audioBrand: [] as string[],
    supportsBatteryPreconditioning: null as boolean | null,
    supportsSuperchargerAccess: null as boolean | null,
    supportsPlugAndChargeIso15118: null as boolean | null,
    supportsPhoneAsAKey: null as boolean | null,
    hasPoweredLiftgate: null as boolean | null,
    hasOnePedalDrive: null as boolean | null,
    hasAdaptiveCruiseControl: null as boolean | null,
    hasGlassRoof: null as boolean | null,
    supportsAppleCarPlayAndAndroidAuto: null as boolean | null,
    hasPoweredSeats: null as boolean | null,
    hasVentilatedSeats: null as boolean | null,
    hasHeatedSeats: null as boolean | null,
    hasHeatedSteeringWheel: null as boolean | null,
    hasHeatPump: null as boolean | null,
    hasPoweredSideMirrors: null as boolean | null,
    hasBuiltInDashcam: null as boolean | null,
    hasPetMode: null as boolean | null,
    supportsAudioDolbyAtmos: null as boolean | null
});

const normalizeListValues = (rawChoices: unknown): string[] => {
    if (!rawChoices) return [];

    const items = Array.isArray(rawChoices) ? rawChoices : [rawChoices];
    const expanded = items.flatMap(item => {
        if (item === null || item === undefined) return [];
        if (typeof item === 'string' && item.includes(',')) {
            return item.split(',').map(s => s.trim());
        }
        return String(item).trim();
    });

    return Array.from(new Set(expanded)).filter(Boolean).sort();
};

const stringFilterGroups = computed((): StringGroupConfig[] => {
    const opts = props.options || {};

    return [
        { title: 'Manufacturer', key: 'manufacturer', choices: normalizeListValues(opts.manufacturer) },
        { title: 'Drive Axle', key: 'driveAxle', choices: normalizeListValues(opts.driveAxle) },
        { title: 'Vehicle Type', key: 'vehicleType', choices: normalizeListValues(opts.vehicleType) },
        { title: 'Battery Chemistry', key: 'batteryChemistry', choices: normalizeListValues(opts.batteryChemistry) },
        { title: 'Charge Port', key: 'chargingPortTypes', choices: normalizeListValues(opts.chargingPortTypes) },
        { title: 'Country of Assembly', key: 'countryOfAssembly', choices: normalizeListValues(opts.countryOfAssembly) },
        { title: 'Infotainment OS', key: 'infotainmentOperatingSystem', choices: normalizeListValues(opts.infotainmentOperatingSystem) },
        { title: 'Sound System Brand', key: 'audioBrand', choices: normalizeListValues(opts.audioBrand) }
    ];
});

const booleanFilters = [
    { key: 'supportsBatteryPreconditioning', label: 'Battery Preconditioning' },
    { key: 'supportsSuperchargerAccess', label: 'Tesla Supercharging' },
    { key: 'supportsPlugAndChargeIso15118', label: 'Plug & Charge (ISO 15118)' },
    { key: 'supportsPhoneAsAKey', label: 'Phone as a Key' },
    { key: 'hasPoweredLiftgate', label: 'Powered Liftgate' },
    { key: 'hasOnePedalDrive', label: 'One-Pedal Drive' },
    { key: 'hasAdaptiveCruiseControl', label: 'Adaptive Cruise Control' },
    { key: 'hasGlassRoof', label: 'Glass Roof' },
    { key: 'supportsAppleCarPlayAndAndroidAuto', label: 'Apple CarPlay & Android Auto' },
    { key: 'hasPoweredSeats', label: 'Powered Seats' },
    { key: 'hasVentilatedSeats', label: 'Ventilated Seats' },
    { key: 'hasHeatedSeats', label: 'Heated Seats' },
    { key: 'hasHeatedSteeringWheel', label: 'Heated Steering Wheel' },
    { key: 'hasHeatPump', label: 'Heat Pump' },
    { key: 'hasPoweredSideMirrors', label: 'Powered Side Mirrors' },
    { key: 'hasBuiltInDashcam', label: 'Built-in Dashcam' },
    { key: 'hasPetMode', label: 'Pet Mode' },
    { key: 'supportsAudioDolbyAtmos', label: 'Dolby Atmos' }
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
    const payload: FilterState = {
        ...structuredClone(toRaw(selectedFilters.value)),
        modelYear: { min: Number(yearMin.value), max: null },
        epaCombinedRangeMiles: { min: Number(rangeMin.value), max: null },
        dcChargingSpeedKilowatts: { min: Number(speedMin.value), max: null }
    };
    emitChange('filter-change', payload);
};

const resetAllFilters = () => {
    stringFilterGroups.value.forEach(group => { selectedFilters.value[group.key] = []; });
    booleanFilters.forEach(f => { selectedFilters.value[f.key] = null; });

    if (props.bounds) {
        yearMin.value = props.bounds.modelYear.min;
        rangeMin.value = props.bounds.epaCombinedRangeMiles.min;
        speedMin.value = props.bounds.dcChargingSpeedKilowatts.min;
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
    if (max === min || !max) return 100;
    return ((value - min) / (max - min)) * 100;
};

const applyBounds = (boundsSource: BoundsProp) => {
    if (!boundsSource) return;
    yearMin.value = boundsSource.modelYear.min;
    rangeMin.value = boundsSource.epaCombinedRangeMiles.min;
    speedMin.value = boundsSource.dcChargingSpeedKilowatts.min;
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
            <div class="filter-actions-group">
                <button @click="resetAllFilters" class="reset-filters-action-btn">Reset Filters</button>
                <button @click="toggleTheme" class="theme-toggle-btn" type="button" aria-label="Toggle Theme">
                    <!-- <span>{{ isDark ? '☀️' : '🌙' }}</span> -->
                    <span>
                        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
                            <!-- Paste sun.max.fill SVG path here -->
                            <g>
                                <rect height="21.2012" opacity="0" width="21.4844" x="0" y="0" />
                                <path
                                    d="M10.5664 3.79883C11.0254 3.79883 11.4062 3.41797 11.4062 2.94922L11.4062 0.849609C11.4062 0.380859 11.0254 0 10.5664 0C10.0977 0 9.7168 0.380859 9.7168 0.849609L9.7168 2.94922C9.7168 3.41797 10.0977 3.79883 10.5664 3.79883ZM15.3516 5.80078C15.6836 6.12305 16.2207 6.13281 16.5527 5.80078L18.0469 4.30664C18.3691 3.98438 18.3691 3.4375 18.0469 3.10547C17.7246 2.7832 17.1777 2.7832 16.8555 3.10547L15.3516 4.60938C15.0293 4.93164 15.0293 5.47852 15.3516 5.80078ZM17.334 10.5957C17.334 11.0547 17.7246 11.4355 18.1836 11.4355L20.2832 11.4355C20.7422 11.4355 21.123 11.0547 21.123 10.5957C21.123 10.1367 20.7422 9.74609 20.2832 9.74609L18.1836 9.74609C17.7246 9.74609 17.334 10.1367 17.334 10.5957ZM15.3516 15.3906C15.0293 15.7227 15.0293 16.2598 15.3516 16.582L16.8555 18.0957C17.1777 18.418 17.7246 18.3984 18.0469 18.0859C18.3691 17.7539 18.3691 17.2168 18.0469 16.8945L16.543 15.3906C16.2207 15.0684 15.6836 15.0781 15.3516 15.3906ZM10.5664 17.3926C10.0977 17.3926 9.7168 17.7734 9.7168 18.2324L9.7168 20.3418C9.7168 20.8008 10.0977 21.1816 10.5664 21.1816C11.0254 21.1816 11.4062 20.8008 11.4062 20.3418L11.4062 18.2324C11.4062 17.7734 11.0254 17.3926 10.5664 17.3926ZM5.77148 15.3906C5.43945 15.0781 4.89258 15.0684 4.57031 15.3906L3.07617 16.8848C2.75391 17.207 2.75391 17.7441 3.06641 18.0762C3.38867 18.3887 3.94531 18.4082 4.26758 18.0859L5.76172 16.582C6.08398 16.2598 6.08398 15.7227 5.77148 15.3906ZM3.78906 10.5957C3.78906 10.1367 3.39844 9.74609 2.93945 9.74609L0.839844 9.74609C0.380859 9.74609 0 10.1367 0 10.5957C0 11.0547 0.380859 11.4355 0.839844 11.4355L2.93945 11.4355C3.39844 11.4355 3.78906 11.0547 3.78906 10.5957ZM5.76172 5.80078C6.08398 5.48828 6.08398 4.92188 5.77148 4.60938L4.27734 3.10547C3.96484 2.79297 3.4082 2.7832 3.08594 3.10547C2.76367 3.4375 2.76367 3.98438 3.07617 4.29688L4.57031 5.80078C4.89258 6.12305 5.42969 6.12305 5.76172 5.80078Z"
                                    fill-opacity="0.85" />
                                <path
                                    d="M10.5566 15.5664C13.3008 15.5664 15.5273 13.3398 15.5273 10.5957C15.5273 7.85156 13.3008 5.61523 10.5566 5.61523C7.8125 5.61523 5.58594 7.85156 5.58594 10.5957C5.58594 13.3398 7.8125 15.5664 10.5566 15.5664Z"
                                    fill-opacity="0.85" />
                            </g>
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
                            <!-- Paste moon.fill SVG path here -->
                            <g>
                                <rect height="19.7349" opacity="0" width="19.9414" x="0" y="0" />
                                <path
                                    d="M10.2344 19.7161C14.4922 19.7161 17.9395 17.1477 19.4727 13.8762C19.8047 13.1926 19.3652 12.7336 18.7109 12.9387C17.9883 13.1829 16.7969 13.4172 15.6934 13.4172C9.83398 13.4172 6.47461 10.0579 6.47461 4.18873C6.47461 3.08521 6.71875 1.84498 7.07031 0.956304C7.35352 0.233648 6.85547-0.205805 6.16211 0.0969294C2.65625 1.62037 0 5.20435 0 9.48169C0 15.136 4.58984 19.7161 10.2344 19.7161Z"
                                    fill-opacity="0.85" />
                            </g>
                        </svg>
                    </span>
                </button>
            </div>
        </div>

        <div v-if="activeChipsList.length" class="active-chips-line">
            <div v-for="chip in activeChipsList" :key="`${chip.categoryKey}-${chip.displayValue}`" class="filter-chip">
                <span>{{ chip.displayValue }}</span>
                <button class="chip-remove-x" @click="removeChip(chip)">&times;</button>
            </div>
        </div>

        <div class="sliders-row">
            <div class="compact-range-group">
                <span class="range-meta-label">Min Year: <strong>{{ yearMin }}</strong></span>
                <input type="range" :min="bounds.modelYear.min" :max="bounds.modelYear.max" step="1"
                    v-model.number="yearMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${getPercent(yearMin, bounds.modelYear.min, bounds.modelYear.max)}%, #e2e8f0 ${getPercent(yearMin, bounds.modelYear.min, bounds.modelYear.max)}%, #e2e8f0 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min EPA Range: <strong>{{ rangeMin }} mi</strong></span>
                <input type="range" :min="bounds.epaCombinedRangeMiles.min" :max="bounds.epaCombinedRangeMiles.max"
                    step="10" v-model.number="rangeMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${getPercent(rangeMin, bounds.epaCombinedRangeMiles.min, bounds.epaCombinedRangeMiles.max)}%, #e2e8f0 ${getPercent(rangeMin, bounds.epaCombinedRangeMiles.min, bounds.epaCombinedRangeMiles.max)}%, #e2e8f0 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min DC Charge: <strong>{{ speedMin }} kW</strong></span>
                <input type="range" :min="bounds.dcChargingSpeedKilowatts.min"
                    :max="bounds.dcChargingSpeedKilowatts.max" step="25" v-model.number="speedMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${getPercent(speedMin, bounds.dcChargingSpeedKilowatts.min, bounds.dcChargingSpeedKilowatts.max)}%, #e2e8f0 ${getPercent(speedMin, bounds.dcChargingSpeedKilowatts.min, bounds.dcChargingSpeedKilowatts.max)}%, #e2e8f0 100%)` }" />
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
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 66px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

html.dark .compact-filter-dashboard {
    background: var(--bg-primary);
    border-color: var(--border-color);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
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
    color: var(--text-primary);
}

html.dark .filter-header h3 {
    color: var(--text-primary);
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
    color: var(--text-primary);
    border-color: #94a3b8;
}

html.dark .reset-filters-action-btn {
    background-color: #0f172a;
    border-color: var(--border-color);
    color: var(--text-primary);
}

html.dark .reset-filters-action-btn:hover {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: #475569;
}

.active-chips-line {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid #f1f5f9;
}

html.dark .active-chips-line {
    border-bottom-color: var(--border-color);
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

html.dark .filter-chip {
    background: #1e3a8a;
    border-color: var(--accent-primary);
    color: #eff6ff;
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

html.dark .chip-remove-x {
    color: #bfdbfe;
}

.sliders-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    background: #f8fafc;
    padding: 12px;
    border-radius: 8px;
    gap: 16px;
}

html.dark .sliders-row {
    background: #0f172a;
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

html.dark .range-meta-label {
    color: var(--text-primary);
}

.compact-range-group input[type="range"] {
    width: 100%;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: #e2e8f0;
}

html.dark .compact-range-group input[type="range"] {
    background: #334155;
}

.compact-range-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent-primary);
}

html.dark .compact-range-group input[type="range"]::-webkit-slider-thumb {
    background: #38bdf8;
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
    background: var(--bg-primary);
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

html.dark .dropdown-trigger-btn {
    background: #0f172a;
    border-color: var(--border-color);
    color: var(--text-primary);
}

html.dark .dropdown-trigger-btn:hover {
    background: #243347;
    border-color: #475569;
    color: var(--text-primary);
}

.dropdown-trigger-btn.has-active-selections {
    border-color: var(--accent-primary);
    background: #f0f5ff;
    color: #1d4ed8;
}

html.dark .dropdown-trigger-btn.has-active-selections {
    border-color: #38bdf8;
    background: #1e3a8a;
    color: var(--text-primary);
}

.counter-badge {
    background: var(--accent-primary);
    color: white;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 10px;
    font-weight: 700;
}

html.dark .counter-badge {
    background: #38bdf8;
    color: var(--text-primary);
}

.dropdown-popover-box {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 6px;
    background: var(--bg-primary);
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

html.dark .dropdown-popover-box {
    background: #0f172a;
    border-color: #475569;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
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

html.dark .popover-checkbox-item {
    color: var(--text-primary);
}

.popover-checkbox-item:hover {
    background: #f1f5f9;
}

html.dark .popover-checkbox-item:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
}

.full-width-anchor {
    width: 100%;
}

.features-trigger-btn {
    width: 100%;
    justify-content: center;
    background: #f1f5f9;
    border-color: var(--border-color);
}

html.dark .features-trigger-btn {
    background: #0f172a;
    border-color: var(--border-color);
    color: #38bdf8;
}

html.dark .features-trigger-btn:hover {
    background: var(--bg-primary);
    border-color: #475569;
}

.features-popover-grid {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: var(--bg-primary);
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

html.dark .features-popover-grid {
    background: #0f172a;
    border-color: #475569;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}

.feature-toggle-pill {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

html.dark .feature-toggle-pill {
    background: var(--bg-primary);
    border-color: var(--border-color);
}

.feature-pill-title {
    font-size: 12px;
    color: #475569;
    font-weight: 500;
}

html.dark .feature-pill-title {
    color: var(--text-primary);
}

.feature-select-box {
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    background: white;
    color: #334155;
}

html.dark .feature-select-box {
    background: #0f172a;
    border-color: #475569;
    color: var(--text-primary);
}

.filter-actions-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.theme-toggle-btn,
.reset-filters-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border: 1px solid #cbd5e1;
    background-color: #f1f5f9;
    color: #334155;
}

.theme-toggle-btn:hover,
.reset-filters-action-btn:hover {
    background-color: #e2e8f0;
    color: var(--text-primary);
    border-color: #94a3b8;
}

html.dark .theme-toggle-btn,
html.dark .reset-filters-action-btn {
    background-color: #0f172a;
    border-color: var(--border-color);
    color: var(--text-primary);
}

html.dark .theme-toggle-btn:hover,
html.dark .reset-filters-action-btn:hover {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: #475569;
}

.icon {
    width: 16px;
    height: 16px;
    display: inline-block;
    vertical-align: middle;
    fill: var(--text-primary)
}
</style>