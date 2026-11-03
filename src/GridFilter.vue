<script setup lang="ts">
import { computed, ref, toRaw, watch, onMounted, onBeforeUnmount } from 'vue';

import { useTheme } from '@/composables/useTheme';
import DrivetrainGlyph from './components/DrivetrainGlyph.vue';

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

interface RangeBounds { min: number; max: number; }
interface BoundsProp {
    modelYear: RangeBounds;
    epaCombinedRangeMiles: RangeBounds;
    dcChargingSpeedKilowatts: RangeBounds;
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

interface StringGroupConfig {
    title: string;
    key: StringCategoryKey;
    choices: string[];
}

const SEARCHABLE_CATEGORIES: ReadonlySet<string> = new Set([
    'manufacturer',
    'infotainmentOperatingSystem',
    'audioBrand'
]);

const props = defineProps<{
    bounds: BoundsProp;
    options: Record<string, string[]>;
    activeVehicleKey?: string | null;
}>();

const emitChange = defineEmits<{
    (e: 'filter-change', activeFilters: FilterState): void;
}>();

const iconModules = import.meta.glob('/src/assets/icons/*.svg', {
    eager: true,
    import: 'default'
}) as Record<string, string>;

const getChargingPortIconUrl = (portName: string): string => {
    if (!portName) return '';
    const filename = portName.toLowerCase().replace(/[\s-]/g, '');
    return iconModules[`/src/assets/icons/${filename}.svg`] || '';
};

const { isDark } = useTheme();

const activePopoverKey = ref<string | null>(null);
const popoverSearchQuery = ref<string>('');

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
        { title: 'Assembly Country', key: 'countryOfAssembly', choices: normalizeListValues(opts.countryOfAssembly) },
        { title: 'OS', key: 'infotainmentOperatingSystem', choices: normalizeListValues(opts.infotainmentOperatingSystem) },
        { title: 'Audio System', key: 'audioBrand', choices: normalizeListValues(opts.audioBrand) }
    ];
});

const activeChipsList = computed(() => {
    const chips: { categoryKey: string; displayValue: string; }[] = [];
    (Object.keys(selectedFilters.value) as (keyof typeof selectedFilters.value)[]).forEach(k => {
        const val = selectedFilters.value[k];
        if (Array.isArray(val)) {
            val.forEach(v => chips.push({ categoryKey: k, displayValue: v }));
        } else if (val === true || val === false) {
            const item = booleanFilters.find(b => b.key === k);
            if (item) {
                chips.push({ categoryKey: k, displayValue: `${item.label}: ${val ? 'Yes' : 'No'}` });
            }
        }
    });
    return chips;
});

const syncAndEmit = () => {
    const payload: FilterState = {
        ...structuredClone(toRaw(selectedFilters.value)),
        modelYear: { min: Number(yearMin.value), max: props.bounds?.modelYear?.max ?? null },
        epaCombinedRangeMiles: { min: Number(rangeMin.value), max: props.bounds?.epaCombinedRangeMiles?.max ?? null },
        dcChargingSpeedKilowatts: { min: Number(speedMin.value), max: props.bounds?.dcChargingSpeedKilowatts?.max ?? null }
    };
    emitChange('filter-change', payload);
};

const togglePopover = (key: string) => {
    if (activePopoverKey.value === key) {
        activePopoverKey.value = null;
        popoverSearchQuery.value = '';
    } else {
        activePopoverKey.value = key;
        popoverSearchQuery.value = '';
    }
};

const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.popover-dropdown-anchor')) {
        activePopoverKey.value = null;
        popoverSearchQuery.value = '';
    }
};

onMounted(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    if (props.bounds) {
        yearMin.value = props.bounds.modelYear.min;
        rangeMin.value = props.bounds.epaCombinedRangeMiles.min;
        speedMin.value = props.bounds.dcChargingSpeedKilowatts.min;
    }
    syncAndEmit();
});

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleOutsideClick);
});

const resetAllFilters = () => {
    stringFilterGroups.value.forEach(g => { selectedFilters.value[g.key] = []; });
    booleanFilters.forEach(f => { selectedFilters.value[f.key] = null; });
    if (props.bounds) {
        yearMin.value = props.bounds.modelYear.min;
        rangeMin.value = props.bounds.epaCombinedRangeMiles.min;
        speedMin.value = props.bounds.dcChargingSpeedKilowatts.min;
    }
    popoverSearchQuery.value = '';
    activePopoverKey.value = null;
    syncAndEmit();
};

