<script setup lang="ts">
import { computed, ref, toRaw, watch, onMounted } from 'vue';

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

interface RangeBounds { min: number; max: number; }
interface BoundsProp {
    modelYear: RangeBounds;
    rangeEpaCombined: RangeBounds;
    chargingSpeedDc: RangeBounds;
}

type StringCategoryKey = 'manufacturer' | 'drivetrain' | 'sizeClass' | 'batteryChemistry' | 'chargingPort' | 'countryOfAssembly' | 'infotainmentOperatingSystem' | 'soundSystemBrand';

interface StringGroupConfig {
    title: string;
    key: StringCategoryKey;
    choices: string[];
}

const props = defineProps<{
    bounds: BoundsProp;
    options: Record<string, string[]>;
}>();

const emitChange = defineEmits<{
    (e: 'filter-change', activeFilters: FilterState): void;
}>();

// Initialize the values cleanly matching the default starting data parameters
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

const stringFilterGroups = computed(() => {
    const configurations: StringGroupConfig[] = [
        { title: 'Manufacturer', key: 'manufacturer', choices: props.options.manufacturer || [] },
        { title: 'Drivetrain', key: 'drivetrain', choices: props.options.drivetrain || [] },
        { title: 'Size Class', key: 'sizeClass', choices: props.options.sizeClass || [] },
        { title: 'Battery Chemistry', key: 'batteryChemistry', choices: props.options.batteryChemistry || [] },
        { title: 'Charging Port', key: 'chargingPort', choices: props.options.chargingPort || [] },
        { title: 'Country of Assembly', key: 'countryOfAssembly', choices: props.options.countryOfAssembly || [] },
        { title: 'Operating System', key: 'infotainmentOperatingSystem', choices: props.options.infotainmentOperatingSystem || [] },
        { title: 'Sound Brand', key: 'soundSystemBrand', choices: props.options.soundSystemBrand || [] }
    ];
    return configurations;
});

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

const getPercent = (value: number, min: number, max: number): number => {
    if (max === min) return 100;
    return ((value - min) / (max - min)) * 100;
};

const syncAndEmit = () => {
    const payload: FilterState = {
        ...structuredClone(toRaw(selectedFilters.value)),
        modelYear: { min: Number(yearMin.value), max: null },
        rangeEpaCombined: { min: Number(rangeMin.value), max: null },
        chargingSpeedDc: { min: Number(speedMin.value), max: null }
    };
    emitChange('filter-change', payload);
};

// Set initial baseline numbers on lifecycle mounting to safely skip immediate watch conflicts
onMounted(() => {
    if (props.bounds) {
        yearMin.value = props.bounds.modelYear.min;
        rangeMin.value = props.bounds.rangeEpaCombined.min;
        speedMin.value = props.bounds.chargingSpeedDc.min;
    }
    syncAndEmit();
});

// Regular watch logic tracks active property payload adjustments stably
watch(() => props.bounds, (newBounds) => {
    if (!newBounds) return;
    yearMin.value = newBounds.modelYear.min;
    rangeMin.value = newBounds.rangeEpaCombined.min;
    speedMin.value = newBounds.chargingSpeedDc.min;
    syncAndEmit();
});

watch(selectedFilters, () => {
    syncAndEmit();
}, { deep: true });
</script>

<template>
    <div class="filter-dashboard">
        <h3>Filters</h3>

        <section class="filter-section numeric-ranges">
            <div class="range-group">
                <label>Model Year: <strong>{{ yearMin }}</strong></label>
                <div class="slider-container">
                    <input type="range" :min="bounds.modelYear.min" :max="bounds.modelYear.max" step="1"
                        v-model.number="yearMin" @input="syncAndEmit" :style="{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getPercent(yearMin, bounds.modelYear.min, bounds.modelYear.max)}%, #e5e7eb ${getPercent(yearMin, bounds.modelYear.min, bounds.modelYear.max)}%, #e5e7eb 100%)`
                        }" />
                </div>
            </div>

            <div class="range-group">
                <label>EPA Range: <strong>{{ rangeMin }} mi</strong></label>
                <div class="slider-container">
                    <input type="range" :min="bounds.rangeEpaCombined.min" :max="bounds.rangeEpaCombined.max" step="10"
                        v-model.number="rangeMin" @input="syncAndEmit" :style="{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getPercent(rangeMin, bounds.rangeEpaCombined.min, bounds.rangeEpaCombined.max)}%, #e5e7eb ${getPercent(rangeMin, bounds.rangeEpaCombined.min, bounds.rangeEpaCombined.max)}%, #e5e7eb 100%)`
                        }" />
                </div>
            </div>

            <div class="range-group">
                <label>DC Charge Speed: <strong>{{ speedMin }} kW</strong></label>
                <div class="slider-container">
                    <input type="range" :min="bounds.chargingSpeedDc.min" :max="bounds.chargingSpeedDc.max" step="25"
                        v-model.number="speedMin" @input="syncAndEmit" :style="{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getPercent(speedMin, bounds.chargingSpeedDc.min, bounds.chargingSpeedDc.max)}%, #e5e7eb ${getPercent(speedMin, bounds.chargingSpeedDc.min, bounds.chargingSpeedDc.max)}%, #e5e7eb 100%)`
                        }" />
                </div>
            </div>
        </section>

        <section class="filter-section multi-selects">
            <div v-for="group in stringFilterGroups" :key="group.key" class="filter-card">
                <h4>{{ group.title }}</h4>
                <div class="scroll-box">
                    <label v-for="option in group.choices" :key="option">
                        <input type="checkbox" :value="option" v-model="selectedFilters[group.key]" />
                        {{ option }}
                    </label>
                </div>
            </div>
        </section>

        <section class="filter-section feature-toggles">
            <h4>Vehicle Features</h4>
            <div class="toggle-grid">
                <div v-for="feature in booleanFilters" :key="feature.key" class="toggle-item">
                    <span>{{ feature.label }}</span>
                    <select v-model="selectedFilters[feature.key]">
                        <option :value="null">Any</option>
                        <option :value="true">Yes</option>
                        <option :value="false">No</option>
                    </select>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.filter-dashboard {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    margin-bottom: 24px;
}

.filter-section {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #dee2e6;
}

.numeric-ranges {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
}

.range-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.range-group input[type="range"] {
    width: 100%;
    margin: 0;
    padding: 0;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
}

.range-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
}

.multi-selects {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
}

.filter-card h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
}

.scroll-box {
    max-height: 120px;
    overflow-y: auto;
}

.scroll-box label {
    display: block;
    margin: 4px 0;
    font-size: 13px;
}

.toggle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
}

.toggle-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}
</style>