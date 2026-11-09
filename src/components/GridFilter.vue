<script setup lang="ts">
import { computed, ref, toRaw, watch, onMounted, onBeforeUnmount, reactive } from 'vue';

import { useTheme } from '@/composables/useTheme';
import GlyphHandler from './GlyphHandler.vue';

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
    hasSubwoofers: boolean | null;
    minSpeakers: number | null;
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

const BATTERY_CHEMISTRIES: Record<string, string> = {
    'LFP': 'Lithium Iron Phosphate',
    'NCM': 'Nickle Cobalt Manganese',
    'NCA': 'Nickle Cobalt Aluminium',
    'NCMA': 'Nickle Cobalt Manganese Aluminium',
    'NRMC': 'Nickle-Rich Manganese Cobalt'
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

const { isDark } = useTheme();

const tooltip = reactive({
    visible: false,
    text: '',
    x: 0,
    y: 0
});

function showTooltip(event: MouseEvent, text: string | undefined) {
    if (!text) return;
    tooltip.text = text;
    tooltip.visible = true;

    // Position it slightly above the cursor
    tooltip.x = event.clientX;
    tooltip.y = event.clientY - 35;
}

function hideTooltip() {
    tooltip.visible = false;
}

const activePopoverKey = ref<string | null>(null);
const popoverSearchQuery = ref<string>('');
const osActiveTab = ref<'family' | 'infotainment'>('family');

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
    supportsAudioDolbyAtmos: null as boolean | null,
    hasSubwoofers: null as boolean | null,
    minSpeakers: null as number | null
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
    { key: 'supportsAudioDolbyAtmos', label: 'Dolby Atmos' },
    { key: 'hasSubwoofers', label: 'Has Subwoofers' }
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
        { title: 'Charge Ports', key: 'chargingPortTypes', choices: normalizeListValues(opts.chargingPortTypes) },
        { title: 'Assembly Country', key: 'countryOfAssembly', choices: normalizeListValues(opts.countryOfAssembly) },
        { title: 'OS', key: 'infotainmentOperatingSystem', choices: normalizeListValues(opts.infotainmentOperatingSystem) },
        { title: 'Audio', key: 'audioBrand', choices: normalizeListValues(opts.audioBrand) }
    ];
});

// Dynamically generate OS Family Map from dataset options
const dynamicOsFamilyMap = computed(() => {
    const map: Record<string, string[]> = {};
    const osGroup = stringFilterGroups.value.find(g => g.key === 'infotainmentOperatingSystem');
    const choices = osGroup ? osGroup.choices : [];

    choices.forEach(choice => {
        const families: string[] = [];

        // Explicit override for Google built-in as requested
        if (choice === 'Google built-in') {
            families.push('Android Automotive');
        }

        const lower = choice.toLowerCase();
        if (lower.includes('android automotive') || choice === 'Android Automotive') {
            families.push('Android Automotive');
        } else if (lower.includes('android')) {
            families.push('Android Automotive');
        } else if (lower.includes('linux')) {
            families.push('Linux');
        } else if (lower.includes('qnx')) {
            families.push('QNX');
        } else {
            const match = choice.match(/\(([^)]+)\)/);
            const extractedFamily = match?.[1]?.trim();
            if (extractedFamily) {
                families.push(extractedFamily);
            } else {
                families.push(choice);
            }
        }

        families.forEach(family => {
            if (!map[family]) {
                map[family] = [];
            }
            if (!map[family].includes(choice)) {
                map[family].push(choice);
            }
        });
    });

    return map;
});

const isFamilySelected = (familyName: string) => {
    const choices = dynamicOsFamilyMap.value[familyName] || [];
    if (choices.length === 0) return false;
    return choices.every(c => selectedFilters.value.infotainmentOperatingSystem.includes(c));
};

