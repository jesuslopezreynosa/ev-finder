<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRaw } from 'vue';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

import GridFilter, { type FilterState } from './GridFilter.vue';
import GlyphHandler from './GlyphHandler.vue';
import VehicleCompareModal from './VehicleCompareModal.vue';
import VehicleDetailPane from './VehicleDetailPane.vue';
import { TECHNICAL_CATEGORIES, CATEGORY_MAPPINGS, type CategoryId } from '@/constants/vehicleSpecs';

countries.registerLocale(enLocale);

export interface Vehicle {
    modelYear: number;
    manufacturer: string;
    model: string | number;
    trim: string | null;
    market: string;
    driveAxle: string;
    vehicleType: string;
    epaCombinedEfficiencyKilowattHoursPerHundredMiles: number | null;
    epaCombinedEfficiencyWattHoursPerMile: number | null;
    epaCombinedRangeMiles: number | null;
    netBatteryCapacityKilowattHours: number | null;
    batteryChemistry: string | null;
    recommendedDailyChargePercent: number | null;
    typicalFullRangeMiles: number | null;
    chargingPortTypes: string | null;
    dcChargingSpeedKilowatts: number | null;
    onboardChargerAmperes: number | null;
    supportsAc277vCharging: string | null;
    supportsBatteryPreconditioning: string | null;
    supportsSuperchargerAccess: string | null;
    supportsPlugAndChargeIso15118: string | null;
    plugAndChargeProviders: string | null;
    supportsPhoneAsAKey: string | null;
    maxPhoneKeys: number | string | null;
    hasPoweredLiftgate: string | null;
    hasOnePedalDrive: string | null;
    isOnePedalDrivePersistent: string | null;
    hasAdaptiveCruiseControl: string | null;
    hasGlassRoof: string | null;
    audioPowerWatts: number | null;
    audioSpeakerCount: number | string | null;
    audioSubwooferCount: number | null;
    supportsAudioDolbyAtmos: string | null;
    audioBrand: string | null;
    supportsAppleCarPlayAndAndroidAuto: string | null;
    infotainmentOperatingSystem: string | null;
    infotainmentScreenSizeInches: number | null;
    infotainmentScreenResolutionPx: string | null;
    infotainmentScreenPpi: number | null;
    navigationProvider: string | null;
    hasPoweredSeats: string | null;
    hasVentilatedSeats: string | null;
    hasHeatedSeats: string | null;
    hasHeatedSteeringWheel: string | null;
    hasHeatPump: string | null;
    supportsOverTheAirUpdates: string | null;
    hasGarageDoorOpener: string | null;
    countryOfAssembly: string | null;
    supportsUserProfiles: string | null;
    supportsMemoryProfilePerSeatAndMirror: string | null;
    hasPoweredSideMirrors: string | null;
    hasBuiltInDashcam: string | null;
    standardSeatMaterial: string | null;
    frunkCapacityLiters: number | null;
    voltageArchitecture: string | null;
    maxSupportedDcChargingVoltage: string | null;
    batteryNominalVoltage: string | number | null;
    supportsVehicleToEverything: string | null;
    seatCount: number | string | null;
    hasPetMode: string | null;
    exteriorCameraCount: number | null;
    interiorCameraCount: number | null;
    driverCameraType: string | null;
    exteriorSensors: string | null;
    vehicleWarranty: string | null;
    batteryWarranty: string | null;
    driveUnitWarranty: string | null;
    corrosionWarranty: string | null;
    towingCapacityPounds: string | number | null;
    usbPortCount: string | null;
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
    zeroToSixtyTimeSeconds: number | null;
    turningRadiusFeet: number | null;
    [key: string]: unknown;
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

const getChargingPortsArray = (portValue: unknown): string[] => {
    if (!portValue) return [];
    if (Array.isArray(portValue)) {
        return portValue.flatMap(p => String(p).split(',').map(item => item.trim())).filter(Boolean);
    }
    return String(portValue).split(',').map(item => item.trim()).filter(Boolean);
};

const dynamicFilterOptions = computed(() => {
    const stringCategories = [
        'manufacturer', 'driveAxle', 'vehicleType', 'batteryChemistry',
        'chargingPortTypes', 'countryOfAssembly', 'infotainmentOperatingSystem', 'audioBrand'
    ] as const;

    const optionsMap: Record<string, string[]> = {};

    stringCategories.forEach(key => {
        const uniqueVals = new Set<string>();

        props.vehicles.forEach(v => {
            const val = v[key];
            if (val === null || val === undefined || val === '') return;

            if (Array.isArray(val)) {
                val.forEach(item => { if (item) uniqueVals.add(String(item).trim()); });
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
    const epaRanges = props.vehicles.map(v => Number(v.epaCombinedRangeMiles)).filter(r => !isNaN(r) && r > 0);
    const dcChargingSpeeds = props.vehicles.map(v => Number(v.dcChargingSpeedKilowatts)).filter(s => !isNaN(s) && s > 0);

    return {
        modelYear: {
            min: (modelYears && modelYears.length) ? Math.min(...modelYears) : 2018,
            max: (modelYears && modelYears.length) ? Math.max(...modelYears) : ((new Date()).getFullYear() + 1)
        },
        epaCombinedRangeMiles: {
            min: (epaRanges && epaRanges.length) ? Math.min(...epaRanges) : 0,
            max: (epaRanges && epaRanges.length) ? Math.max(...epaRanges) : 500
        },
        dcChargingSpeedKilowatts: {
            min: (dcChargingSpeeds && dcChargingSpeeds.length) ? Math.min(...dcChargingSpeeds) : 0,
            max: (dcChargingSpeeds && dcChargingSpeeds.length) ? Math.max(...dcChargingSpeeds) : 350
        }
    };
});

const currentFilters = ref<FilterState | null>(null);
const selectedVehicleKey = ref<string | null>(null);
const detailsAnchorRef = ref<HTMLElement | null>(null);

const technicalCategories = TECHNICAL_CATEGORIES;
const activeTabId = ref<string>(technicalCategories[0]!.id);

const categoryMappings = CATEGORY_MAPPINGS;

const formatDisplaySpecs = (vehicle: Vehicle) => {
    const skipKeys = ['modelYear', 'manufacturer', 'model', 'trim', 'driveAxle', 'id'];
    const acronyms = ['Epa', 'Dc', 'Iso', 'Os', 'Ota', 'Ac', 'V', 'Px', 'Ppi'];

    return Object.entries(vehicle)
        .filter(([key, value]) => !skipKeys.includes(key) && value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            let label = key;
            label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
            label = label.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
            label = label.replace(/^./, str => str.toUpperCase());
            acronyms.forEach(acronym => {
                const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
                label = label.replace(regex, acronym.toUpperCase());
            });

            let displayValue: unknown = value;
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
    return rawSpecs.filter(spec => targets.includes(spec.originalKey.toLowerCase()));
};

const evaluateFeaturePresence = (key: string, rawValue: unknown): boolean => {
    if (rawValue === null || rawValue === undefined) return false;
    if (typeof rawValue === 'boolean') return rawValue;
    if (typeof rawValue === 'number') return rawValue > 0;
    const cleanStr = String(rawValue).trim().toLowerCase();
    if (cleanStr === 'yes' || cleanStr === 'true' || cleanStr === '1') return true;
    if (cleanStr === 'no' || cleanStr === 'false' || cleanStr === '0' || cleanStr === 'none') return false;
    return cleanStr.length > 0;
};

const filteredVehicles = computed(() => {
    if (!currentFilters.value) return props.vehicles;
    const filters = currentFilters.value;

    return props.vehicles.filter(vehicle => {
        const stringCategories = [
            'manufacturer', 'driveAxle', 'vehicleType', 'batteryChemistry',
            'chargingPortTypes', 'countryOfAssembly', 'infotainmentOperatingSystem', 'audioBrand'
        ] as const;

        const matchesStrings = stringCategories.every(key => {
            const selections = filters[key];
            if (!selections || selections.length === 0) return true;
            const rawValue = vehicle[key];
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
            'hasGlassRoof', 'supportsAppleCarPlayAndAndroidAuto', 'hasPoweredSeats', 'hasVentilatedSeats',
            'hasHeatedSeats', 'hasHeatedSteeringWheel', 'hasHeatPump', 'hasPoweredSideMirrors',
            'hasPetMode', 'supportsAudioDolbyAtmos', 'hasSubwoofers'
        ] as const;

        const matchesBooleans = booleanCategories.every(key => {
            const filterVal = filters[key];
            if (filterVal === null || filterVal === undefined) return true;

            // Special handling for hasSubwoofers since it maps to audioSubwooferCount in the vehicle data
            if (key === 'hasSubwoofers') {
                const count = Number(vehicle.audioSubwooferCount);
                const hasSubs = !isNaN(count) && count > 0;
                return hasSubs === filterVal;
            }

            return evaluateFeaturePresence(key, vehicle[key]) === filterVal;
        });

        const matchesSpeakers = (() => {
            const minRequired = Number(filters.minSpeakers);
            if (isNaN(minRequired) || minRequired <= 0) return true;

            const speakerVal = vehicle.audioSpeakerCount;
            if (speakerVal === null || speakerVal === undefined) return false;

            const parsedCount = typeof speakerVal === 'number'
                ? speakerVal
                : parseInt(String(speakerVal).replace(/[^0-9]/g, ''), 10);

            if (isNaN(parsedCount)) return false;

            return parsedCount >= minRequired;
        })();

        const vehicleYear = Number(vehicle.modelYear);
        const vehicleRange = Number(vehicle.epaCombinedRangeMiles);
        const vehicleSpeed = Number(vehicle.dcChargingSpeedKilowatts);

        const filterYearMin = Number(filters.modelYear?.min ?? 0);
        const filterRangeMin = Number(filters.epaCombinedRangeMiles?.min ?? 0);
        const filterSpeedMin = Number(filters.dcChargingSpeedKilowatts?.min ?? 0);

        return (
            matchesStrings &&
            matchesBooleans &&
            matchesSpeakers &&
            (isNaN(filterYearMin) || filterYearMin <= 0 || (!isNaN(vehicleYear) && vehicleYear >= filterYearMin)) &&
            (isNaN(filterRangeMin) || filterRangeMin <= 0 || (!isNaN(vehicleRange) && vehicleRange >= filterRangeMin)) &&
            (isNaN(filterSpeedMin) || filterSpeedMin <= 0 || (!isNaN(vehicleSpeed) && vehicleSpeed >= filterSpeedMin))
        );
    });
});

const getVehicleKey = (v: Vehicle, index?: number): string => {
    const base = v.id ? String(v.id) : [v.modelYear, v.manufacturer, v.model, v.trim, v.market, v.driveAxle, v.epaCombinedRangeMiles].map(p => String(p ?? '').trim()).filter(Boolean).join('-');
    return index !== undefined ? `${base}-${index}` : base;
};

const updateFilters = (newFilters: FilterState) => {
    currentFilters.value = { ...newFilters };
};

const toggleSelectVehicle = (vehicle: Vehicle, event: MouseEvent, index: number) => {
    const key = getVehicleKey(vehicle, index);
    selectedVehicleKey.value = selectedVehicleKey.value === key ? null : key;
    if (selectedVehicleKey.value !== null) {
        setTimeout(() => {
            const isSmallViewport = window.innerWidth < 1024;
            if (isSmallViewport) {
                const targetCard = (event.currentTarget as HTMLElement);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else if (detailsAnchorRef.value) {
                detailsAnchorRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }
};

const closeSelectedVehicle = () => {
    selectedVehicleKey.value = null;
};

const activeVehicle = computed(() => {
    if (!selectedVehicleKey.value) return null;
    return props.vehicles.find((v, idx) => getVehicleKey(v, idx) === selectedVehicleKey.value) || null;
});

const activeVehicleSpecs = computed(() => {
    if (!activeVehicle.value) return [];
    return getFilteredSpecs(activeVehicle.value, activeTabId.value as CategoryId);
});

const comparisonRegistry = ref(new Map<string, Vehicle>());
const selectedForComparison = computed<Vehicle[]>(() => Array.from(comparisonRegistry.value.values()));
const isCompareModalOpen = ref<boolean>(false);

const isVehicleSelectedForCompare = (vehicle: Vehicle, index: number): boolean => {
    return comparisonRegistry.value.has(getVehicleKey(vehicle, index));
};

const toggleCompareVehicle = (vehicle: Vehicle, index: number): void => {
    const targetKey = getVehicleKey(vehicle, index);
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
    if (comparisonRegistry.value.size > 0) isCompareModalOpen.value = true;
};

const closeCompareModal = (): void => {
    isCompareModalOpen.value = false;
};

const getSpecValueByLabel = (vehicle: Vehicle, label: string): string => {
    const specs = formatDisplaySpecs(vehicle);
    const found = specs.find(s => s.label === label);
    return found ? String(found.val) : '—';
};

const topCompareBarRef = ref<HTMLElement | null>(null);
const isTopBarVisible = ref<boolean>(true);
let observer: IntersectionObserver | null = null;

onMounted(() => {
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(([entry]) => {
            isTopBarVisible.value = entry?.isIntersecting ?? false;
        }, { threshold: 0.1 });
        if (topCompareBarRef.value) observer.observe(topCompareBarRef.value);
    }
});

onUnmounted(() => {
    if (observer) observer.disconnect();
});

const isFloatingCompareVisible = computed(() => selectedForComparison.value.length > 0 && !isTopBarVisible.value);

interface ComparisonCategory { id: string; title: string; keys: string[]; }
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
            result.push({ id: category.id, title: category.title, keys: matchedLabels });
        }
    });
    return result;
});

const evaluateRowDifference = (label: string): boolean => {
    const vehicles = selectedForComparison.value;
    if (vehicles.length <= 1) return false;
    const baselineValue = getSpecValueByLabel(vehicles[0]!, label);
    for (let i = 1; i < vehicles.length; i++) {
        if (getSpecValueByLabel(vehicles[i]!, label) !== baselineValue) return true;
    }
    return false;
};
</script>

<template>
    <div class="grid-layout-wrapper" ref="detailsAnchorRef">
        <GridFilter :bounds="dataBounds" :options="dynamicFilterOptions" :active-vehicle-key="selectedVehicleKey"
            @filter-change="updateFilters" />

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
            <div class="vehicles-list-column">
                <div class="grid-container">
                    <template v-for="(vehicle, index) in filteredVehicles" :key="getVehicleKey(vehicle, index)">
                        <div class="grid-item"
                            :class="{ 'is-selected': selectedVehicleKey === getVehicleKey(vehicle, index) }"
                            @click="toggleSelectVehicle(vehicle, $event, index)">
                            <div class="card-header-actions" @click.stop>
                                <label class="compare-checkbox-label">
                                    <input type="checkbox" :checked="isVehicleSelectedForCompare(vehicle, index)"
                                        :disabled="!isVehicleSelectedForCompare(vehicle, index) && selectedForComparison.length >= 4"
                                        @change="toggleCompareVehicle(vehicle, index)" class="styled-checkbox-mini" />
                                    <span>Compare</span>
                                </label>
                            </div>
                            <div class="card-main-meta">
                                <h3>{{ vehicle.modelYear }} {{ vehicle.manufacturer }} {{ vehicle.model }}</h3>
                                <p class="trim-drivetrain-line">
                                    <strong>{{ vehicle.trim }}</strong>
                                    <span :data-tooltip="String(vehicle.driveAxle || '')" class="tooltip-wrapper">
                                        <span class="pill drivetrain-pill">
                                            <GlyphHandler :type="String(vehicle.driveAxle ?? '')" class="pill-mini-svg"
                                                :size="14" />
                                        </span>
                                    </span>
                                    <span :data-tooltip="String(vehicle.batteryChemistry || '')"
                                        class="tooltip-wrapper">
                                        <span class="pill battery-pill">
                                            <svg viewBox="0 0 24 24" class="pill-mini-svg" aria-hidden="true">
                                                <path
                                                    d="M17 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2v-1h1c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-1V8c0-1.1-.9-2-2-2zm0 10H4V8h13v8z" />
                                            </svg>
                                            {{ vehicle.netBatteryCapacityKilowattHours }} kWh
                                        </span>
                                    </span>
                                    <span class="pill charging-speed-pill">
                                        <svg viewBox="0 0 24 24" class="pill-mini-svg" aria-hidden="true">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                        {{ vehicle.dcChargingSpeedKilowatts }} kW
                                    </span>
                                </p>
                                <p class="specs-preview-summary">
                                    <span>{{ vehicle.vehicleType }}</span>
                                    <span class="summary-bullet">&bull;</span>
                                    <span>{{ vehicle.epaCombinedRangeMiles }} mi range</span>
                                    <span class="summary-bullet">&bull;</span>
                                    <!-- Charge Ports -->
                                    <span class="feature-icon-container">
                                        <span v-for="port in getChargingPortsArray(vehicle.chargingPortTypes)"
                                            :key="port" class="inline-charger-item">
                                            <span :data-tooltip="port" class="tooltip-wrapper tooltip-down">
                                                <GlyphHandler :type="port" :size="16" class="feature-icon" />
                                            </span>
                                        </span>
                                    </span>
                                    <span class="feature-icon-container"
                                        v-if="vehicle.supportsPlugAndChargeIso15118 && !['no', 'tesla'].includes(String(vehicle.supportsPlugAndChargeIso15118).toLowerCase())">
                                        <span data-tooltip="Plug and Charge" class="tooltip-wrapper tooltip-down">
                                            <GlyphHandler type="PLUG-AND-CHARGE" :size="16" class="feature-icon" />
                                        </span>
                                    </span>
                                    <!-- Pet Mode -->
                                    <span class="feature-icon-container"
                                        v-if="vehicle.hasPetMode && String(vehicle.hasPetMode).toLowerCase() != 'no'">
                                        <span data-tooltip="Pet Mode" class="tooltip-wrapper tooltip-down">
                                            <GlyphHandler type="PET-MODE" :size="16" class="feature-icon" />
                                        </span>
                                    </span>
                                    <!-- Phone Key -->
                                    <span class="feature-icon-container"
                                        v-if="vehicle.supportsPhoneAsAKey && String(vehicle.supportsPhoneAsAKey).toLowerCase() != 'no'">
                                        <span data-tooltip="Phone Key" class="tooltip-wrapper tooltip-down">
                                            <GlyphHandler type="PHONE-KEY" :size="16" class="feature-icon" />
                                        </span>
                                    </span>
                                </p>
                            </div>
                        </div>

                        <VehicleDetailPane v-if="selectedVehicleKey === getVehicleKey(vehicle, index) && activeVehicle"
                            class="mobile-only-pane" :active-vehicle="activeVehicle" :active-tab-id="activeTabId"
                            :technical-categories="technicalCategories" :active-vehicle-specs="activeVehicleSpecs"
                            @close="closeSelectedVehicle" @select-tab="(id) => (activeTabId = id)" />
                    </template>

                    <div v-if="filteredVehicles.length === 0" class="no-results">
                        No vehicles match your selected filters.
                    </div>
                </div>
            </div>

            <VehicleDetailPane v-if="selectedVehicleKey !== null && activeVehicle" class="desktop-only-pane"
                :active-vehicle="activeVehicle" :active-tab-id="activeTabId" :technical-categories="technicalCategories"
                :active-vehicle-specs="activeVehicleSpecs" @close="closeSelectedVehicle"
                @select-tab="(id) => (activeTabId = id)" />
        </div>

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
            @close="closeCompareModal" @toggle-compare="(v) => toggleCompareVehicle(v, 0)" />
    </div>
</template>

<style scoped>
.grid-layout-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px 40px;
    position: relative;
    box-sizing: border-box;
}

.vehicles-list-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    width: 100%;
}

.results-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 16px 0;
    padding: 8px 16px;
    background: rgba(251, 252, 254, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(216, 225, 234, 0.85);
    border-radius: 12px;
}

html.dark .results-status-bar {
    background: rgba(28, 37, 65, 0.88);
    border-color: rgba(51, 65, 85, 0.85);
}

.status-counter {
    font-size: 14px;
    color: #475569;
}

html.dark .status-counter {
    color: #cbd5e1;
}

.compare-actions-bar {
    display: flex;
    align-items: center;
    gap: 8px;
}

.compare-trigger-btn {
    background-color: var(--accent-primary);
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
}

.compare-trigger-btn:hover:not(:disabled) {
    background-color: var(--accent-hover);
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
    border-radius: 9999px;
    padding: 5px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.compare-clear-btn:hover {
    background-color: rgba(100, 116, 139, 0.1);
}

html.dark .compare-clear-btn {
    color: #94a3b8;
    border-color: rgba(71, 85, 105, 0.8);
}

html.dark .compare-clear-btn:hover {
    background-color: rgba(148, 163, 184, 0.1);
    color: #f8fafc;
    border-color: #64748b;
}

.floating-compare-bar {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(251, 252, 254, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 8px 14px;
    border-radius: 9999px;
    border: 1px solid rgba(216, 225, 234, 0.85);
    box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.16);
}

html.dark .floating-compare-bar {
    background: rgba(28, 37, 65, 0.82);
    border-color: rgba(51, 65, 85, 0.85);
}

.floating-trigger-btn {
    padding: 8px 18px;
    font-size: 14px;
}

.split-view-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    width: 100%;
    align-items: start;
}

@media (min-width: 1024px) {
    .split-view-layout.has-expanded-card {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr);
        gap: 20px;
    }
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    min-width: 0;
    width: 100%;
}

.split-view-layout.has-expanded-card .grid-container {
    grid-template-columns: 1fr;
}

.grid-item {
    background: rgba(251, 252, 254, 0.94);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(216, 225, 234, 0.85);
    padding: 18px 20px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    position: relative;
}

html.dark .grid-item {
    background: rgba(28, 37, 65, 0.94);
    border-color: rgba(51, 65, 85, 0.85);
}

.grid-item:hover {
    border-color: var(--accent-primary);
    transform: translateY(-3px);
}

.grid-item.is-selected {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
}

.card-header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4px;
}

.compare-checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
}

.styled-checkbox-mini {
    appearance: none;
    -webkit-appearance: none;
    width: 13px;
    height: 13px;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    background: #ffffff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.styled-checkbox-mini:checked {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
}

.styled-checkbox-mini:checked::after {
    content: '';
    width: 3px;
    height: 6px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    position: absolute;
    top: 1px;
}

html.dark .styled-checkbox-mini {
    background: #0f172a;
    border-color: #475569;
}

html.dark .styled-checkbox-mini:checked {
    background: #38bdf8;
    border-color: #38bdf8;
}

.mobile-only-pane {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    display: block;
    margin-top: 8px;
}

.desktop-only-pane {
    display: none;
    position: relative;
    margin: 0 !important;
}

@media (min-width: 1024px) {
    .mobile-only-pane {
        display: none !important;
    }

    .desktop-only-pane {
        display: block !important;
    }
}

.grid-item h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
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
    color: var(--text-primary);
}