const removeChip = (chip: { categoryKey: string; displayValue: string; }) => {
    const key = chip.categoryKey as keyof typeof selectedFilters.value;
    const current = selectedFilters.value[key];
    if (Array.isArray(current)) {
        selectedFilters.value[key] = current.filter(item => item !== chip.displayValue.replace(/:\s(Yes|No)$/, '')) as any;
    } else {
        selectedFilters.value[key] = null as any;
    }
};

const getPercent = (value: number, min: number, max: number) => {
    if (max <= min) return 0;
    return Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100)));
};

watch(selectedFilters, () => { syncAndEmit(); }, { deep: true });
watch(yearMin, () => { syncAndEmit(); });
watch(rangeMin, () => { syncAndEmit(); });
watch(speedMin, () => { syncAndEmit(); });
</script>

<template>
    <div class="compact-filter-dashboard">
        <div class="filter-header">
            <h3>Filter Vehicles</h3>
            <div class="filter-actions-group">
                <button v-if="activeChipsList.length > 0" class="reset-filters-action-btn" @click="resetAllFilters"
                    type="button">
                    Reset ({{ activeChipsList.length }})
                </button>
            </div>
        </div>

        <div v-if="activeChipsList.length > 0" class="active-chips-line">
            <div v-for="chip in activeChipsList" :key="`${chip.categoryKey}-${chip.displayValue}`" class="filter-chip">
                <span>{{ chip.displayValue }}</span>
                <button class="chip-remove-x" @click="removeChip(chip)" type="button">&times;</button>
            </div>
        </div>

        <div class="sliders-row">
            <div class="compact-range-group">
                <span class="range-meta-label">Min Year: <span class="slider-value-pill">{{ yearMin }}</span></span>
                <input type="range" :min="bounds?.modelYear?.min ?? 2018" :max="bounds?.modelYear?.max ?? 2026" step="1"
                    v-model.number="yearMin"
                    :style="{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${getPercent(yearMin, bounds?.modelYear?.min ?? 2018, bounds?.modelYear?.max ?? 2026)}%, var(--border-color) ${getPercent(yearMin, bounds?.modelYear?.min ?? 2018, bounds?.modelYear?.max ?? 2026)}%, var(--border-color) 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min EPA Range: <span class="slider-value-pill">{{ rangeMin }}
                        mi</span></span>
                <input type="range" :min="bounds?.epaCombinedRangeMiles?.min ?? 0"
                    :max="bounds?.epaCombinedRangeMiles?.max ?? 500" step="10" v-model.number="rangeMin"
                    :style="{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${getPercent(rangeMin, bounds?.epaCombinedRangeMiles?.min ?? 0, bounds?.epaCombinedRangeMiles?.max ?? 500)}%, var(--border-color) ${getPercent(rangeMin, bounds?.epaCombinedRangeMiles?.min ?? 0, bounds?.epaCombinedRangeMiles?.max ?? 500)}%, var(--border-color) 100%)` }" />
            </div>
            <div class="compact-range-group">
                <span class="range-meta-label">Min DC Charge: <span class="slider-value-pill">{{ speedMin }}
                        kW</span></span>
                <input type="range" :min="bounds?.dcChargingSpeedKilowatts?.min ?? 0"
                    :max="bounds?.dcChargingSpeedKilowatts?.max ?? 350" step="25" v-model.number="speedMin"
                    :style="{ background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${getPercent(speedMin, bounds?.dcChargingSpeedKilowatts?.min ?? 0, bounds?.dcChargingSpeedKilowatts?.max ?? 350)}%, var(--border-color) ${getPercent(speedMin, bounds?.dcChargingSpeedKilowatts?.min ?? 0, bounds?.dcChargingSpeedKilowatts?.max ?? 350)}%, var(--border-color) 100%)` }" />
            </div>
        </div>

        <div class="dropdowns-row">
            <div v-for="group in stringFilterGroups" :key="group.key" class="popover-dropdown-anchor"
                :class="{ 'is-open': activePopoverKey === group.key }">
                <button class="dropdown-trigger-btn"
                    :class="{ 'has-active-selections': (selectedFilters[group.key] || []).length > 0, 'is-dropdown-open': activePopoverKey === group.key }"
                    @click="togglePopover(group.key)" type="button">
                    <span class="dropdown-trigger-label">{{ group.title }}</span>
                    <span v-if="(selectedFilters[group.key] || []).length > 0" class="counter-badge">{{
                        (selectedFilters[group.key] || []).length }}</span>
                    <svg viewBox="0 0 24 24" class="dropdown-chevron-icon" aria-hidden="true">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                </button>
                <div v-if="activePopoverKey === group.key" class="dropdown-popover-box" role="dialog">
                    <div v-if="SEARCHABLE_CATEGORIES.has(group.key)" class="popover-search-container" @click.stop>
                        <svg viewBox="0 0 24 24" class="popover-search-icon" aria-hidden="true">
                            <path
                                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input type="text" class="popover-search-input"
                            :placeholder="`Filter ${group.title === 'OS' ? 'OS' : group.title.toLowerCase()}...`"
                            v-model="popoverSearchQuery" autofocus />
                        <button v-if="popoverSearchQuery.length > 0" type="button" class="popover-search-clear-btn"
                            @click="popoverSearchQuery = ''">&times;</button>
                    </div>

                    <div class="popover-choices-list">
                        <label
                            v-for="option in (SEARCHABLE_CATEGORIES.has(group.key) && popoverSearchQuery.trim() ? group.choices.filter(c => c.toLowerCase().includes(popoverSearchQuery.toLowerCase().trim())) : group.choices)"
                            :key="option" class="popover-checkbox-item">
                            <input type="checkbox" :value="option" v-model="selectedFilters[group.key]"
                                class="styled-checkbox" />
                            <span class="checkbox-custom-label">{{ option }}</span>
                            <span v-if="group.key === 'driveAxle'" class="dropdown-drivetrain-glyph-slot"
                                :title="`${option} layout`">
                                <DrivetrainGlyph :drive-axle="option" :size="15" />
                            </span>
                            <span v-else-if="group.key === 'chargingPortTypes'" class="dropdown-drivetrain-glyph-slot"
                                :title="`${option} port`">
                                <img :src="getChargingPortIconUrl(option)" :alt="option"
                                    class="dropdown-charger-icon" />
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="features-row">
            <div class="popover-dropdown-anchor full-width-anchor"
                :class="{ 'is-open': activePopoverKey === 'features_panel' }">
                <button class="dropdown-trigger-btn features-trigger-btn" @click="togglePopover('features_panel')"
                    type="button">
                    <span>Vehicle Features & Options</span>
                    <svg viewBox="0 0 24 24" class="dropdown-chevron-icon" aria-hidden="true">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                </button>
                <div v-if="activePopoverKey === 'features_panel'" class="features-popover-grid" role="dialog">
                    <div v-for="feature in booleanFilters" :key="feature.key" class="feature-toggle-pill">
                        <span class="feature-pill-title">{{ feature.label }}</span>
                        <select class="feature-select-box" v-model="selectedFilters[feature.key]">
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
    position: relative;
    z-index: 25;
    background: rgba(251, 252, 254, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(216, 225, 234, 0.85);
    border-radius: 16px;
    padding: 18px 20px;
    margin-bottom: 16px;
    box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;
}

