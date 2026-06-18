<script setup lang="ts">
import { computed, ref, toRaw, watch, onMounted, onBeforeUnmount } from 'vue';

export interface FilterState {
    manufacturer: string[];
    driveAxle: string[];
    vehicleType: string[];
    batteryChemistry: string[];
    chargingPorts: string[];
    countryOfAssembly: string[];
    infotainmentOs: string[];
    soundSystemBrand: string[];
    modelYear: { min: number; max: number | null; };
    epaCombinedRangeMi: { min: number; max: number | null; };
    dcChargingSpeedKw: { min: number; max: number | null; };
    supportBatteryPreconditioning: boolean | null;
    supportTeslaSupercharging: boolean | null;
    supportIso15118: boolean | null;
    supportsPhoneAsAKey: boolean | null;
    hasPoweredLiftgate: boolean | null;
    hasOnePedalDrive: boolean | null;
    hasAdaptiveCruiseControl: boolean | null;
    hasGlassRoof: boolean | null;
    supportsCarPlayAndroidAuto: boolean | null;
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
    epaCombinedRangeMi: RangeBounds;
    dcChargingSpeedKw: RangeBounds;
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
    | 'chargingPorts'
    | 'countryOfAssembly'
    | 'infotainmentOs'
    | 'soundSystemBrand';

type BooleanFilterKey =
    | 'supportBatteryPreconditioning'
    | 'supportTeslaSupercharging'
    | 'supportIso15118'
    | 'supportsPhoneAsAKey'
    | 'hasPoweredLiftgate'
    | 'hasOnePedalDrive'
    | 'hasAdaptiveCruiseControl'
    | 'hasGlassRoof'
    | 'supportsCarPlayAndroidAuto'
    | 'hasPoweredSeats'
    | 'hasVentilatedSeats'
    | 'hasHeatedSeats'
    | 'hasHeatedSteeringWheel'
    | 'hasHeatPump'
    | 'hasPoweredSideMirrors'
    | 'hasDashcam'
    | 'hasAutoDimmingMirrors';

const props = defineProps<{
    bounds: BoundsProp;
    options: Record<string, string[]>;
}>();

const emitChange = defineEmits<{
    (e: 'filter-change', activeFilters: FilterState): void;
}>();

const isDarkModeActive = ref(false);

const checkCurrentTheme = () => {
    isDarkModeActive.value = document.documentElement.classList.contains('dark');
};

const toggleTheme = (): void => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    checkCurrentTheme();
};

