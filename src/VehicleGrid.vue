<script setup lang="ts">
import { computed, ref } from 'vue';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

import GridFilter, { type FilterState } from './GridFilter.vue';

countries.registerLocale(enLocale);

const baseUrl = import.meta.env.BASE_URL;

interface Vehicle {
    modelYear: number;
    manufacturer: string;
    model: string;
    trim: string;
    driveAxle: string;
    batteryCapacityNet: number;
    vehicleType: string;
    epaCombinedRangeMi: number;
    chargingPorts: string | string[];
    dcChargingSpeedKw: number;
    batteryChemistry: string;
    countryOfAssembly: string;
    infotainmentOperatingSystem: string;
    soundSystemBrand: string;
    supportBatteryPreconditioning: any;
    supportTeslaSupercharging: any;
    supportIso15118: any;
    supportsPhoneAsAKey: any;
    hasPoweredLiftgate: any;
    hasOnePedalDrive: any;
    hasAdaptiveCruiseControl: any;
    hasGlassRoof: any;
    supportsCarPlayAndroidAuto: any;
    hasPoweredSeats: any;
    hasVentilatedSeats: any;
    hasHeatedSeats: any;
    hasHeatedSteeringWheel: any;
    hasHeatPump: any;
    hasPoweredSideMirrors: any;
    hasDashcam: any;
    hasAutoDimmingMirrors: any;
    [key: string]: any;
}

const props = defineProps<{
    vehicles: Vehicle[];
}>();

const getCountryNameFromIsoAlphaThreeCode = (alpha3Code: string): string => {
    if (!alpha3Code) return '';
    const cleaned = String(alpha3Code).trim().toUpperCase();
    try {
        return countries.getName(cleaned, 'en') || cleaned;
    } catch (e) {
        console.error('Intl.DisplayNames matching failed:', cleaned, e);
    }
    return cleaned;
};

// Converts the charging port name into a normalized array, splitting comma-separated strings
const getChargingPortsArray = (portValue: any): string[] => {
    if (!portValue) return [];

    if (Array.isArray(portValue)) {
        return portValue.flatMap(p =>
            String(p).split(',').map(item => item.trim())
        ).filter(Boolean);
    }

    return String(portValue)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
};

const getChargingPortIconUrl = (portName: string): string => {
    if (!portName) return '';
    const filename = portName.toLowerCase().replace(/[\s-]/g, '');
    return `${baseUrl}/icons/${filename}.svg`;
};

const dynamicFilterOptions = computed(() => {
    const stringCategories = [
        'manufacturer', 'driveAxle', 'vehicleType', 'batteryChemistry',
        'chargingPorts', 'countryOfAssembly', 'infotainmentOperatingSystem', 'soundSystemBrand'
    ] as const;

    const optionsMap: Record<string, string[]> = {};

    stringCategories.forEach(key => {
        const uniqueVals = new Set<string>();

        props.vehicles.forEach(v => {
            // Check fallback for structural property keys
            let val = v[key];
            if (key === 'infotainmentOperatingSystem' && val === undefined) {
                val = v.infotainmentOs;
            }

            if (val === null || val === undefined || val === '') return;

            if (Array.isArray(val)) {
                val.forEach(item => {
                    if (item) uniqueVals.add(String(item).trim());
                });
            } else if (key === 'countryOfAssembly') {
                const fullCountryName = getCountryNameFromIsoAlphaThreeCode(String(val));
                if (fullCountryName) {
                    uniqueVals.add(fullCountryName);
                }
            } else if (typeof val === 'string' && val.includes(',')) {
                val.split(',').forEach(item => uniqueVals.add(item.trim()));
            } else {
                uniqueVals.add(String(val).trim());
            }
        });

        optionsMap[key] = Array.from(uniqueVals).sort((a, b) => a.localeCompare(b));
    });

    // Provide options via both naming variations to keep child configurations stable
    if (optionsMap.infotainmentOperatingSystem) {
        optionsMap.infotainmentOs = optionsMap.infotainmentOperatingSystem;
    }

    return optionsMap;
});

const dataBounds = computed(() => {
    const years = props.vehicles.map(v => v.modelYear).filter(Boolean);
    const ranges = props.vehicles.map(v => v.epaCombinedRangeMi).filter(Boolean);
    const speeds = props.vehicles.map(v => v.dcChargingSpeedKw).filter(Boolean);

    return {
        modelYear: {
            min: years.length ? Math.min(...years) : 2018,
            max: years.length ? Math.max(...years) : ((new Date()).getFullYear() + 1)
        },
        epaCombinedRangeMi: {
            min: ranges.length ? Math.max(0, Math.min(...ranges)) : 0,
            max: ranges.length ? Math.max(0, Math.max(...ranges)) : 500
        },
        dcChargingSpeedKw: {
            min: speeds.length ? Math.max(0, Math.min(...speeds)) : 0,
            max: speeds.length ? Math.max(0, Math.max(...speeds)) : 350
        }
    };
});