.pill {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.pill-mini-svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
    display: inline-block;
    vertical-align: middle;
}

.charging-speed-pill {
    background: #fefce8;
    color: #854d0e;
    border: 1px solid #fef08a;
}

html.dark .charging-speed-pill {
    background-color: rgba(250, 204, 21, 0.15);
    color: #facc15;
    border-color: transparent;
}

.drivetrain-pill {
    background: #eef4fc;
    color: #1e40af;
    border: 1px solid #d8e4f5;
}

html.dark .drivetrain-pill {
    background-color: #334155;
    color: var(--text-primary);
    border-color: transparent;
}

.battery-pill {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
}

html.dark .battery-pill {
    background-color: rgba(52, 211, 153, 0.15);
    color: #34d399;
    border-color: transparent;
}

.specs-preview-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

html.dark .specs-preview-summary {
    color: #94a3b8;
}

.feature-icon-container {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.feature-icon {
    height: 16px;
    width: 16px;
    display: inline-block;
    object-fit: contain;
    cursor: help;
    color: #64748b;
    /* Matches specs-preview-summary text */
    transition: color 0.2s ease;
}

html.dark .feature-icon {
    color: #94a3b8;
    /* Matches dark mode text */
}

/* High-Contrast Tooltips */
.tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
}

.tooltip-wrapper::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background-color: #0f172a !important;
    color: #ffffff !important;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 9px;
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: 2000;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-wrapper.tooltip-down::after {
    top: calc(100% + 8px);
    bottom: auto;
    transform: translateX(-50%) translateY(-4px);
}

.tooltip-wrapper:not([data-tooltip=""]):not([data-tooltip="null"]):hover::after {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}

.no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px;
    color: #64748b;
}
</style>