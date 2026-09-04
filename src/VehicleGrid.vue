<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRaw } from 'vue';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

import GridFilter, { type FilterState } from './GridFilter.vue';

countries.registerLocale(enLocale);

export interface Vehicle {
    modelYear: number;
    manufacturer: string;
    model: string | number;
    trim: string;
    market: string;
    driveAxle: string;
    vehicleType: string;
    epaCombEfficiencyKwh100mi: number | null;
    epaCombEfficiencyWhMi: number | null;
    epaCombinedRangeMi: number | null;
    netBatteryCapacityKwh: number | null;
    batteryChemistry: string | null;
    recommendedDailyChargePercent: number | null;
    typicalFullRangeMi: number | null;
    chargingPorts: string | null;
    dcChargingSpeedKw: number | null;
    onboardChargerAmps: number | null;
    supportsAc277vCharging: string | null;
    supportsBatteryPreconditioning: string | null;
    supportsSuperchargerAccess: string | null;
    supportsPlugAndChargeIso15118: string | null;
    plugAndChargeProviders: string | null;
    supportsPhoneAsAKey: string | null;
    maxPhoneKeys: number | string | null;
    hasPoweredLiftgate: string | null;
    hasOnePedalDrive: string | null;
    hasPersistentOnePedalDrive: string | null;
    hasAdaptiveCruiseControl: string | null;
    hasGlassRoof: string | null;
    soundPowerWatts: number | null;
    speakerCount: number | null;
    subwooferCount: number | null;
    soundDolbyAtmos: string | null;
    soundSystemBrand: string | null;
    supportsCarPlayAndroidAuto: string | null;
    infotainmentOs: string | null;
    infotainmentScreenSizeIn: number | null;
    navigationProvider: string | null;
    hasPoweredSeats: string | null;
    hasVentilatedSeats: string | null;
    hasHeatedSeats: string | null;
    hasHeatedSteeringWheel: string | null;
    hasHeatPump: string | null;
    supportsOta: string | null;
    hasGarageDoorOpener: string | null;
    countryOfAssembly: string | null;
    hasUserProfiles: string | null;
    hasSeatMirrorPerProfile: string | null;
    hasPoweredSideMirrors: string | null;
    hasBuiltInDashcam: string | null;
    standardSeatMaterial: string | null;
    frunkCapacityL: number | null;
    voltageArchitecture: string | null;
    maxSupportedDcChargingVoltage: string | null;
    batteryNominalVoltage: string | number | null;
    supportsV2x: string | null;
    seatCount: number | string | null;
    hasPetMode: string | null;
    exteriorCameraCount: number | null;
    interiorCameraCount: number | null;
    driverCameraType: string | null;
    exteriorSensors: string | null;
    vehicleWarranty: string | null;
    batteryDriveUnitWarranty: string | null;
    corrosionWarranty: string | null;
    towingCapacity: string | null;
    usbPorts: string | null;
    includedConnectivityFeatures: string | null;
    optionalConnectivityFeatures: string | null;
    requiredFeatureSubscriptions: string | null;
    optionalSubscriptions: string | null;
    heightInches: number | null;
    widthInches: number | null;
    lengthInches: number | null;
    groundClearanceInches: number | null;
    grossWeightPounds: number | null;
    powerHorsepower: number | null;
    torqueFootPounds: number | null;
    zeroToSixtyTime: number | null;
    turningRadiusFeet: number | null;
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

// Converts the charging port name into an array, splitting comma-separated strings
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
    return new URL(`./assets/icons/${filename}.svg`, import.meta.url).href;
};