const currentFilters = ref<FilterState | null>(null);
const selectedVehicleIndex = ref<number | null>(null);

const updateFilters = (newFilters: FilterState) => {
    currentFilters.value = { ...newFilters };
};

const toggleSelectVehicle = (index: number) => {
    selectedVehicleIndex.value = selectedVehicleIndex.value === index ? null : index;
};

const formatDisplaySpecs = (vehicle: Vehicle) => {
    const skipKeys = ['modelYear', 'manufacturer', 'model', 'trim', 'driveAxle'];

    // Distinct standalone tokens that must be fully forced to uppercase
    const acronyms = ['Epa', 'Dc', 'Iso', 'Os', 'Ota', 'Ac', 'V'];

    return Object.entries(vehicle)
        .filter(([key, value]) => !skipKeys.includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            let label = key;

            if (label === 'infotainmentOs') {
                label = 'infotainmentOperatingSystem';
            }

            // 1. Initial generic camelCase boundary spacing
            label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
            label = label.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
            label = label.replace(/^./, str => str.toUpperCase());

            // 2. Clear alphanumeric transitions (e.g., 'Ac277v' -> 'Ac 277 v', 'Iso15118' -> 'Iso 15118')
            label = label.replace(/([a-zA-Z])(\d+)/g, '$1 $2');
            label = label.replace(/(\d+)([a-zA-Z])/g, '$1 $2');
            label = label.replace(/\s+/g, ' ').trim();

            // 3. Dynamic Acronym Capitalization
            acronyms.forEach(acronym => {
                const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
                label = label.replace(regex, acronym.toUpperCase());
            });

            // 4. Exact contextual word repairs
            label = label.replace(/\bCar\s+Play\b/gi, 'CarPlay');
            label = label.replace(/\bV\s*2\s*X\b/gi, 'V2X');
            label = label.replace(/\bAnd\b/g, '&');

            // 5. Tail-end layout unit formatting using an ordered dictionary loop
            const unitReplacements: Record<string, string> = {
                'KWH 100 MI': '(kWh / 100mi)',
                'WH MI': '(Wh/mi)',
                'KWH': '(kWh)',
                'KW': '(kW)',
                'MI': '(mi)',
                'IN': '(in)',
                'L': '(L)'
            };

            for (const [rawTarget, formattedValue] of Object.entries(unitReplacements)) {
                const targetRegex = new RegExp(`\\b${rawTarget}$`, 'i');
                if (targetRegex.test(label)) {
                    label = label.replace(targetRegex, formattedValue);
                    break; // Escape immediately so sub-tokens don't trigger double parentheticals
                }
            }

            // 6. Close up structural layout gaps for units following digits (e.g., '277 V' -> '277V')
            label = label.replace(/(\d+)\s+V\b/g, '$1V');
            label = label.replace(/\s+/g, ' ').trim();

            let displayValue = value;
            if (key === 'countryOfAssembly') {
                displayValue = getCountryNameFromIsoAlphaThreeCode(String(value));
            } else if (Array.isArray(value)) {
                displayValue = value.join(', ');
            }

            return { label, val: displayValue };
        });
};

const evaluateFeaturePresence = (key: string, rawValue: any): boolean => {
    if (rawValue === null || rawValue === undefined) return false;
    const cleanStr = String(rawValue).trim().toLowerCase();

    switch (key) {
        case 'hasPoweredLiftgate':
        case 'hasGlassRoof':
            return cleanStr !== 'no' && cleanStr !== 'false' && cleanStr !== '';

        case 'hasOnePedalDrive':
            return cleanStr !== 'no' && cleanStr !== 'false' && cleanStr !== '';

        case 'supportsPhoneAsAKey':
            return cleanStr !== 'no';

        case 'hasAdaptiveCruiseControl':
            return !cleanStr.includes('no');

        case 'supportsCarPlayAndroidAuto':
            return cleanStr.includes('yes') || (cleanStr !== 'no' && cleanStr !== 'false' && cleanStr !== '');

        // Comfort and alternative tech feature rules (match if present and not 'no')
        default:
            return cleanStr !== 'no' && cleanStr !== 'false' && cleanStr !== '';
    }
};

