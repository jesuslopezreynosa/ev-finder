<script setup lang="ts">
import { computed, ref } from 'vue';
import GridFilter, { type FilterState } from './GridFilter.vue';

const props = defineProps<{
    vehicles: any[];
}>();

// Dynamic computation of exact values existing across the current dataset
const dynamicFilterOptions = computed(() => {
    const stringCategories = [
        'manufacturer', 'drivetrain', 'sizeClass', 'batteryChemistry',
        'chargingPort', 'countryOfAssembly', 'infotainmentOperatingSystem', 'soundSystemBrand'
    ] as const;

    const optionsMap: Record<string, string[]> = {};

    // Standard native browser API to convert ISO country codes into full English names
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    stringCategories.forEach(key => {
        const uniqueVals = new Set<string>();

        props.vehicles.forEach(v => {
            const val = v[key];
            if (val === null || val === undefined || val === '') return;

            if (Array.isArray(val)) {
                // Unpack arrays (like multiple charge ports) into distinct singular items
                val.forEach(item => {
                    if (item) uniqueVals.add(String(item).trim());
                });
            } else if (key === 'countryOfAssembly') {
                // Safely translate alpha-3 country strings (e.g. "USA" -> "United States")
                try {
                    const cleanedCode = String(val).trim().toUpperCase();
                    const fullName = regionNames.of(cleanedCode);
                    if (fullName) {
                        uniqueVals.add(fullName);
                    } else {
                        uniqueVals.add(cleanedCode);
                    }
                } catch (e) {
                    uniqueVals.add(String(val).trim());
                }
            } else {
                uniqueVals.add(String(val).trim());
            }
        });

        optionsMap[key] = Array.from(uniqueVals).sort((a, b) => a.localeCompare(b));
    });

    return optionsMap;
});

const dataBounds = computed(() => {
    const years = props.vehicles.map(v => v.modelYear).filter(Boolean);
    const ranges = props.vehicles.map(v => v.rangeEpaCombined).filter(Boolean);
    const speeds = props.vehicles.map(v => v.chargingSpeedDc).filter(Boolean);

    return {
        modelYear: {
            min: years.length ? Math.min(...years) : 2018,
            max: years.length ? Math.max(...years) : ((new Date()).getFullYear() + 1)
        },
        rangeEpaCombined: {
            min: ranges.length ? Math.min(...ranges) : 0,
            max: ranges.length ? Math.max(...ranges) : 500
        },
        chargingSpeedDc: {
            min: speeds.length ? Math.min(...speeds) : 0,
            max: speeds.length ? Math.max(...speeds) : 350
        }
    };
});

const currentFilters = ref<FilterState | null>(null);

const updateFilters = (newFilters: any) => {
    currentFilters.value = { ...newFilters };
};

const filteredVehicles = computed(() => {
    if (!currentFilters.value) return props.vehicles;

    const filters = currentFilters.value;
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    return props.vehicles.filter(vehicle => {
        // 1. Multi-select string categories (Updated to evaluate mixed strings and sub-arrays accurately)
        const stringCategories = ['manufacturer', 'drivetrain', 'sizeClass', 'batteryChemistry', 'chargingPort', 'countryOfAssembly', 'infotainmentOperatingSystem', 'soundSystemBrand'] as const;

        const matchesStrings = stringCategories.every(key => {
            const selections = filters[key];
            if (!selections || selections.length === 0) return true;

            const rawValue = vehicle[key];
            if (rawValue === null || rawValue === undefined) return false;

            // Normalize the vehicle property value for a clean lookup evaluation
            let targetValues: string[] = [];
            if (Array.isArray(rawValue)) {
                targetValues = rawValue.map(v => String(v).trim());
            } else if (key === 'countryOfAssembly') {
                try {
                    const cleanedCode = String(rawValue).trim().toUpperCase();
                    targetValues = [regionNames.of(cleanedCode) || cleanedCode];
                } catch (e) {
                    targetValues = [String(rawValue).trim()];
                }
            } else {
                targetValues = [String(rawValue).trim()];
            }

            // A vehicle matches if at least one of its normalized attributes is included in the user's active filter checkboxes
            return targetValues.some(val => selections.includes(val));
        });

        // 2. Boolean features
        const booleanCategories = ['supportBatteryPreconditioning', 'supportTeslaSupercharging', 'supportIso15118', 'supportPhoneAsAKey', 'hasPoweredLiftgate', 'supportOnePedalDrive', 'hasAdaptiveCruiseControl', 'hasGlassRoof', 'supportsAppleCarPlay', 'supportsAndroidAuto', 'hasPoweredSeats', 'hasVentilatedSeats', 'hasHeatedSeats', 'hasHeatedSteeringWheel', 'hasHeatPump', 'hasPoweredSideMirrors', 'hasDashcam', 'hasAutoDimmingMirrors'] as const;

        const matchesBooleans = booleanCategories.every(key => {
            const filterVal = filters[key];
            if (filterVal === null) return true;

            const rawValue = vehicle[key];
            let isVehicleFeatureTrue = false;

            if (typeof rawValue === 'boolean') {
                isVehicleFeatureTrue = rawValue;
            } else if (typeof rawValue === 'string') {
                const lower = rawValue.trim().toLowerCase();
                isVehicleFeatureTrue = lower.length > 0 && lower !== 'false' && lower !== 'no' && lower !== 'n/a';
            } else if (Array.isArray(rawValue)) {
                isVehicleFeatureTrue = rawValue.length > 0;
            } else if (rawValue) {
                isVehicleFeatureTrue = true;
            }

            return isVehicleFeatureTrue === filterVal;
        });

        // 3. Dynamic numeric slider checks
        const vehicleYear = Number(vehicle.modelYear);
        const vehicleRange = Number(vehicle.rangeEpaCombined);
        const vehicleSpeed = Number(vehicle.chargingSpeedDc);

        const filterYearMin = Number(filters.modelYear.min);
        const filterRangeMin = Number(filters.rangeEpaCombined.min);
        const filterSpeedMin = Number(filters.chargingSpeedDc.min);

        const matchesRanges =
            (!isNaN(vehicleYear) && vehicleYear >= filterYearMin) &&
            (!isNaN(vehicleRange) && vehicleRange >= filterRangeMin) &&
            (!isNaN(vehicleSpeed) && vehicleSpeed >= filterSpeedMin);

        return matchesStrings && matchesBooleans && matchesRanges;
    });
});
</script>

<template>
    <div>
        <GridFilter :bounds="dataBounds" :options="dynamicFilterOptions" @filter-change="updateFilters" />

        <div class="grid-container">
            <div v-for="(vehicle, index) in filteredVehicles" :key="index" class="grid-item">
                <h3>{{ vehicle.modelYear }} {{ vehicle.manufacturer }} {{ vehicle.model }}</h3>
                <p><strong>Trim:</strong> {{ vehicle.trim }}</p>
                <p><strong>Specs:</strong> {{ vehicle.sizeClass }} | {{ Array.isArray(vehicle.chargingPort) ?
                    vehicle.chargingPort.join(' & ') : vehicle.chargingPort }}</p>
            </div>
            <div v-if="filteredVehicles.length === 0" class="no-results">
                No vehicles match your selected filters.
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
}

.grid-item {
    border: 1px solid #ddd;
    padding: 16px;
    border-radius: 8px;
}

.no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #666;
}
</style>