const dynamicFilterOptions = computed(() => {
    const stringCategories = [
        'manufacturer', 'driveAxle', 'vehicleType', 'batteryChemistry',
        'chargingPorts', 'countryOfAssembly', 'infotainmentOs', 'soundSystemBrand'
    ] as const;

    const optionsMap: Record<string, string[]> = {};

    stringCategories.forEach(key => {
        const uniqueVals = new Set<string>();

        props.vehicles.forEach(v => {
            // Check fallback for structural property keys
            let val = v[key];
            if (key === 'infotainmentOs' && val === undefined) {
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

    return optionsMap;
});

const dataBounds = computed(() => {
    const modelYears = props.vehicles.map(v => v.modelYear).filter(Boolean);
    const epaRanges = props.vehicles.map(v => v.epaCombinedRangeMi).filter(Boolean);
    const dcChargingSpeeds = props.vehicles.map(v => v.dcChargingSpeedKw).filter(Boolean);

    const validRanges = epaRanges.filter((r): r is number => r !== null);
    const validSpeeds = dcChargingSpeeds.filter((s): s is number => s !== null);

    return {
        modelYear: {
            min: modelYears.length ? Math.min(...modelYears) : 2018,
            max: modelYears.length ? Math.max(...modelYears) : ((new Date()).getFullYear() + 1)
        },
        epaCombinedRangeMi: {
            min: epaRanges.length ? Math.max(0, Math.min(...validRanges)) : 0,
            max: epaRanges.length ? Math.max(0, Math.max(...validRanges)) : 500
        },
        dcChargingSpeedKw: {
            min: dcChargingSpeeds.length ? Math.max(0, Math.min(...validSpeeds)) : 0,
            max: dcChargingSpeeds.length ? Math.max(0, Math.max(...validSpeeds)) : 350
        }
    };
});

const currentFilters = ref<FilterState | null>(null);
const selectedVehicleKey = ref<string | null>(null);

const technicalCategories = [
    { id: 'chargingPerformance', title: 'Charging & Performance' },
    { id: 'features', title: 'Features' },
    { id: 'infotainmentTechnology', title: 'Infotainment & Technology' },
    { id: 'marketWarranty', title: 'Market & Warranty' },
    { id: 'connectivitySubscriptions', title: 'Connectivity & Subscriptions' },
    { id: 'dimensions', title: 'Dimensions' },
] as const;

type CategoryId = (typeof technicalCategories)[number]['id'];

const activeTabId = ref<CategoryId>(technicalCategories[0].id);

const categoryMappings: Record<CategoryId, string[]> = {
    chargingPerformance: [
        'epaCombEfficiencyKwh100mi', 'epaCombEfficiencyWhMi', 'epaCombinedRangeMi',
        'typicalFullRangeMi', 'netBatteryCapacityKwh', 'batteryChemistry',
        'recommendedDailyChargePercent', 'chargingPorts', 'dcChargingSpeedKw',
        'onboardChargerAmps', 'supportsAc277vCharging', 'supportsBatteryPreconditioning',
        'supportsSuperchargerAccess', 'supportsPlugAndChargeIso15118', 'plugAndChargeProviders',
        'voltageArchitecture', 'maxSupportedDcChargingVoltage', 'batteryNominalVoltage',
        'supportsV2x', 'towingCapacity', 'powerHorsepower', 'torqueFootPounds', 'zeroToSixtyTime'
    ],
    marketWarranty: [
        'vehicleType', 'market', 'countryOfAssembly', 'vehicleWarranty',
        'corrosionWarranty', 'batteryDriveUnitWarranty'
    ],
    features: [
        'hasPoweredLiftgate', 'hasOnePedalDrive', 'hasPersistentOnePedalDrive',
        'hasAdaptiveCruiseControl', 'hasGlassRoof', 'hasPoweredSeats',
        'hasVentilatedSeats', 'hasHeatedSeats', 'hasHeatedSteeringWheel',
        'hasHeatPump', 'hasGarageDoorOpener', 'frunkCapacityL', 'seatCount',
        'standardSeatMaterial', 'hasPetMode', 'hasPoweredSideMirrors', 'usbPorts'
    ],
    infotainmentTechnology: [
        'supportsPhoneAsAKey', 'maxPhoneKeys', 'soundPowerWatts', 'speakerCount',
        'subwooferCount', 'soundDolbyAtmos', 'soundSystemBrand', 'supportsCarPlayAndroidAuto',
        'infotainmentOs', 'infotainmentScreenSizeIn', 'navigationProvider', 'supportsOta',
        'hasUserProfiles', 'hasSeatMirrorPerProfile', 'hasBuiltInDashcam',
        'exteriorCameraCount', 'interiorCameraCount', 'driverCameraType', 'exteriorSensors'
    ],
    connectivitySubscriptions: [
        'includedConnectivityFeatures', 'optionalConnectivityFeatures', 'requiredFeatureSubscriptions', 'optionalSubscriptions'
    ],
    dimensions: [
        'heightInches', 'widthInches', 'lengthInches', 'groundClearanceInches',
        'grossWeightPounds', 'turningRadiusFeet'
    ]
};

const getFilteredSpecs = (vehicle: Vehicle, tabId: CategoryId) => {
    const rawSpecs = formatDisplaySpecs(vehicle);
    const targets = (categoryMappings[tabId] || []).map(k => k.toLowerCase());
    return rawSpecs.filter(spec =>
        targets.includes(spec.originalKey.toLowerCase())
    );
};

const updateFilters = (newFilters: FilterState) => {
    currentFilters.value = { ...newFilters };
};

const toggleSelectVehicle = (vehicle: Vehicle) => {
    const key = getVehicleKey(vehicle);
    selectedVehicleKey.value = selectedVehicleKey.value === key ? null : key;
};

const closeSelectedVehicle = () => {
    selectedVehicleKey.value = null;
};

// Cache evaluation of technical specifications for the active vehicle
const activeVehicle = computed(() => {
    if (!selectedVehicleKey.value) return null;
    return props.vehicles.find(v => getVehicleKey(v) === selectedVehicleKey.value) || null;
});

const activeVehicleSpecs = computed(() => {
    if (!activeVehicle.value) return [];
    return getFilteredSpecs(activeVehicle.value, activeTabId.value);
});

const formatDisplaySpecs = (vehicle: Vehicle) => {
    const skipKeys = ['modelYear', 'manufacturer', 'model', 'trim', 'driveAxle'];
    // Distinct standalone tokens that must be fully forced to uppercase
    const acronyms = ['Epa', 'Dc', 'Iso', 'Os', 'Ota', 'Ac', 'V'];

    return Object.entries(vehicle)
        .filter(([key, value]) => !skipKeys.includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            let label = key;

            // Camel Case handling
            label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
            label = label.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
            label = label.replace(/^./, str => str.toUpperCase());

            // Alphanumeric term handling (e.g., 'Ac277v' -> 'Ac 277 v', 'Iso15118' -> 'Iso 15118')
            label = label.replace(/([a-zA-Z])(\d+)/g, '$1 $2');
            label = label.replace(/(\d+)([a-zA-Z])/g, '$1 $2');
            label = label.replace(/\s+/g, ' ').trim();

            // Acronym capitalization
            acronyms.forEach(acronym => {
                const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
                label = label.replace(regex, acronym.toUpperCase());
            });

            // Term-specific edge cases
            label = label.replace(/\bCar\s+Play\b/gi, 'CarPlay');
            label = label.replace(/\bV\s*2\s*X\b/gi, 'V2X');
            label = label.replace(/\bAnd\b/g, '&');

            // Unit formatting
            const unitReplacements: Record<string, string> = {
                'KWH 100 MI': '(kWh / 100mi)',
                'WH MI': '(Wh/mi)',
                'KWH': '(kWh)',
                'KW': '(kW)',
                'MI': '(mi)',
                'IN': '(in)',
                'L': '(L)',
                'Percent': '%'
            };

            for (const [rawTarget, formattedValue] of Object.entries(unitReplacements)) {
                const targetRegex = new RegExp(`\\b${rawTarget}$`, 'i');
                if (targetRegex.test(label)) {
                    label = label.replace(targetRegex, formattedValue);
                    break;
                }
            }

            // Voltage unit handling (e.g., '277 V' -> '277V')
            label = label.replace(/(\d+)\s+V\b/g, '$1V');
            label = label.replace(/\s+/g, ' ').trim();
            // Convert ISO Alpha-3 Country Code to Full Country Name
            let displayValue = value;
            if (['countryOfAssembly', 'market'].includes(key)) {
                displayValue = getCountryNameFromIsoAlphaThreeCode(String(value));
            } else if (Array.isArray(value)) {
                displayValue = value.join(', ');
            }

            return { label, val: displayValue, originalKey: key };
        });
};

const evaluateFeaturePresence = (key: string, rawValue: unknown): boolean => {
    if (rawValue === null || rawValue === undefined) return false;

    if (typeof rawValue === 'boolean') return rawValue;

    // Treat 1 or higher as true, 0 or lower as false
    if (typeof rawValue === 'number') return rawValue > 0;

    // String cleanup
    const cleanStr = String(rawValue).trim().toLowerCase();

    // Catch explicit positive values
    if (cleanStr === 'yes' || cleanStr === 'true' || cleanStr === '1') {
        return true;
    }

    // Catch explicit negative values
    if (cleanStr === 'no' || cleanStr === 'false' || cleanStr === '0' || cleanStr === 'none') {
        return false;
    }

    // Descriptive string handling
    switch (key) {
        case 'hasAdaptiveCruiseControl':
            return !cleanStr.includes('no');

        case 'supportsCarPlayAndroidAuto':
            return cleanStr.includes('yes') || cleanStr.includes('true');

        default:
            // If the string doesn't match any explicit negative identifiers,
            // check if it contains positive signals or default to true for non-empty data strings.
            return cleanStr.length > 0;
    }
};

const filteredVehicles = computed(() => {
    if (!currentFilters.value) return props.vehicles;

    const filters = currentFilters.value;

    return props.vehicles.filter(vehicle => {
        const stringCategories = [
            'manufacturer', 'driveAxle', 'vehicleType', 'batteryChemistry',
            'chargingPorts', 'countryOfAssembly', 'infotainmentOs', 'soundSystemBrand'
        ] as const;

        const matchesStrings = stringCategories.every(key => {
            const selections = filters[key];
            if (!selections || selections.length === 0) return true;

            let rawValue = vehicle[key];
            if (key === 'infotainmentOs' && rawValue === undefined) {
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
            'supportsPhoneAsAKey', 'hasPoweredLiftgate', 'hasOnePedalDrive', 'hasAdaptiveCruiseControl',
            'hasGlassRoof', 'supportsCarPlayAndroidAuto', 'hasPoweredSeats', 'hasVentilatedSeats',
            'hasHeatedSeats', 'hasHeatedSteeringWheel', 'hasHeatPump', 'hasPoweredSideMirrors',
            'hasPetMode', 'soundDolbyAtmos'
        ] as const;

        const matchesBooleans = booleanCategories.every(key => {
            const filterVal = filters[key];
            if (filterVal === null) return true;

            let vehicleValue = undefined;

            // Fallback object structural scan if still not resolved
            if (vehicleValue === undefined) {
                const lowKey = key.toLowerCase();
                const cleanLowKey = lowKey.replace(/^(has|support|supports)/, '');
                const foundKey = Object.keys(vehicle).find(vKey => {
                    const target = vKey.toLowerCase();
                    return target === lowKey || target.replace(/^(has|support|supports)/, '') === cleanLowKey;
                });
                if (foundKey) vehicleValue = vehicle[foundKey];
            }

            const isVehicleFeatureTrue = evaluateFeaturePresence(key, vehicleValue);
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

// Unique Vehicle Composite Identifier
const getVehicleKey = (v: Vehicle): string => {
    return `${v.modelYear}-${String(v.manufacturer).trim()}-${String(v.model).trim()}-${String(v.trim).trim()}-${v.driveAxle || ''}-${v.market || ''}`;
};

const comparisonRegistry = ref<Map<string, Vehicle>>(new Map());

// Comparison Feature Implementation
const selectedForComparison = computed<Vehicle[]>(() => Array.from(comparisonRegistry.value.values()));
const isCompareModalOpen = ref<boolean>(false);

const isVehicleSelectedForCompare = (vehicle: Vehicle): boolean => {
    return comparisonRegistry.value.has(getVehicleKey(vehicle));
};

const toggleCompareVehicle = (vehicle: Vehicle): void => {
    const targetKey = getVehicleKey(vehicle);

    if (comparisonRegistry.value.has(targetKey)) {
        comparisonRegistry.value.delete(targetKey);
    } else if (comparisonRegistry.value.size < 4) {
        // Strip the Proxy wrapper before storage to guarantee stable reference extraction later
        comparisonRegistry.value.set(targetKey, toRaw(vehicle));
    }
};

const clearComparison = (): void => {
    comparisonRegistry.value.clear();
    isCompareModalOpen.value = false;
};

const openCompareModal = (): void => {
    if (comparisonRegistry.value.size > 0) {
        isCompareModalOpen.value = true;
    }
};

const closeCompareModal = (): void => {
    isCompareModalOpen.value = false;
};

const getSpecValueByLabel = (vehicle: Vehicle, label: string) => {
    const specs = formatDisplaySpecs(vehicle);
    const found = specs.find(s => s.label === label);
    return found ? found.val : '—';
};

// Intersection Observer for Top Bar & Floating Compare CTA
const topCompareBarRef = ref<HTMLElement | null>(null);
const isTopBarVisible = ref<boolean>(true);
let observer: IntersectionObserver | null = null;

onMounted(() => {
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(([entry]) => {
            isTopBarVisible.value = entry?.isIntersecting ?? false;
        }, { threshold: 0.1 });

        if (topCompareBarRef.value) {
            observer.observe(topCompareBarRef.value);
        }
    }
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
    }
});

const isFloatingCompareVisible = computed(() => {
    return selectedForComparison.value.length > 0 && !isTopBarVisible.value;
});

interface ComparisonCategory {
    id: string;
    title: string;
    keys: string[];
}

const highlightDifferences = ref<boolean>(true);

const comparisonCategories = computed<ComparisonCategory[]>(() => {
    if (comparisonRegistry.value.size === 0) return [];

    const keysSet = new Set<string>();
    const originalKeysMap = new Map<string, string>();

    selectedForComparison.value.forEach(vehicle => {
        formatDisplaySpecs(vehicle).forEach(spec => {
            keysSet.add(spec.label);
            originalKeysMap.set(spec.label, spec.originalKey.toLowerCase());
        });
    });

    const result: ComparisonCategory[] = [];

    technicalCategories.forEach(category => {
        const categoryOriginalKeys = (categoryMappings[category.id] || []).map(k => k.toLowerCase());
        const matchedLabels = Array.from(keysSet).filter(label => {
            const originalKey = originalKeysMap.get(label);
            return originalKey && categoryOriginalKeys.includes(originalKey);
        }).sort((a, b) => a.localeCompare(b));

        if (matchedLabels.length > 0) {
            result.push({
                id: category.id,
                title: category.title,
                keys: matchedLabels
            });
        }
    });

    return result;
});

const evaluateRowDifference = (label: string): boolean => {
    const vehicles = selectedForComparison.value;
    if (vehicles.length <= 1) return false;

    const baselineValue = getSpecValueByLabel(vehicles[0]!, label);
    for (let i = 1; i < vehicles.length; i++) {
        if (getSpecValueByLabel(vehicles[i]!, label) !== baselineValue) {
            return true;
        }
    }
    return false;
};
</script>

<template>
    <div class="grid-layout-wrapper">
        <GridFilter :bounds="dataBounds" :options="dynamicFilterOptions" @filter-change="updateFilters" />
        <div ref="topCompareBarRef" class="results-status-bar">
            <span class="status-counter">
                <strong>{{ filteredVehicles.length }}</strong> of <strong>{{ props.vehicles.length }}</strong> vehicles
            </span>
            <div class="compare-actions-bar">
                <button class="compare-trigger-btn" :disabled="selectedForComparison.length < 2"
                    @click="openCompareModal">
                    Compare ({{ selectedForComparison.length }}/4)
                </button>
                <button v-if="selectedForComparison.length > 0" class="compare-clear-btn" @click="clearComparison">
                    Clear
                </button>
            </div>
        </div>

        <div class="split-view-layout" :class="{ 'has-expanded-card': selectedVehicleKey !== null }">
            <div class="grid-container">
                <div v-for="vehicle in filteredVehicles" :key="getVehicleKey(vehicle)" class="grid-item"
                    :class="{ 'is-selected': selectedVehicleKey === getVehicleKey(vehicle) }"
                    @click="toggleSelectVehicle(vehicle)">
                    <div class="card-header-actions" @click.stop>
                        <label class="compare-checkbox-label">
                            <input type="checkbox" :checked="isVehicleSelectedForCompare(vehicle)"
                                :disabled="!isVehicleSelectedForCompare(vehicle) && selectedForComparison.length >= 4"
                                @change="toggleCompareVehicle(vehicle)" />
                            <span>Compare</span>
                        </label>
                    </div>
                    <div class="card-main-meta">
                        <h3>{{ vehicle.modelYear }} {{ vehicle.manufacturer }} {{ vehicle.model }}</h3>
                        <p class="trim-drivetrain-line">
                            <strong>{{ vehicle.trim }}</strong>
                            <span class="pill drivetrain-pill">{{ vehicle.driveAxle }}</span>
                            <span :data-tooltip="vehicle.batteryChemistry" class="tooltip-wrapper">
                                <span class="pill battery-pill">🔋 {{ vehicle.netBatteryCapacityKwh }} kWh</span>
                            </span>
                            <span class="pill charging-speed-pill">⚡️ {{ vehicle.dcChargingSpeedKw }} kW</span>
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
                                        <img :src="getChargingPortIconUrl(port)" :alt="port"
                                            class="charger-inline-icon" />
                                    </span>
                                    <span v-if="pIdx < getChargingPortsArray(vehicle.chargingPorts).length - 1"
                                        class="charger-separator">&amp;</span>
                                </span>
                            </span>
                        </p>
                    </div>
                </div>
                <div v-if="filteredVehicles.length === 0" class="no-results">
                    No vehicles match your selected filters.
                </div>
            </div>

            <!-- Expanded Details Panel Side-by-Side on Desktop -->
            <div v-if="selectedVehicleKey !== null && activeVehicle" class="expanded-detail-pane">
                <div class="expanded-pane-header">
                    <h2>{{ activeVehicle.modelYear }} {{ activeVehicle.manufacturer }} {{ activeVehicle.model }}</h2>
                    <button class="close-expanded-btn" @click="closeSelectedVehicle"
                        aria-label="Close details view">&times;</button>
                </div>
                <div class="specs-expanded-drawer">
                    <div class="hero-specs-dashboard">
                        <div class="hero-meta-block">
                            <span class="hero-subtitle-pill">{{ activeVehicle.trim }}</span>
                            <span class="hero-subtitle-text">{{ activeVehicle.driveAxle }} &bull; {{
                                activeVehicle.vehicleType }}</span>
                        </div>
                        <div class="hero-metrics-row">
                            <div class="hero-metric-card highlight-range">
                                <span class="hero-value">{{ activeVehicle.epaCombinedRangeMi || '—' }}<span
                                        class="hero-value-unit">mi</span></span>
                                <span class="hero-label">EPA Rated Range</span>
                            </div>
                            <div class="hero-metric-card highlight-battery">
                                <span class="hero-value">{{ activeVehicle.netBatteryCapacityKwh || '—' }}<span
                                        class="hero-value-unit">kWh</span></span>
                                <span class="hero-label">Net Capacity ({{ activeVehicle.batteryChemistry || ''
                                    }})</span>
                            </div>
                            <div class="hero-metric-card highlight-speed">
                                <span class="hero-value">{{ activeVehicle.dcChargingSpeedKw || '—' }}<span
                                        class="hero-value-unit">kW</span></span>
                                <span class="hero-label">Peak DC Charging Speed</span>
                            </div>
                        </div>
                    </div>
                    <div class="tabs-navigation-bar">
                        <button v-for="tab in technicalCategories" :key="tab.id" type="button" class="tab-nav-btn"
                            :class="{ 'is-active-tab': activeTabId === tab.id }" @click="activeTabId = tab.id">
                            {{ tab.title }}
                        </button>
                    </div>
                    <div class="tab-content-panel">
                        <div class="specs-matrix-grid">
                            <div v-for="spec in activeVehicleSpecs" :key="spec.label" class="spec-matrix-row">
                                <span class="spec-label">{{ spec.label }}</span>
                                <span class="spec-value">{{ spec.val }}</span>
                            </div>

                            <div v-if="activeVehicleSpecs.length === 0" class="empty-tab-notice">
                                No secondary attributes mapped within this specification slice.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Compare CTA -->
        <Transition name="fade-float">
            <div v-if="isFloatingCompareVisible" class="floating-compare-bar">
                <button class="compare-trigger-btn floating-trigger-btn" :disabled="selectedForComparison.length < 2"
                    @click="openCompareModal">
                    Compare ({{ selectedForComparison.length }}/4)
                </button>
                <button class="compare-clear-btn" @click="clearComparison">
                    Clear
                </button>
            </div>
        </Transition>

        <!-- Comparison Modal Overlay -->
        <div v-if="isCompareModalOpen" class="compare-modal-overlay" @click.self="closeCompareModal">
            <div class="compare-modal">
                <div class="compare-modal-header">
                    <h2>Vehicle Comparison Matrix</h2>
                    <div class="compare-header-controls">
                        <label class="toggle-differences-label">
                            <input type="checkbox" v-model="highlightDifferences" />
                            Highlight Differences
                        </label>
                        <button class="compare-close-btn" @click="closeCompareModal">&times;</button>
                    </div>
                </div>
                <div class="compare-modal-body">
                    <table class="compare-table">
                        <thead>
                            <tr>
                                <th class="col-spec-header">Specification</th>
                                <th v-for="v in selectedForComparison" :key="getVehicleKey(v)"
                                    class="col-vehicle-header"
                                    :style="{ width: `calc(80% / ${selectedForComparison.length})` }">
                                    <div class="compare-column-header">
                                        <button class="remove-v-btn" @click="toggleCompareVehicle(v)">&times;</button>
                                        <strong>{{ v.modelYear }} {{ v.manufacturer }} {{ v.model }}</strong>
                                        <span>{{ v.trim }}</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody v-for="category in comparisonCategories" :key="category.id">
                            <tr class="category-header-row">
                                <td :colspan="selectedForComparison.length + 1">
                                    <h3>{{ category.title }}</h3>
                                </td>
                            </tr>
                            <tr v-for="keyLabel in category.keys" :key="keyLabel"
                                :class="{ 'diff-highlight': highlightDifferences && evaluateRowDifference(keyLabel) }">
                                <td class="compare-spec-key">{{ keyLabel }}</td>
                                <td v-for="v in selectedForComparison" :key="getVehicleKey(v)">
                                    {{ getSpecValueByLabel(v, keyLabel) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-layout-wrapper {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
    position: relative;
}

.results-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding: 6px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

html.dark .results-status-bar {
    background-color: #1e293b;
    border-color: #334155;
}

.status-counter {
    font-size: 14px;
    color: #475569;
}

html.dark .status-counter {
    color: #cbd5e1;
}

.status-counter strong {
    color: #0f172a;
}

html.dark .status-counter strong {
    color: #ffffff;
}

.compare-actions-bar {
    display: flex;
    align-items: center;
    gap: 8px;
}

.compare-trigger-btn {
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.compare-trigger-btn:hover:not(:disabled) {
    background-color: #1d4ed8;
}

.compare-trigger-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.compare-clear-btn {
    background: transparent;
    color: #64748b;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}

html.dark .compare-clear-btn {
    color: #94a3b8;
    border-color: #475569;
}

/* Floating Compare Action Bar */
.floating-compare-bar {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

html.dark .floating-compare-bar {
    background: #1e293b;
    border-color: #334155;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.floating-trigger-btn {
    padding: 8px 16px;
    font-size: 14px;
}

.fade-float-enter-active,
.fade-float-leave-active {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-float-enter-from,
.fade-float-leave-to {
    opacity: 0;
    transform: translateY(12px);
}

.card-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.compare-checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
}

html.dark .compare-checkbox-label {
    color: #94a3b8;
}

.split-view-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 16px;
    align-items: start;
}

@media (min-width: 1024px) {
    .split-view-layout.has-expanded-card {
        grid-template-columns: 1fr 2fr;
    }
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
}

.split-view-layout.has-expanded-card .grid-container {
    grid-template-columns: 1fr;
}

.grid-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 20px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
}

html.dark .grid-item {
    background-color: #1e293b;
    border-color: #334155;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}

.grid-item:hover {
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

html.dark .grid-item:hover {
    border-color: #475569;
}

.grid-item.is-selected {
    border-color: #2563eb;
    box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1), 0 8px 10px -6px rgba(37, 99, 235, 0.05);
}

html.dark .grid-item.is-selected {
    border-color: #38bdf8;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.expanded-detail-pane {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 20px;
}

html.dark .expanded-detail-pane {
    background-color: #1e293b;
    border-color: #334155;
}

.expanded-pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 12px;
    margin-bottom: 16px;
}

html.dark .expanded-pane-header {
    border-bottom-color: #334155;
}

.expanded-pane-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
}

html.dark .expanded-pane-header h2 {
    color: #ffffff;
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
    color: #cbd5e1;
}

.grid-item h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
}

html.dark .grid-item h3 {
    color: #ffffff;
}

.trim-drivetrain-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
    font-size: 14px;
    color: #334155;
}

html.dark .trim-drivetrain-line {
    color: #cbd5e1;
}

.pill {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.charging-speed-pill {
    background: #fefce8;
    color: #854d0e;
}

html.dark .charging-speed-pill {
    background-color: #1e293b;
    color: #facc15;
    border-color: #a16207;
}

.drivetrain-pill {
    background: #eff6ff;
    color: #1e40af;
}

html.dark .drivetrain-pill {
    background-color: #334155;
    color: #ffffff;
    border-color: #475569;
}

.battery-pill {
    background: #f0fdf4;
    color: #166534;
    cursor: help;
}

html.dark .battery-pill {
    background-color: #1e293b;
    color: #34d399;
    border-color: #065f46;
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

html.dark .specs-preview-summary {
    color: #94a3b8;
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

html.dark .charger-inline-icon {
    filter: invert(1) brightness(2);
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
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.hero-specs-dashboard {
    background: #f8fafc;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #e2e8f0;
}

html.dark .hero-specs-dashboard {
    background-color: #1e293b;
    border-color: #334155;
}

.hero-meta-block {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
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
    gap: 40px;
    flex-wrap: wrap;
}

.hero-metric-card {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 160px;
}

.hero-value {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0f172a;
    line-height: 1;
}

html.dark .hero-value {
    color: #ffffff;
}

.hero-value-unit {
    font-size: 16px;
    font-weight: 500;
    letter-spacing: normal;
    color: #64748b;
    margin-left: 4px;
}

html.dark .hero-value-unit {
    color: #94a3b8;
}

.hero-label {
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

html.dark .hero-label {
    color: #94a3b8;
}

.highlight-range .hero-value {
    color: #2563eb;
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

.tabs-navigation-bar {
    display: flex;
    gap: 4px;
    border-bottom: 2px solid #f1f5f9;
    overflow-x: auto;
    max-width: 100%;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
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
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    position: relative;
    bottom: -2px;
    transition: all 0.15s ease;
    border-bottom: 2px solid transparent;
    flex-shrink: 0;
    white-space: nowrap;
}

html.dark .tab-nav-btn {
    color: #94a3b8;
}

.tab-nav-btn:hover {
    color: #0f172a;
}

html.dark .tab-nav-btn:hover {
    color: #ffffff;
}

.tab-nav-btn.is-active-tab {
    color: #2563eb;
    border-bottom-color: #2563eb;
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
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px 48px;
}

.spec-matrix-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
}

html.dark .spec-matrix-row {
    border-bottom-color: #1e293b;
}

.spec-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

html.dark .spec-label {
    color: #94a3b8;
}

.spec-value {
    color: #1e293b;
    font-size: 14px;
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
    transition: opacity 0.15s ease;
}

html.dark .tooltip-wrapper::after {
    background-color: #f8fafc;
    color: #0f172a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
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
    transition: opacity 0.15s ease;
}

html.dark .tooltip-wrapper::before {
    border-color: #f8fafc transparent transparent transparent;
}

.tooltip-wrapper:hover::after,
.tooltip-wrapper:hover::before {
    opacity: 1;
}

/* Modal Styling */
.compare-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

html.dark .compare-modal-overlay {
    background-color: rgba(2, 6, 23, 0.8);
}

.compare-modal {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

html.dark .compare-modal {
    background: #0f172a;
    border: 1px solid #334155;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
}

.compare-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
}

html.dark .compare-modal-header {
    border-bottom-color: #1e293b;
    background-color: #0f172a;
}

.compare-modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: #0f172a;
}

html.dark .compare-modal-header h2 {
    color: #f8fafc;
}

.compare-close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
    transition: color 0.15s ease;
}

html.dark .compare-close-btn {
    color: #94a3b8;
}

html.dark .compare-close-btn:hover {
    color: #f8fafc;
}

.compare-modal-body {
    padding: 24px;
    overflow-x: auto;
    overflow-y: auto;
}

html.dark .compare-modal-body {
    background-color: #0f172a;
}

.compare-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    table-layout: fixed;
}

.compare-table th,
.compare-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #334155;
}

html.dark .compare-table th,
html.dark .compare-table td {
    border-bottom-color: #1e293b;
    color: #e2e8f0;
}

.col-spec-header {
    width: 20%;
    color: #0f172a;
    font-weight: 700;
}

html.dark .col-spec-header {
    color: #f8fafc;
}

.compare-column-header {
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: 8px;
}

.compare-column-header strong {
    color: #0f172a;
    font-size: 14px;
}

html.dark .compare-column-header strong {
    color: #f8fafc;
}

.compare-column-header span {
    color: #64748b;
    font-size: 12px;
}

html.dark .compare-column-header span {
    color: #94a3b8;
}

.remove-v-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.remove-v-btn:hover {
    background: #dc2626;
}

.compare-spec-key {
    font-weight: 600;
    color: #475569;
    background: #f8fafc;
}

html.dark .compare-spec-key {
    color: #f1f5f9;
    background: #1e293b;
}

.compare-header-controls {
    display: flex;
    align-items: center;
    gap: 20px;
}

.toggle-differences-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
}

html.dark .toggle-differences-label {
    color: #cbd5e1;
}

.category-header-row td {
    background-color: #f1f5f9;
    padding: 10px 16px;
    border-bottom: 2px solid #cbd5e1;
    border-top: 2px solid #cbd5e1;
}

html.dark .category-header-row td {
    background-color: #1e293b;
    border-bottom-color: #475569;
    border-top-color: #475569;
}

.category-header-row h3 {
    margin: 0;
    font-size: 12px;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
}

html.dark .category-header-row h3 {
    color: #94a3b8;
}

.diff-highlight td {
    background-color: #fef08a !important;
    color: #854d0e !important;
}

html.dark .diff-highlight td {
    background-color: #422006 !important;
    color: #fde047 !important;
}

.diff-highlight .compare-spec-key {
    background-color: #fde047 !important;
    color: #713f12 !important;
}

html.dark .diff-highlight .compare-spec-key {
    background-color: #713f12 !important;
    color: #fef08a !important;
}
</style>