const toggleFamilySelection = (familyName: string) => {
    const choices = dynamicOsFamilyMap.value[familyName] || [];
    const currentlySelected = isFamilySelected(familyName);
    
    let currentList = [...selectedFilters.value.infotainmentOperatingSystem];
    if (currentlySelected) {
        currentList = currentList.filter(item => !choices.includes(item));
    } else {
        choices.forEach(c => {
            if (!currentList.includes(c)) {
                currentList.push(c);
            }
        });
    }
    selectedFilters.value.infotainmentOperatingSystem = currentList;
};

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
        } else if (k === 'minSpeakers' && typeof val === 'number' && val > 0) {
            chips.push({ categoryKey: k, displayValue: `Min Speakers: ${val}` });
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

    selectedFilters.value.minSpeakers = null;
    selectedFilters.value.hasSubwoofers = null;

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
        const cleanValue = chip.displayValue.split(':')[0]?.trim() || chip.displayValue;
        (selectedFilters.value[key] as string[]) = current.filter(item => item !== cleanValue && item !== chip.displayValue);
    } else if (key === 'minSpeakers') {
        selectedFilters.value.minSpeakers = null;
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
                    
                    <!-- OS Specific Tabbed Selector -->
                    <template v-if="group.key === 'infotainmentOperatingSystem'">
                        <div class="segmented-control os-tab-control">
                            <button :class="{ active: osActiveTab === 'family' }" @click="osActiveTab = 'family'" type="button">OS Family</button>
                            <button :class="{ active: osActiveTab === 'infotainment' }" @click="osActiveTab = 'infotainment'" type="button">Infotainment OS</button>
                        </div>
                    </template>

                    <div v-if="SEARCHABLE_CATEGORIES.has(group.key)" class="popover-search-container" @click.stop>
                        <svg viewBox="0 0 24 24" class="popover-search-icon" aria-hidden="true">
                            <path
                                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input type="text" class="popover-search-input"
                            :placeholder="`Filter ${group.title === 'OS' ? 'OS' : group.title.toLowerCase() === 'audio' ? 'brands' : group.title.toLowerCase()}...`"
                            v-model="popoverSearchQuery" autofocus />
                        <button v-if="popoverSearchQuery.length > 0" type="button" class="popover-search-clear-btn"
                            @click="popoverSearchQuery = ''">&times;</button>
                    </div>

                    <!-- Audio Specific Toggles -->
                    <div v-if="group.key === 'audioBrand'" class="audio-quick-toggles">
                        <div class="audio-toggle-group">
                            <span class="audio-toggle-label">Subwoofers</span>
                            <div class="segmented-control">
                                <button :class="{ active: selectedFilters.hasSubwoofers === null }"
                                    @click="selectedFilters.hasSubwoofers = null" type="button">Any</button>
                                <button :class="{ active: selectedFilters.hasSubwoofers === true }"
                                    @click="selectedFilters.hasSubwoofers = true" type="button">Yes</button>
                                <button :class="{ active: selectedFilters.hasSubwoofers === false }"
                                    @click="selectedFilters.hasSubwoofers = false" type="button">No</button>
                            </div>
                        </div>

                        <div class="audio-range-group">
                            <span class="range-meta-label">Min Speakers: <span class="slider-value-pill">{{
                                selectedFilters.minSpeakers !== null && selectedFilters.minSpeakers > 0 ?
                                    selectedFilters.minSpeakers : 'Any' }}</span></span>
                            <input type="range" min="0" max="30" step="1" :value="selectedFilters.minSpeakers ?? 0"
                                @input="selectedFilters.minSpeakers = Number(($event.target as HTMLInputElement).value) > 0 ? Number(($event.target as HTMLInputElement).value) : null" />
                        </div>
                    </div>

                    <!-- OS Family View (Dynamically Generated) -->
                    <div v-if="group.key === 'infotainmentOperatingSystem' && osActiveTab === 'family'" class="popover-choices-list">
                        <template v-for="(familyItems, familyName) in dynamicOsFamilyMap" :key="familyName">
                            <label
                                v-if="!popoverSearchQuery.trim() || familyName.toLowerCase().includes(popoverSearchQuery.toLowerCase().trim()) || familyItems.some(i => i.toLowerCase().includes(popoverSearchQuery.toLowerCase().trim()))"
                                class="popover-checkbox-item">
                                <input type="checkbox" :checked="isFamilySelected(familyName)" @change="toggleFamilySelection(familyName)"
                                    class="styled-checkbox" />
                                <span class="checkbox-custom-label">{{ familyName }}</span>
                            </label>
                        </template>
                    </div>

                    <!-- Standard / Infotainment OS View -->
                    <div v-else class="popover-choices-list"
                        :class="{ 'is-charge-port-grid': group.key === 'chargingPortTypes' }">
                        <label
                            v-for="option in (SEARCHABLE_CATEGORIES.has(group.key) && popoverSearchQuery.trim() ? group.choices.filter(c => c.toLowerCase().includes(popoverSearchQuery.toLowerCase().trim())) : group.choices)"
                            :key="option" class="popover-checkbox-item"
                            :class="{ 'charge-port-card': group.key === 'chargingPortTypes' }"
                            @mouseenter="group.key === 'batteryChemistry' && showTooltip($event, BATTERY_CHEMISTRIES[option])"
                            @mouseleave="group.key === 'batteryChemistry' && hideTooltip()">

                            <input type="checkbox" :value="option" v-model="selectedFilters[group.key]"
                                class="styled-checkbox" />

                            <template v-if="group.key === 'chargingPortTypes'">
                                <div class="charge-port-content">
                                    <GlyphHandler :type="option" :size="100" class="charge-port-glyph" />
                                    <span class="checkbox-custom-label">{{ option }}</span>
                                </div>
                            </template>

                            <template v-else>
                                <span class="checkbox-custom-label">{{ option }}</span>
                                <span v-if="group.key === 'driveAxle'" class="dropdown-drivetrain-glyph-slot"
                                    :title="`${option} layout`">
                                    <GlyphHandler :type="option" :size="15" />
                                </span>
                            </template>
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

    <!-- For dropdown tooltips -->
    <Teleport to="body">
        <div v-if="tooltip.visible" :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
            class="global-custom-tooltip">
            {{ tooltip.text }}
        </div>
    </Teleport>
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
    border: 1px solid rgba(2, 132, 199, 0.35);
    background-color: rgba(2, 132, 199, 0.08);
    color: var(--accent-primary);
    transition: all 0.15s ease;
}