html.dark .compact-filter-dashboard {
    background: rgba(28, 37, 65, 0.92);
    border-color: rgba(51, 65, 85, 0.85);
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filter-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
}

.reset-filters-action-btn {
    height: 32px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 9999px;
    cursor: pointer;
    border: 1px solid rgba(203, 213, 225, 0.8);
    background-color: rgba(241, 245, 249, 0.85);
    color: #334155;
    transition: all 0.15s ease;
}

.reset-filters-action-btn:hover {
    background-color: #ffffff;
    color: var(--accent-primary);
    border-color: var(--accent-primary);
}

html.dark .reset-filters-action-btn {
    background-color: rgba(11, 19, 43, 0.8);
    border-color: rgba(51, 65, 85, 0.85);
    color: #e2e8f0;
}

.active-chips-line {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(203, 213, 225, 0.5);
}

.filter-chip {
    display: flex;
    align-items: center;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 4px 10px;
    border-radius: 9999px;
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
    font-weight: 700;
}

html.dark .chip-remove-x {
    color: #bfdbfe;
}

.sliders-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    background: rgba(241, 245, 249, 0.7);
    padding: 14px 18px;
    border-radius: 14px;
    border: 1px solid rgba(203, 213, 225, 0.65);
    gap: 16px;
}

html.dark .sliders-row {
    background: rgba(11, 19, 43, 0.65);
    border-color: rgba(51, 65, 85, 0.65);
}

.compact-range-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.range-meta-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
}

.slider-value-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    background: rgba(2, 132, 199, 0.1);
    color: var(--accent-primary);
    border: 1px solid rgba(2, 132, 199, 0.2);
}

html.dark .slider-value-pill {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
}

.compact-range-group input[type="range"] {
    width: 100%;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 9999px;
    outline: none;
}

