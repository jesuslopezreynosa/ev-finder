export interface TechnicalCategory {
    readonly id: string;
    readonly title: string;
}

export const TECHNICAL_CATEGORIES: readonly TechnicalCategory[] = [
    { id: 'powertrainPerformance', title: 'Powertrain & Performance' },
    { id: 'energyCharging', title: 'Energy & Charging' },
    { id: 'dimensions', title: 'Dimensions' },
    { id: 'cabinConvenience', title: 'Cabin & Convenience' },
    { id: 'infotainmentConnectivity', title: 'Infotainment & Connectivity' },
    { id: 'camerasSensors', title: 'Cameras & Sensors' },
    { id: 'warranties', title: 'Warranties' }
] as const;

export type CategoryId = (typeof TECHNICAL_CATEGORIES)[number]['id'];

export const CATEGORY_MAPPINGS: Record<CategoryId, readonly string[]> = {
    powertrainPerformance: ['hasHeatPump', 'powerHorsepower', 'torqueFootPounds', 'zeroToSixtyTimeSeconds'],
    energyCharging: ['batteryChemistry', 'batteryNominalVoltage', 'chargingPortTypes', 'dcChargingSpeedKilowatts', 'epaCombinedEfficiencyKilowattHoursPerHundredMiles', 'epaCombinedEfficiencyWattHoursPerMile', 'epaCombinedRangeMiles', 'maxSupportedDcChargingVoltage', 'netBatteryCapacityKilowattHours', 'onboardChargerAmperes', 'plugAndChargeProviders', 'recommendedDailyChargePercent', 'supportsAc277vCharging', 'supportsBatteryPreconditioning', 'supportsPlugAndChargeIso15118', 'supportsSuperchargerAccess', 'supportsVehicleToEverything', 'typicalFullRangeMiles', 'voltageArchitecture'],
    dimensions: ['frunkCapacityLiters', 'grossWeightPounds', 'groundClearanceInches', 'heightInches', 'lengthInches', 'towingCapacityPounds', 'turningRadiusFeet', 'widthInches'],
    cabinConvenience: ['hasAdaptiveCruiseControl', 'hasBuiltInDashcam', 'hasGarageDoorOpener', 'hasGlassRoof', 'hasHeatedSeats', 'hasHeatedSteeringWheel', 'hasOnePedalDrive', 'hasPetMode', 'hasPoweredLiftgate', 'hasPoweredSeats', 'hasPoweredSideMirrors', 'hasVentilatedSeats', 'isOnePedalDrivePersistent', 'maxPhoneKeys', 'seatCount', 'standardSeatMaterial', 'supportsMemoryProfilePerSeatAndMirror', 'supportsPhoneAsAKey', 'supportsUserProfiles'],
    infotainmentConnectivity: ['includedConnectivityFeatures', 'infotainmentOperatingSystem', 'infotainmentScreenResolutionPx', 'infotainmentScreenPpi', 'infotainmentScreenSizeInches', 'navigationProvider', 'optionalConnectivityFeatures', 'optionalSubscriptions', 'requiredFeatureSubscriptions', 'supportsAppleCarPlayAndAndroidAuto', 'supportsAudioDolbyAtmos', 'supportsOverTheAirUpdates', 'audioBrand', 'audioPowerWatts', 'audioSpeakerCount', 'audioSubwooferCount', 'usbPortCount'],
    camerasSensors: ['driverCameraType', 'exteriorCameraCount', 'exteriorSensors', 'interiorCameraCount'],
    warranties: ['batteryWarranty', 'corrosionWarranty', 'driveUnitWarranty', 'vehicleWarranty']
};