<script setup lang="ts">
import { computed, ref } from 'vue';
import GridFilter, { type FilterState } from './GridFilter.vue';

const props = defineProps<{
    vehicles: any[];
}>();

// Resolves 3-letter ISO codes natively to English names without hardcoded lists
const getFullRegionName = (alpha3: string): string => {
    if (!alpha3) return '';
    const cleaned = String(alpha3).trim().toUpperCase();

    try {
        // Feed the three-letter code as an undetermined primary language subtag layout
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const resolvedName = regionNames.of(cleaned);
        if (resolvedName && resolvedName !== cleaned) {
            return resolvedName;
        }
    } catch (e) {
        console.error('Intl.DisplayNames matching failed:', cleaned, e);
    }
    return cleaned;
};

const dynamicFilterOptions = computed(() => {
    const stringCategories = [
        'manufacturer', 'drivetrain', 'sizeClass', 'batteryChemistry',
        'chargingPort', 'countryOfAssembly', 'infotainmentOperatingSystem', 'soundSystemBrand'
    ] as const;

    const optionsMap: Record<string, string[]> = {};

    stringCategories.forEach(key => {
        const uniqueVals = new Set<string>();

        props.vehicles.forEach(v => {
            const val = v[key];
            if (val === null || val === undefined || val === '') return;

            if (Array.isArray(val)) {
                val.forEach(item => {
                    if (item) uniqueVals.add(String(item).trim());
                });
            } else if (key === 'countryOfAssembly') {
                const fullCountryName = getFullRegionName(String(val));
                if (fullCountryName) {
                    uniqueVals.add(fullCountryName);
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
const selectedVehicleIndex = ref<number | null>(null);

const updateFilters = (newFilters: any) => {
    currentFilters.value = { ...newFilters };
};

const toggleSelectVehicle = (index: number) => {
    selectedVehicleIndex.value = selectedVehicleIndex.value === index ? null : index;
};

const formatDisplaySpecs = (vehicle: any) => {
    const skipKeys = ['modelYear', 'manufacturer', 'model', 'trim', 'drivetrain'];

    return Object.entries(vehicle)
        .filter(([key, value]) => !skipKeys.includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            let displayValue = value;

            if (key === 'countryOfAssembly') {
                displayValue = getFullRegionName(String(value));
            } else if (Array.isArray(value)) {
                displayValue = value.join(', ');
            }
            return { label, val: displayValue };
        });
};

const filteredVehicles = computed(() => {
    if (!currentFilters.value) return props.vehicles;

    const filters = currentFilters.value;

    return props.vehicles.filter(vehicle => {
        const stringCategories = ['manufacturer', 'drivetrain', 'sizeClass', 'batteryChemistry', 'chargingPort', 'countryOfAssembly', 'infotainmentOperatingSystem', 'soundSystemBrand'] as const;

        const matchesStrings = stringCategories.every(key => {
            const selections = filters[key];
            if (!selections || selections.length === 0) return true;

            const rawValue = vehicle[key];
            if (rawValue === null || rawValue === undefined) return false;

            let targetValues: string[] = [];
            if (Array.isArray(rawValue)) {
                targetValues = rawValue.map(v => String(v).trim());
            } else if (key === 'countryOfAssembly') {
                targetValues = [getFullRegionName(String(rawValue))];
            } else {
                targetValues = [String(rawValue).trim()];
            }

            return targetValues.some(val => selections.includes(val));
        });

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
    <div class="grid-layout-wrapper">
        <GridFilter :bounds="dataBounds" :options="dynamicFilterOptions" @filter-change="updateFilters" />

        <div class="grid-container">
            <div v-for="(vehicle, index) in filteredVehicles" :key="index" class="grid-item"
                :class="{ 'is-selected': selectedVehicleIndex === index }" @click="toggleSelectVehicle(index)">

                <div class="card-main-meta">
                    <h3>{{ vehicle.modelYear }} {{ vehicle.manufacturer }} {{ vehicle.model }}</h3>
                    <p class="trim-drivetrain-line">
                        <strong>Trim:</strong> {{ vehicle.trim }} <span class="drivetrain-pill">{{ vehicle.drivetrain
                            }}</span>
                    </p>
                    <p class="specs-preview-summary">
                        {{ vehicle.sizeClass }} &bull; {{ vehicle.rangeEpaCombined }} mi range &bull; {{
                            Array.isArray(vehicle.chargingPort) ? vehicle.chargingPort.join(' & ') : vehicle.chargingPort }}
                    </p>
                </div>

                <div v-if="selectedVehicleIndex === index" class="specs-expanded-drawer" @click.stop>
                    <hr />
                    <h4>Full Technical Specifications</h4>
                    <div class="specs-matrix-grid">
                        <div v-for="spec in formatDisplaySpecs(vehicle)" :key="spec.label" class="spec-matrix-row">
                            <span class="spec-label">{{ spec.label }}:</span>
                            <span class="spec-value">{{ spec.val }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="filteredVehicles.length === 0" class="no-results">
                No vehicles match your selected filters.
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-layout-wrapper {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.grid-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 20px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
}

.grid-item:hover {
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.grid-item.is-selected {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    grid-column: 1 / -1;
}

.trim-drivetrain-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    font-size: 14px;
}

.drivetrain-pill {
    background: #eff6ff;
    color: #1e40af;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
}

.specs-preview-summary {
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

.specs-expanded-drawer {
    margin-top: 16px;
    cursor: default;
}

.specs-expanded-drawer hr {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin-bottom: 16px;
}

.specs-expanded-drawer h4 {
    margin: 0 0 12px 0;
    color: #1e293b;
    font-size: 14px;
    font-weight: 600;
}

.specs-matrix-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px 32px;
}

.spec-matrix-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 4px;
}

.spec-label {
    color: #64748b;
    font-weight: 500;
}

.spec-value {
    color: #0f172a;
    font-weight: 600;
}

.no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px;
    color: #64748b;
}
</style>