.dropdowns-row {
    position: relative;
    z-index: 25;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.popover-dropdown-anchor {
    position: relative;
}

.popover-dropdown-anchor.is-open {
    z-index: 110;
}

.dropdown-trigger-btn {
    background: rgba(246, 248, 251, 0.9);
    border: 1px solid rgba(216, 225, 234, 0.85);
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.18s ease;
}

.dropdown-trigger-btn:hover {
    background: #ffffff;
    border-color: var(--accent-primary);
    color: var(--accent-primary);
}

html.dark .dropdown-trigger-btn {
    background: rgba(28, 37, 65, 0.9);
    border-color: rgba(51, 65, 85, 0.85);
    color: #e2e8f0;
}

.dropdown-trigger-btn.has-active-selections {
    border-color: var(--accent-primary);
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 600;
}

html.dark .dropdown-trigger-btn.has-active-selections {
    border-color: #38bdf8;
    background: #1e3a8a;
    color: #f0f9ff;
}

.dropdown-chevron-icon {
    width: 14px;
    height: 14px;
    fill: currentColor;
    transition: transform 0.2s ease;
    flex-shrink: 0;
}

.dropdown-trigger-btn.is-dropdown-open .dropdown-chevron-icon {
    transform: rotate(180deg);
}

.counter-badge {
    background: var(--accent-primary);
    color: white;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 9999px;
    font-weight: 700;
}

.dropdown-popover-box {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: rgba(252, 253, 255, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(216, 225, 234, 0.9);
    box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.12);
    border-radius: 14px;
    padding: 8px;
    z-index: 120;
    max-height: 260px;
    overflow-y: auto;
    min-width: 230px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

html.dark .dropdown-popover-box {
    background: rgba(28, 37, 65, 0.98);
    border-color: rgba(51, 65, 85, 0.9);
}

.popover-search-container {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(246, 248, 251, 0.95);
    border: 1px solid rgba(216, 225, 234, 0.85);
    margin-bottom: 6px;
    border-radius: 10px;
    z-index: 5;
}

html.dark .popover-search-container {
    background: rgba(11, 19, 43, 0.85);
    border-color: rgba(51, 65, 85, 0.85);
}

.popover-search-icon {
    width: 14px;
    height: 14px;
    fill: #64748b;
    flex-shrink: 0;
}

.popover-search-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--text-primary);
}

.popover-search-clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    font-size: 14px;
}

.popover-checkbox-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    line-height: 1.4;
}

html.dark .popover-checkbox-item {
    color: #f1f5f9;
}

.popover-checkbox-item:hover {
    background: #eef2f6;
}

html.dark .popover-checkbox-item:hover {
    background: rgba(11, 19, 43, 0.8);
}

.styled-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    min-width: 16px;
    min-height: 16px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    background: #ffffff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
    transition: all 0.15s ease;
}

.styled-checkbox:checked {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
}

.styled-checkbox:checked::after {
    content: '';
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    position: absolute;
    top: 2px;
}

html.dark .styled-checkbox {
    background: #0f172a;
    border-color: #475569;
}

html.dark .styled-checkbox:checked {
    background: #38bdf8;
    border-color: #38bdf8;
}

.dropdown-drivetrain-glyph-slot {
    margin-left: auto;
    padding-left: 8px;
    display: inline-flex;
    align-items: center;
    color: #64748b;
    flex-shrink: 0;
}

html.dark .dropdown-drivetrain-glyph-slot {
    color: #94a3b8;
}

.dropdown-charger-icon {
    height: 20px;
    width: auto;
    object-fit: contain;
}

html.dark .dropdown-charger-icon {
    filter: invert(1) brightness(2);
}

.features-row {
    position: relative;
    z-index: 15;
}

.full-width-anchor {
    width: 100%;
}

.features-trigger-btn {
    width: 100%;
    justify-content: space-between;
    border-radius: 9999px;
    padding: 8px 18px;
    background: rgba(246, 248, 251, 0.9);
    border: 1px solid rgba(216, 225, 234, 0.85);
}

html.dark .features-trigger-btn {
    background: rgba(28, 37, 65, 0.9);
    border-color: rgba(51, 65, 85, 0.85);
    color: #e2e8f0;
}

.features-popover-grid {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    background: rgba(252, 253, 255, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(216, 225, 234, 0.9);
    box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.12);
    border-radius: 14px;
    padding: 14px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
    z-index: 120;
    box-sizing: border-box;
}

html.dark .features-popover-grid {
    background: rgba(28, 37, 65, 0.98);
    border-color: rgba(51, 65, 85, 0.9);
}

.feature-toggle-pill {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: #f4f7fa;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

html.dark .feature-toggle-pill {
    background: rgba(11, 19, 43, 0.7);
    border-color: rgba(51, 65, 85, 0.7);
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
    padding: 3px 6px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: white;
    color: #334155;
}

html.dark .feature-select-box {
    background: #0f172a;
    border-color: #475569;
    color: var(--text-primary);
}
</style>