.reset-filters-action-btn:hover {
    background-color: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
}

html.dark .reset-filters-action-btn {
    background-color: rgba(56, 189, 248, 0.12);
    border-color: rgba(56, 189, 248, 0.4);
    color: #38bdf8;
}

html.dark .reset-filters-action-btn:hover {
    background-color: #38bdf8;
    color: #0f172a;
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
    background: rgba(241, 245, 249, 0.95);
    border: 1px solid rgba(2, 132, 199, 0.3);
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.18s ease;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.dropdown-trigger-btn:hover {
    background: #ffffff;
    border-color: var(--accent-primary);
    color: var(--accent-primary);
}

html.dark .dropdown-trigger-btn {
    background: rgba(11, 19, 43, 0.85);
    border-color: rgba(56, 189, 248, 0.35);
    color: var(--text-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

html.dark .dropdown-trigger-btn:hover {
    background: rgba(28, 37, 65, 0.95);
    border-color: #38bdf8;
    color: #38bdf8;
}

.dropdown-trigger-btn.has-active-selections {
    border-color: var(--accent-primary);
    background: rgba(2, 132, 199, 0.1);
    color: var(--accent-primary);
}

html.dark .dropdown-trigger-btn.has-active-selections {
    border-color: #38bdf8;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
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
    padding: 10px;
    z-index: 120;
    max-height: 280px;
    overflow-y: auto;
    min-width: 260px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

html.dark .dropdown-popover-box {
    background: rgba(28, 37, 65, 0.98);
    border-color: rgba(51, 65, 85, 0.9);
}

.os-tab-control {
    margin-bottom: 4px;
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
    margin-bottom: 2px;
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
    background: rgba(241, 245, 249, 0.95);
    border: 1px solid rgba(2, 132, 199, 0.3);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

html.dark .features-trigger-btn {
    background: rgba(11, 19, 43, 0.85);
    border-color: rgba(56, 189, 248, 0.35);
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
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid rgba(2, 132, 199, 0.3);
    background: rgba(241, 245, 249, 0.9);
    color: #334155;
    font-weight: 500;
    cursor: pointer;
}

html.dark .feature-select-box {
    background: rgba(11, 19, 43, 0.9);
    border-color: rgba(56, 189, 248, 0.35);
    color: var(--text-primary);
}

.popover-choices-list.is-charge-port-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
}

.popover-checkbox-item.charge-port-card {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    text-align: center;
    position: relative;
    background: rgba(255, 255, 255, 0.5);
    transition: all 0.2s ease;
    height: 100px;
    box-sizing: border-box;
}

html.dark .popover-checkbox-item.charge-port-card {
    background: rgba(0, 0, 0, 0.2);
}

.popover-checkbox-item.charge-port-card:hover {
    background: #eef2f6;
}

html.dark .popover-checkbox-item.charge-port-card:hover {
    background: rgba(11, 19, 43, 0.8);
}

.charge-port-card .styled-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
}

.charge-port-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
}

.charge-port-glyph {
    height: 40px !important;
    width: auto !important;
    max-width: 100% !important;
}

.tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
}

.tooltip-trigger {
    cursor: help;
    display: inline-flex;
    align-items: center;
}

:global(.global-custom-tooltip) {
    position: fixed;
    z-index: 99999;
    background-color: #0f172a !important;
    color: #ffffff !important;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 9px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    transform: translateX(-50%);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.audio-quick-toggles {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(203, 213, 225, 0.5);
    margin-bottom: 6px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(241, 245, 249, 0.5);
    border-radius: 10px;
}

html.dark .audio-quick-toggles {
    background: rgba(15, 23, 42, 0.4);
    border-bottom-color: rgba(51, 65, 85, 0.6);
}

.audio-toggle-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.audio-toggle-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
}

.segmented-control {
    display: flex;
    background: rgba(226, 232, 240, 0.8);
    border-radius: 8px;
    padding: 3px;
    width: 100%;
}

html.dark .segmented-control {
    background: rgba(30, 41, 59, 0.9);
}

.segmented-control button {
    flex: 1;
    background: transparent;
    border: none;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.15s ease;
}

.segmented-control button.active {
    background: #ffffff;
    color: var(--accent-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

html.dark .segmented-control button.active {
    background: #38bdf8;
    color: #0f172a;
}

.audio-range-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.audio-range-group input[type="range"] {
    width: 100%;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 9999px;
    outline: none;
    background: rgba(203, 213, 225, 0.8);
}

html.dark .audio-range-group input[type="range"] {
    background: rgba(51, 65, 85, 0.8);
}
</style>