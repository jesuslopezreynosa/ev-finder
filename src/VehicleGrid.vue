<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRaw } from 'vue';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

import GridFilter, { type FilterState } from './GridFilter.vue';
import VehicleDetailPane from './components/VehicleDetailPane.vue';
import VehicleCompareModal from './components/VehicleCompareModal.vue';

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

const iconModules = import.meta.glob('/src/assets/icons/*.svg', {
    eager: true,
    import: 'default'
}) as Record<string, string>;

const getChargingPortIconUrl = (portName: string): string => {
    if (!portName) return '';
    const filename = portName.toLowerCase().replace(/[\s-]/g, '');
    return iconModules[`/src/assets/icons/${filename}.svg`] || '';
};

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

const getChargingPortsArray = (portValue: any): string[] => {
    if (!portValue) return [];
    if (Array.isArray(portValue)) {
        return portValue.flatMap(p => String(p).split(',').map(item => item.trim())).filter(Boolean);
    }
    return String(portValue).split(',').map(item => item.trim()).filter(Boolean);
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
                if (fullCountryName) uniqueVals.add(fullCountryName);
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
    const modelYears = props.vehicles.map(v => Number(v.modelYear)).filter(y => !isNaN(y) && y > 0);
    const epaRanges = props.vehicles.map(v => Number(v.epaCombinedRangeMi)).filter(r => !isNaN(r) && r > 0);
    const dcChargingSpeeds = props.vehicles.map(v => Number(v.dcChargingSpeedKw)).filter(s => !isNaN(s) && s > 0);

    return {
        modelYear: {
            min: modelYears.length ? Math.min(...modelYears) : 2018,
            max: modelYears.length ? Math.max(...modelYears) : ((new Date()).getFullYear() + 1)
        },
        epaCombinedRangeMi: {
            min: epaRanges.length ? Math.min(...epaRanges) : 0,
            max: epaRanges.length ? Math.max(...epaRanges) : 500
        },
        dcChargingSpeedKw: {
            min: dcChargingSpeeds.length ? Math.min(...dcChargingSpeeds) : 0,
            max: dcChargingSpeeds.length ? Math.max(...dcChargingSpeeds) : 350
        }
    };
});

const currentFilters = ref<FilterState | null>(null);
const selectedVehicleKey = ref<string | null>(null);

const technicalCategories = [
    { id: 'chargingPerformance', title: 'Charging & Performance' },
    { id: 'features', title: 'Features' },
    { id: 'infotainmentTechnology', title: 'Infotainment & Tech' },
    { id: 'marketWarranty', title: 'Market & Warranty' },
    { id: 'connectivitySubscriptions', title: 'Connectivity & Subscriptions' },
    { id: 'dimensions', title: 'Dimensions' },
] as const;

type CategoryId = (typeof technicalCategories)[number]['id'];

const activeTabId = ref<string>(technicalCategories[0].id);

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

const formatDisplaySpecs = (vehicle: Vehicle) => {
    const skipKeys = ['modelYear', 'manufacturer', 'model', 'trim', 'driveAxle', 'id'];
    const acronyms = ['Epa', 'Dc', 'Iso', 'Os', 'Ota', 'Ac', 'V'];

    return Object.entries(vehicle)
        .filter(([key, value]) => !skipKeys.includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            let label = key;
            label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
            label = label.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
            label = label.replace(/^./, str => str.toUpperCase());
            label = label.replace(/([a-zA-Z])(\d+)/g, '$1 $2');
            label = label.replace(/(\d+)([a-zA-Z])/g, '$1 $2');
            label = label.replace(/\s+/g, ' ').trim();

            acronyms.forEach(acronym => {
                const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
                label = label.replace(regex, acronym.toUpperCase());
            });

            label = label.replace(/\bCar\s+Play\b/gi, 'CarPlay');
            label = label.replace(/\bV\s*2\s*X\b/gi, 'V2X');
            label = label.replace(/\bAnd\b/g, '&');

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

            label = label.replace(/(\d+)\s+V\b/g, '$1V');
            label = label.replace(/\s+/g, ' ').trim();

            let displayValue = value;
            if (['countryOfAssembly', 'market'].includes(key)) {
                displayValue = getCountryNameFromIsoAlphaThreeCode(String(value));
            } else if (Array.isArray(value)) {
                displayValue = value.join(', ');
            }

            return { label, val: displayValue, originalKey: key };
        });
};