onMounted(() => {
    checkCurrentTheme();

    const observer = new MutationObserver(checkCurrentTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

const activePopoverKey = ref<string | null>(null);

const yearMin = ref<number>(props.bounds?.modelYear?.min ?? 2018);
const rangeMin = ref<number>(props.bounds?.epaCombinedRangeMi?.min ?? 0);
const speedMin = ref<number>(props.bounds?.dcChargingSpeedKw?.min ?? 0);

const selectedFilters = ref({
    manufacturer: [] as string[],
    driveAxle: [] as string[],
    vehicleType: [] as string[],
    batteryChemistry: [] as string[],
    chargingPorts: [] as string[],
    countryOfAssembly: [] as string[],
    infotainmentOs: [] as string[],
    soundSystemBrand: [] as string[],
    supportBatteryPreconditioning: null as boolean | null,
    supportTeslaSupercharging: null as boolean | null,
    supportIso15118: null as boolean | null,
    supportsPhoneAsAKey: null as boolean | null,
    hasPoweredLiftgate: null as boolean | null,
    hasOnePedalDrive: null as boolean | null,
    hasAdaptiveCruiseControl: null as boolean | null,
    hasGlassRoof: null as boolean | null,
    supportsCarPlayAndroidAuto: null as boolean | null,
    hasPoweredSeats: null as boolean | null,
    hasVentilatedSeats: null as boolean | null,
    hasHeatedSeats: null as boolean | null,
    hasHeatedSteeringWheel: null as boolean | null,
    hasHeatPump: null as boolean | null,
    hasPoweredSideMirrors: null as boolean | null,
    hasDashcam: null as boolean | null,
    hasAutoDimmingMirrors: null as boolean | null
});

// Normalizes arrays and extracts elements from comma-delimited list variables
const normalizeChoices = (rawChoices: unknown): string[] => {
    if (!rawChoices) return [];

    const items = Array.isArray(rawChoices) ? rawChoices : [String(rawChoices)];
    const expanded = items.flatMap(item => {
        if (typeof item === 'string' && item.includes(',')) {
            return item.split(',').map(s => s.trim());
        }
        return String(item).trim();
    });

    return Array.from(new Set(expanded)).filter(Boolean).sort();
};

const stringFilterGroups = computed((): StringGroupConfig[] => {
    // Dynamic fallback checking resolves property mismatches for keys like infotainmentOs
    const infoOsChoices = props.options.infotainmentOs || props.options.infotainmentOs || [];
    const portsChoices = props.options.chargingPorts || [];

    return [
        { title: 'Manufacturer', key: 'manufacturer', choices: normalizeChoices(props.options.manufacturer) },
        { title: 'Drive Axle', key: 'driveAxle', choices: normalizeChoices(props.options.driveAxle) },
        { title: 'Vehicle Type', key: 'vehicleType', choices: normalizeChoices(props.options.vehicleType) },
        { title: 'Battery Chemistry', key: 'batteryChemistry', choices: normalizeChoices(props.options.batteryChemistry) },
        { title: 'Charge Port', key: 'chargingPorts', choices: normalizeChoices(portsChoices) },
        { title: 'Country of Assembly', key: 'countryOfAssembly', choices: normalizeChoices(props.options.countryOfAssembly) },
        { title: 'Infotainment OS', key: 'infotainmentOs', choices: normalizeChoices(infoOsChoices) },
        { title: 'Sound System Brand', key: 'soundSystemBrand', choices: normalizeChoices(props.options.soundSystemBrand) }
    ];
});

const booleanFilters = [
    { key: 'supportBatteryPreconditioning', label: 'Battery Preconditioning' },
    { key: 'supportTeslaSupercharging', label: 'Tesla Supercharging' },
    { key: 'supportIso15118', label: 'Plug & Charge (ISO 15118)' },
    { key: 'supportsPhoneAsAKey', label: 'Phone as a Key' },
    { key: 'hasPoweredLiftgate', label: 'Powered Liftgate' },
    { key: 'hasOnePedalDrive', label: 'One-Pedal Drive' },
    { key: 'hasAdaptiveCruiseControl', label: 'Adaptive Cruise Control' },
    { key: 'hasGlassRoof', label: 'Glass Roof' },
    { key: 'supportsCarPlayAndroidAuto', label: 'CarPlay & Android Auto' },
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
    const payload: FilterState = {
        ...structuredClone(toRaw(selectedFilters.value)),
        modelYear: { min: Number(yearMin.value), max: null },
        epaCombinedRangeMi: { min: Number(rangeMin.value), max: null },
        dcChargingSpeedKw: { min: Number(speedMin.value), max: null }
    };
    emitChange('filter-change', payload);
};

const resetAllFilters = () => {
    stringFilterGroups.value.forEach(group => { selectedFilters.value[group.key] = []; });
    booleanFilters.forEach(f => { selectedFilters.value[f.key] = null; });

    if (props.bounds) {
        yearMin.value = props.bounds.modelYear.min;
        rangeMin.value = props.bounds.epaCombinedRangeMi.min;
        speedMin.value = props.bounds.dcChargingSpeedKw.min;
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
    rangeMin.value = boundsSource.epaCombinedRangeMi.min;
    speedMin.value = boundsSource.dcChargingSpeedKw.min;
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
                    <span>{{ isDarkModeActive ? '☀️' : '🌙' }}</span>
                </button>
            </div>
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
                <input type="range" :min="bounds.epaCombinedRangeMi.min" :max="bounds.epaCombinedRangeMi.max" step="10"
                    v-model.number="rangeMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, #2563eb 0%, #2563eb ${getPercent(rangeMin, bounds.epaCombinedRangeMi.min, bounds.epaCombinedRangeMi.max)}%, #e2e8f0 ${getPercent(rangeMin, bounds.epaCombinedRangeMi.min, bounds.epaCombinedRangeMi.max)}%, #e2e8f0 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min DC Charge: <strong>{{ speedMin }} kW</strong></span>
                <input type="range" :min="bounds.dcChargingSpeedKw.min" :max="bounds.dcChargingSpeedKw.max" step="25"
                    v-model.number="speedMin" @input="syncAndEmit"
                    :style="{ background: `linear-gradient(to right, #2563eb 0%, #2563eb ${getPercent(speedMin, bounds.dcChargingSpeedKw.min, bounds.dcChargingSpeedKw.max)}%, #e2e8f0 ${getPercent(speedMin, bounds.dcChargingSpeedKw.min, bounds.dcChargingSpeedKw.max)}%, #e2e8f0 100%)` }" />
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
    box-shadow: 0 4px 66px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

html.dark .compact-filter-dashboard {
    background: #1e293b;
    border-color: #334155;
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
    color: #0f172a;
}

html.dark .filter-header h3 {
    color: #ffffff;
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

html.dark .reset-filters-action-btn {
    background-color: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
}

html.dark .reset-filters-action-btn:hover {
    background-color: #1e293b;
    color: #ffffff;
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
    border-bottom-color: #334155;
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
    border-color: #2563eb;
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
    color: #cbd5e1;
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
    background: #2563eb;
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

html.dark .dropdown-trigger-btn {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
}

html.dark .dropdown-trigger-btn:hover {
    background: #243347;
    border-color: #475569;
    color: #ffffff;
}

.dropdown-trigger-btn.has-active-selections {
    border-color: #2563eb;
    background: #f0f5ff;
    color: #1d4ed8;
}

html.dark .dropdown-trigger-btn.has-active-selections {
    border-color: #38bdf8;
    background: #1e3a8a;
    color: #ffffff;
}

.counter-badge {
    background: #2563eb;
    color: white;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 10px;
    font-weight: 700;
}

html.dark .counter-badge {
    background: #38bdf8;
    color: #0f172a;
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
    color: #cbd5e1;
}

.popover-checkbox-item:hover {
    background: #f1f5f9;
}

html.dark .popover-checkbox-item:hover {
    background: #1e293b;
    color: #ffffff;
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

html.dark .features-trigger-btn {
    background: #0f172a;
    border-color: #334155;
    color: #38bdf8;
}

html.dark .features-trigger-btn:hover {
    background: #1e293b;
    border-color: #475569;
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
    border: 1px solid #e2e8f0;
}

html.dark .feature-toggle-pill {
    background: #1e293b;
    border-color: #334155;
}

.feature-pill-title {
    font-size: 12px;
    color: #475569;
    font-weight: 500;
}

html.dark .feature-pill-title {
    color: #cbd5e1;
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
    color: #ffffff;
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
    color: #0f172a;
    border-color: #94a3b8;
}

html.dark .theme-toggle-btn,
html.dark .reset-filters-action-btn {
    background-color: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
}

html.dark .theme-toggle-btn:hover,
html.dark .reset-filters-action-btn:hover {
    background-color: #1e293b;
    color: #ffffff;
    border-color: #475569;
}
</style>