const filteredVehicles = computed(() => {
    if (!currentFilters.value) return props.vehicles;

    const filters = currentFilters.value;

    return props.vehicles.filter(vehicle => {
        const stringCategories = [
            'manufacturer', 'driveAxle', 'vehicleType', 'batteryChemistry',
            'chargingPorts', 'countryOfAssembly', 'infotainmentOperatingSystem', 'soundSystemBrand'
        ] as const;

        const matchesStrings = stringCategories.every(key => {
            const selections = filters[key];
            if (!selections || selections.length === 0) return true;

            let rawValue = vehicle[key];
            if (key === 'infotainmentOperatingSystem' && rawValue === undefined) {
                rawValue = vehicle.infotainmentOs;
            }

            if (rawValue === null || rawValue === undefined) return false;

            let targetValues: string[] = [];
            if (Array.isArray(rawValue)) {
                targetValues = rawValue.map(v => String(v).trim());
            } else if (key === 'countryOfAssembly') {
                targetValues = [getCountryNameFromIsoAlphaThreeCode(String(rawValue))];
            } else if (typeof rawValue === 'string' && rawValue.includes(',')) {
                targetValues = rawValue.split(',').map(v => v.trim());
            } else {
                targetValues = [String(rawValue).trim()];
            }

            return targetValues.some(val => selections.includes(val));
        });

        const booleanCategories = [
            'supportBatteryPreconditioning', 'supportTeslaSupercharging', 'supportIso15118',
            'supportsPhoneAsAKey', 'hasPoweredLiftgate', 'hasOnePedalDrive', 'hasAdaptiveCruiseControl',
            'hasGlassRoof', 'supportsCarPlayAndroidAuto', 'hasPoweredSeats', 'hasVentilatedSeats',
            'hasHeatedSeats', 'hasHeatedSteeringWheel', 'hasHeatPump', 'hasPoweredSideMirrors',
            'hasDashcam', 'hasAutoDimmingMirrors'
        ] as const;

        const matchesBooleans = booleanCategories.every(key => {
            const filterVal = filters[key];
            if (filterVal === null) return true;

            const isVehicleFeatureTrue = evaluateFeaturePresence(key, vehicle[key]);
            return isVehicleFeatureTrue === filterVal;
        });

        const vehicleYear = Number(vehicle.modelYear);
        const vehicleRange = Number(vehicle.epaCombinedRangeMi);
        const vehicleSpeed = Number(vehicle.dcChargingSpeedKw);

        const filterYearMin = Number(filters.modelYear.min);
        const filterRangeMin = Number(filters.epaCombinedRangeMi.min);
        const filterSpeedMin = Number(filters.dcChargingSpeedKw.min);

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
                        <strong>{{ vehicle.trim }}</strong>
                        <span class="drivetrain-pill">{{ vehicle.driveAxle }}</span>
                        <span :data-tooltip="vehicle.batteryChemistry" class="tooltip-wrapper">
                            <span class="battery-pill">{{ vehicle.netBatteryCapacityKwh }} kWh</span>
                        </span>
                    </p>
                    <p class="specs-preview-summary">
                        <span>{{ vehicle.vehicleType }}</span>
                        <span class="summary-bullet">&bull;</span>
                        <span>{{ vehicle.epaCombinedRangeMi }} mi range</span>
                        <span class="summary-bullet">&bull;</span>
                        <span class="inline-charger-container">
                            <span v-for="(port, pIdx) in getChargingPortsArray(vehicle.chargingPorts)" :key="port"
                                class="inline-charger-item">
                                <span :data-tooltip="port" class="tooltip-wrapper">
                                    <img :src="getChargingPortIconUrl(port)" :alt="port" class="charger-inline-icon" />
                                </span>
                                <span v-if="pIdx < getChargingPortsArray(vehicle.chargingPorts).length - 1"
                                    class="charger-separator">&amp;</span>
                            </span>
                        </span>
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

.battery-pill {
    background: #f0fdf4;
    color: #166534;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    cursor: help;
}

.specs-preview-summary {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.2;
}

.summary-bullet {
    user-select: none;
}

.inline-charger-container {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.inline-charger-item {
    display: inline-flex;
    align-items: center;
}

.charger-inline-icon {
    height: 28px;
    width: auto;
    display: inline-block;
    object-fit: contain;
    cursor: help;
    transition: transform 0.1s ease;
}

.charger-inline-icon:hover {
    transform: scale(1.08);
}

.charger-separator {
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    margin-left: 6px;
    user-select: none;
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
    align-items: flex-end;
    font-size: 13px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 4px;
}

.spec-label {
    color: #64748b;
    font-weight: 500;
    padding-right: 8px;
    text-align: left;
}

.spec-value {
    color: #0f172a;
    font-weight: 600;
    text-align: right;
    word-break: break-word;
}

.no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px;
    color: #64748b;
}

.tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.tooltip-wrapper::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1e293b;
    color: #ffffff;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tooltip-wrapper::before {
    content: '';
    position: absolute;
    bottom: 105%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #1e293b transparent transparent transparent;
    opacity: 0;
    pointer-events: none;
    z-index: 10;
}

.tooltip-wrapper:hover::after,
.tooltip-wrapper:hover::before {
    opacity: 1;
}
</style>