const getFilteredSpecs = (vehicle: Vehicle, tabId: CategoryId) => {
    const rawSpecs = formatDisplaySpecs(vehicle);
    const targets = (categoryMappings[tabId] || []).map(k => k.toLowerCase());
    return rawSpecs.filter(spec =>
        targets.includes(spec.originalKey.toLowerCase())
    );
};

const evaluateFeaturePresence = (key: string, rawValue: unknown): boolean => {
    if (rawValue === null || rawValue === undefined) return false;
    if (typeof rawValue === 'boolean') return rawValue;
    if (typeof rawValue === 'number') return rawValue > 0;

    const cleanStr = String(rawValue).trim().toLowerCase();
    if (cleanStr === 'yes' || cleanStr === 'true' || cleanStr === '1') return true;
    if (cleanStr === 'no' || cleanStr === 'false' || cleanStr === '0' || cleanStr === 'none') return false;

    switch (key) {
        case 'hasAdaptiveCruiseControl':
            return !cleanStr.includes('no');
        case 'supportsCarPlayAndroidAuto':
            return cleanStr.includes('yes') || cleanStr.includes('true');
        default:
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
            if (filterVal === null || filterVal === undefined) return true;

            let vehicleValue = vehicle[key];
            if (vehicleValue === undefined) {
                const lowKey = key.toLowerCase();
                const cleanLowKey = lowKey.replace(/^(has|support|supports)/, '');
                const foundKey = Object.keys(vehicle).find(vKey => {
                    const target = vKey.toLowerCase();
                    return target === lowKey || target.replace(/^(has|support|supports)/, '') === cleanLowKey;
                });
                if (foundKey) vehicleValue = vehicle[foundKey];
            }

            return evaluateFeaturePresence(key, vehicleValue) === filterVal;
        });

        const vehicleYear = Number(vehicle.modelYear);
        const vehicleRange = Number(vehicle.epaCombinedRangeMi);
        const vehicleSpeed = Number(vehicle.dcChargingSpeedKw);

        const filterYearMin = Number(filters.modelYear?.min ?? 0);
        const filterRangeMin = Number(filters.epaCombinedRangeMi?.min ?? 0);
        const filterSpeedMin = Number(filters.dcChargingSpeedKw?.min ?? 0);

        const matchesYear = isNaN(filterYearMin) || filterYearMin <= 0 || (!isNaN(vehicleYear) && vehicleYear >= filterYearMin);
        const matchesRange = isNaN(filterRangeMin) || filterRangeMin <= 0 || (!isNaN(vehicleRange) && vehicleRange >= filterRangeMin);
        const matchesSpeed = isNaN(filterSpeedMin) || filterSpeedMin <= 0 || (!isNaN(vehicleSpeed) && vehicleSpeed >= filterSpeedMin);

        return matchesStrings && matchesBooleans && matchesYear && matchesRange && matchesSpeed;
    });
});

const getVehicleKey = (v: Vehicle): string => {
    if (v.id) return String(v.id);
    const keyParts = [
        v.modelYear,
        v.manufacturer,
        v.model,
        v.trim,
        v.driveAxle,
        v.market,
        v.batteryChemistry,
        v.dcChargingSpeedKw,
        v.netBatteryCapacityKwh
    ].map(p => String(p ?? '').trim());

    return keyParts.filter(Boolean).join('-');
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

const activeVehicle = computed(() => {
    if (!selectedVehicleKey.value) return null;
    return props.vehicles.find(v => getVehicleKey(v) === selectedVehicleKey.value) || null;
});

const activeVehicleSpecs = computed(() => {
    if (!activeVehicle.value) return [];
    return getFilteredSpecs(activeVehicle.value, activeTabId.value as CategoryId);
});

const comparisonRegistry = ref<Map<string, Vehicle>>(new Map());

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

const topCompareBarRef = ref<HTMLElement | null>(null);
const isTopBarVisible = ref<boolean>(true);
let observer: IntersectionObserver | null = null;

// Tracks visibility of top bar to show/hide the floating compare button when scrolling down
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
        const categoryOriginalKeys = (categoryMappings[category.id as CategoryId] || []).map(k => k.toLowerCase());
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
                <template v-for="vehicle in filteredVehicles" :key="getVehicleKey(vehicle)">
                    <div class="grid-item" :class="{ 'is-selected': selectedVehicleKey === getVehicleKey(vehicle) }"
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
                                    <span v-for="(port, pIdx) in getChargingPortsArray(vehicle.chargingPorts)"
                                        :key="port" class="inline-charger-item">
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

                    <!-- Extracted Mobile Details Drawer Component -->
                    <VehicleDetailPane v-if="selectedVehicleKey === getVehicleKey(vehicle) && activeVehicle"
                        class="mobile-only-pane" :active-vehicle="activeVehicle" :active-tab-id="activeTabId"
                        :technical-categories="technicalCategories" :active-vehicle-specs="activeVehicleSpecs"
                        @close="closeSelectedVehicle" @select-tab="(id) => (activeTabId = id)" />
                </template>
                <div v-if="filteredVehicles.length === 0" class="no-results">
                    No vehicles match your selected filters.
                </div>
            </div>

            <!-- Extracted Desktop Side-by-Side Panel Component -->
            <VehicleDetailPane v-if="selectedVehicleKey !== null && activeVehicle" class="desktop-only-pane"
                :active-vehicle="activeVehicle" :active-tab-id="activeTabId" :technical-categories="technicalCategories"
                :active-vehicle-specs="activeVehicleSpecs" @close="closeSelectedVehicle"
                @select-tab="(id) => (activeTabId = id)" />
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

        <VehicleCompareModal :is-open="isCompareModalOpen" :selected-vehicles="selectedForComparison"
            :categories="comparisonCategories" v-model:highlight-differences="highlightDifferences"
            :get-spec-value-by-label="getSpecValueByLabel" :evaluate-row-difference="evaluateRowDifference"
            @close="closeCompareModal" @toggle-compare="toggleCompareVehicle" />
    </div>
</template>

<style scoped>
.grid-layout-wrapper {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
    position: relative;
    box-sizing: border-box;
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    min-width: 0;
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
    min-width: 0;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    overflow: hidden;
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
    z-index: 2;
}

html.dark .grid-item:hover {
    border-color: #475569;
}

.grid-item.is-selected {
    border-color: #2563eb;
    box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1), 0 8px 10px -6px rgba(37, 99, 235, 0.05);
    z-index: 3;
}

html.dark .grid-item.is-selected {
    border-color: #38bdf8;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.mobile-only-pane {
    display: block;
    margin-top: 8px;
    z-index: 20;
}

.desktop-only-pane {
    display: none;
    position: sticky;
    top: 20px;
    z-index: 10;
}

@media (min-width: 1024px) {
    .mobile-only-pane {
        display: none;
    }

    .desktop-only-pane {
        display: block;
    }
}

.grid-item h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
    word-break: break-word;
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
    max-width: 100%;
    overflow: hidden;
}

.specs-matrix-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px 24px;
    width: 100%;
    box-sizing: border-box;
}

.spec-matrix-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
    min-width: 0;
    overflow: hidden;
}

.spec-value {
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    word-break: break-word;
    overflow-wrap: anywhere;
    /* Handles long strings like "Google built-in" gracefully */
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
    z-index: 5;
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
    z-index: 5;
    transition: opacity 0.15s ease;
}

html.dark .tooltip-wrapper::before {
    border-color: #f8fafc transparent transparent transparent;
}

.tooltip-wrapper:hover::after,
.tooltip-wrapper:hover::before {
    opacity: 1;
}

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
    padding: 16px;
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