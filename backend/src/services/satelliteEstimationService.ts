/**
 * AgriMech Satellite Supply Intelligence — Estimation Service
 * 
 * CORE FORMULA:
 * Estimated Crop Production = Cultivated Area (hectares) × Average Crop Yield (tonnes/hectare)
 * Estimated Residue Quantity = Estimated Crop Production × Residue-to-Product Ratio (RPR) × Collection Availability Factor (CAF)
 * 
 * NOTE: Collection Availability Factor (CAF) accounts for residue retained on field
 * for soil mulching/conservation, cattle fodder consumption, and local domestic uses.
 * Real satellite remote sensing (e.g., Sentinel-2 MSI, Landsat-9, Google Earth Engine)
 * estimates vegetative area & NDVI/NDRE biophysical indices; physical residue tonnage is
 * an agro-climatic model estimation.
 */

export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'insufficient';

export type HarvestStatus = 
  | 'Standing Crop (Vegetative)'
  | 'Maturing / Near Harvest'
  | 'Active Harvesting Window'
  | 'Post-Harvest Stubble Window'
  | 'Fallow / Stubble Cleared';

export interface CropParameterConfig {
  cropKey: string;
  cropName: string;
  averageYieldPerHa: number; // in tonnes per hectare
  rpr: number; // Residue-to-Product Ratio
  caf: number; // Collection Availability Factor (0.0 to 1.0)
  calorificValueKcalKg: number;
  bulkDensityKgM3: number;
  typicalHarvestWindow: string;
  fodderRetentionPercent: number; // Contextual reason for CAF < 1.0
  mulchRetentionPercent: number;
}

export interface SatelliteRegion {
  id: string;
  villageName: string;
  talukTehsil: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  cropKey: string;
  cropName: string;
  cultivatedAreaHectares: number;
  harvestStatus: HarvestStatus;
  expectedHarvestPeriod: string;
  lastSatellitePassDate: string; // ISO date string
  sentinelTileId: string;
  ndviMean: number; // Normalized Difference Vegetation Index (-1 to +1, typically 0.2 to 0.8 for crops)
  ndreMean: number; // Normalized Difference Red Edge index
  cloudCoverPercent: number;
  predictionConfidencePercent: number; // Confidence score based on spectral clarity and historical ground truthing
  dataMode: 'DEMO_ESTIMATE';
  notes: string;
  
  // Computed fields (calculated by service)
  estimatedCropProductionTonnes: number;
  rpr: number;
  caf: number;
  theoreticalResidueTonnes: number;
  estimatedResidueTonnes: number;
  availabilityLevel: AvailabilityLevel;
  registeredSuppliersCount: number; // Count of existing AgriMech suppliers in local vicinity
}

// Configurable crop-specific agronomic parameters (Standard ICAR / TNAU / PAU agricultural reference benchmarks)
export const CROP_PARAMETERS: Record<string, CropParameterConfig> = {
  paddy: {
    cropKey: 'paddy',
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
    averageYieldPerHa: 4.2,
    rpr: 1.30, // 1.3 kg of straw generated per 1 kg grain produced
    caf: 0.65, // ~35% retained for cattle feeding and local mulching
    calorificValueKcalKg: 3200,
    bulkDensityKgM3: 75,
    typicalHarvestWindow: 'Oct 20 – Nov 30',
    fodderRetentionPercent: 20,
    mulchRetentionPercent: 15
  },
  wheat: {
    cropKey: 'wheat',
    cropName: 'Wheat Stubble & Stover',
    averageYieldPerHa: 3.8,
    rpr: 1.25,
    caf: 0.55, // ~45% utilized as valuable bhusa cattle dry fodder
    calorificValueKcalKg: 3500,
    bulkDensityKgM3: 85,
    typicalHarvestWindow: 'Apr 05 – May 10',
    fodderRetentionPercent: 40,
    mulchRetentionPercent: 5
  },
  sugarcane: {
    cropKey: 'sugarcane',
    cropName: 'Sugarcane Trash & Bagasse',
    averageYieldPerHa: 75.0, // cane yield per ha
    rpr: 0.15, // Field trash & leaves ratio
    caf: 0.70, // ~30% used for field trash blanketing
    calorificValueKcalKg: 3900,
    bulkDensityKgM3: 130,
    typicalHarvestWindow: 'Nov 01 – Mar 31',
    fodderRetentionPercent: 10,
    mulchRetentionPercent: 20
  },
  ragi: {
    cropKey: 'ragi',
    cropName: 'Finger Millet (Ragi) Straw',
    averageYieldPerHa: 2.1,
    rpr: 1.40,
    caf: 0.50, // Highly prized dairy fodder in Southern Karnataka
    calorificValueKcalKg: 3350,
    bulkDensityKgM3: 90,
    typicalHarvestWindow: 'Nov 10 – Dec 20',
    fodderRetentionPercent: 45,
    mulchRetentionPercent: 5
  },
  mustard: {
    cropKey: 'mustard',
    cropName: 'Mustard Stalk & Husk',
    averageYieldPerHa: 1.8,
    rpr: 2.00, // High woody stalk ratio
    caf: 0.75, // Little livestock consumption due to pungent glucosinolates
    calorificValueKcalKg: 3800,
    bulkDensityKgM3: 110,
    typicalHarvestWindow: 'Feb 15 – Mar 25',
    fodderRetentionPercent: 5,
    mulchRetentionPercent: 20
  },
  maize: {
    cropKey: 'maize',
    cropName: 'Maize Stover & Cob Residue',
    averageYieldPerHa: 5.5,
    rpr: 1.20,
    caf: 0.60,
    calorificValueKcalKg: 3600,
    bulkDensityKgM3: 95,
    typicalHarvestWindow: 'Sep 25 – Nov 10',
    fodderRetentionPercent: 25,
    mulchRetentionPercent: 15
  },
  cotton: {
    cropKey: 'cotton',
    cropName: 'Cotton Stalks',
    averageYieldPerHa: 2.2,
    rpr: 2.80, // High woody biomass
    caf: 0.85, // Mostly uprooted and burned if uncollected
    calorificValueKcalKg: 4100,
    bulkDensityKgM3: 140,
    typicalHarvestWindow: 'Dec 01 – Feb 15',
    fodderRetentionPercent: 0,
    mulchRetentionPercent: 15
  },
  mulberry: {
    cropKey: 'mulberry',
    cropName: 'Mulberry Pruned Dry Stems',
    averageYieldPerHa: 8.0,
    rpr: 0.35,
    caf: 0.80,
    calorificValueKcalKg: 3750,
    bulkDensityKgM3: 125,
    typicalHarvestWindow: 'Continuous / Quarterly pruning',
    fodderRetentionPercent: 10,
    mulchRetentionPercent: 10
  },
  coconut: {
    cropKey: 'coconut',
    cropName: 'Coconut Husk & Shell Biomass',
    averageYieldPerHa: 6.5,
    rpr: 0.45,
    caf: 0.70,
    calorificValueKcalKg: 4300,
    bulkDensityKgM3: 160,
    typicalHarvestWindow: 'Year-round bi-monthly cycles',
    fodderRetentionPercent: 0,
    mulchRetentionPercent: 30
  }
};

/**
 * Evaluates residue availability level based on net collectable tonnage:
 * - Green (High): >= 1,200 Tonnes (viable for large commercial aggregation)
 * - Yellow (Medium): 400 - 1,199 Tonnes (cluster/medium lot)
 * - Red (Low): 100 - 399 Tonnes (limited local availability)
 * - Grey (Insufficient Data): < 100 Tonnes or heavy cloud cover / sparse data
 */
export function determineAvailabilityLevel(
  tonnes: number,
  cloudCoverPercent: number,
  confidencePercent: number
): AvailabilityLevel {
  if (tonnes < 100 || cloudCoverPercent > 65 || confidencePercent < 55) {
    return 'insufficient';
  }
  if (tonnes >= 1200) {
    return 'high';
  }
  if (tonnes >= 400) {
    return 'medium';
  }
  return 'low';
}

/**
 * Calculates residue availability using the modular formula:
 * Crop Production = Area × Yield
 * Residue = Crop Production × RPR × CAF
 */
export function calculateResidueEstimate(
  areaHa: number,
  cropKey: string,
  customYield?: number,
  customRpr?: number,
  customCaf?: number
): {
  cropProductionTonnes: number;
  theoreticalResidueTonnes: number;
  estimatedResidueTonnes: number;
  rpr: number;
  caf: number;
  yieldPerHa: number;
} {
  const cfg = CROP_PARAMETERS[cropKey] || CROP_PARAMETERS['paddy'];
  const yieldPerHa = customYield !== undefined ? customYield : cfg.averageYieldPerHa;
  const rpr = customRpr !== undefined ? customRpr : cfg.rpr;
  const caf = customCaf !== undefined ? customCaf : cfg.caf;

  const cropProductionTonnes = Math.round(areaHa * yieldPerHa);
  const theoreticalResidueTonnes = Math.round(cropProductionTonnes * rpr);
  const estimatedResidueTonnes = Math.round(theoreticalResidueTonnes * caf);

  return {
    cropProductionTonnes,
    theoreticalResidueTonnes,
    estimatedResidueTonnes,
    rpr,
    caf,
    yieldPerHa
  };
}

// Calibrated Regional Datasets across Pan-India Agricultural Belts
const RAW_REGIONS_DATA: Omit<
  SatelliteRegion,
  | 'estimatedCropProductionTonnes'
  | 'rpr'
  | 'caf'
  | 'theoreticalResidueTonnes'
  | 'estimatedResidueTonnes'
  | 'availabilityLevel'
  | 'cropName'
>[] = [
  // Karnataka: Bengaluru South / Ramanagara / Mandya Agricultural Belt
  {
    id: 'sat-ka-01',
    villageName: 'Maralawadi Hobli',
    talukTehsil: 'Kanakapura',
    district: 'Ramanagara',
    state: 'Karnataka',
    lat: 12.5714,
    lng: 77.4912,
    cropKey: 'ragi',
    cultivatedAreaHectares: 1420,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Nov 05 – Nov 28, 2026',
    lastSatellitePassDate: '2026-10-27',
    sentinelTileId: 'T43PGM',
    ndviMean: 0.68,
    ndreMean: 0.42,
    cloudCoverPercent: 8,
    predictionConfidencePercent: 92,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Dense finger millet cultivation with uniform canopy spectral response. High density of uncontracted dairy smallholders.',
    registeredSuppliersCount: 4
  },
  {
    id: 'sat-ka-02',
    villageName: 'Kailancha Village Cluster',
    talukTehsil: 'Ramanagara',
    district: 'Ramanagara',
    state: 'Karnataka',
    lat: 12.6980,
    lng: 77.2410,
    cropKey: 'mulberry',
    cultivatedAreaHectares: 850,
    harvestStatus: 'Maturing / Near Harvest',
    expectedHarvestPeriod: 'Nov 12 – Dec 05, 2026',
    lastSatellitePassDate: '2026-10-29',
    sentinelTileId: 'T43PGM',
    ndviMean: 0.74,
    ndreMean: 0.49,
    cloudCoverPercent: 12,
    predictionConfidencePercent: 88,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Sericulture belt with pruned dry stems. Untapped non-fodder woody biomass suited for industrial gasifiers.',
    registeredSuppliersCount: 1
  },
  {
    id: 'sat-ka-03',
    villageName: 'Maddur East Agro-Fields',
    talukTehsil: 'Maddur',
    district: 'Mandya',
    state: 'Karnataka',
    lat: 12.5841,
    lng: 77.0428,
    cropKey: 'sugarcane',
    cultivatedAreaHectares: 2600,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Nov 20 – Jan 15, 2027',
    lastSatellitePassDate: '2026-10-27',
    sentinelTileId: 'T43PGM',
    ndviMean: 0.81,
    ndreMean: 0.54,
    cloudCoverPercent: 5,
    predictionConfidencePercent: 94,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Intensive canal-irrigated sugarcane tracts along Shimsha river. Estimated ~13,650 tonnes of trash available for boiler co-firing.',
    registeredSuppliersCount: 6
  },
  {
    id: 'sat-ka-04',
    villageName: 'Kunigal Agro Tract',
    talukTehsil: 'Kunigal',
    district: 'Tumakuru',
    state: 'Karnataka',
    lat: 13.0234,
    lng: 77.0315,
    cropKey: 'ragi',
    cultivatedAreaHectares: 780,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Nov 02 – Nov 25, 2026',
    lastSatellitePassDate: '2026-10-24',
    sentinelTileId: 'T43PGN',
    ndviMean: 0.62,
    ndreMean: 0.38,
    cloudCoverPercent: 14,
    predictionConfidencePercent: 86,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Semi-arid red sandy loam soil. Moderate yield with high local cattle fodder retention factor (50%).',
    registeredSuppliersCount: 0
  },
  {
    id: 'sat-ka-05',
    villageName: 'Srinivaspur Fruit & Crop Belt',
    talukTehsil: 'Srinivaspur',
    district: 'Kolar',
    state: 'Karnataka',
    lat: 13.3412,
    lng: 78.2120,
    cropKey: 'maize',
    cultivatedAreaHectares: 540,
    harvestStatus: 'Post-Harvest Stubble Window',
    expectedHarvestPeriod: 'Oct 20 – Nov 10, 2026',
    lastSatellitePassDate: '2026-10-22',
    sentinelTileId: 'T43PGN',
    ndviMean: 0.41,
    ndreMean: 0.26,
    cloudCoverPercent: 19,
    predictionConfidencePercent: 81,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Stover currently field-standing; high fire and decomposition risk if baling equipment is not dispatched promptly.',
    registeredSuppliersCount: 2
  },

  // Punjab: Malwa & Majha Rice Bowl (Stubble Burning Hotspots)
  {
    id: 'sat-pb-01',
    villageName: 'Dhurkot & Dhuri Rural Belt',
    talukTehsil: 'Dhuri',
    district: 'Sangrur',
    state: 'Punjab',
    lat: 30.3702,
    lng: 75.8711,
    cropKey: 'paddy',
    cultivatedAreaHectares: 4800,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Oct 25 – Nov 18, 2026',
    lastSatellitePassDate: '2026-10-30',
    sentinelTileId: 'T43RER',
    ndviMean: 0.72,
    ndreMean: 0.46,
    cloudCoverPercent: 3,
    predictionConfidencePercent: 96,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Critical high-tonnage Basmati & PR-126 paddy zone. Prime sourcing hub for Sangrur 2G bio-ethanol refinery.',
    registeredSuppliersCount: 8
  },
  {
    id: 'sat-pb-02',
    villageName: 'Samrala Agro Cluster',
    talukTehsil: 'Samrala',
    district: 'Ludhiana',
    state: 'Punjab',
    lat: 30.8385,
    lng: 76.1912,
    cropKey: 'paddy',
    cultivatedAreaHectares: 3600,
    harvestStatus: 'Maturing / Near Harvest',
    expectedHarvestPeriod: 'Nov 01 – Nov 22, 2026',
    lastSatellitePassDate: '2026-10-30',
    sentinelTileId: 'T43RER',
    ndviMean: 0.76,
    ndreMean: 0.48,
    cloudCoverPercent: 2,
    predictionConfidencePercent: 95,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'High baling machine readiness; low registered supplier count presents pristine frontier aggregation opportunity.',
    registeredSuppliersCount: 3
  },
  {
    id: 'sat-pb-03',
    villageName: 'Nabha Rural Tract',
    talukTehsil: 'Nabha',
    district: 'Patiala',
    state: 'Punjab',
    lat: 30.3752,
    lng: 76.1528,
    cropKey: 'paddy',
    cultivatedAreaHectares: 2950,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Oct 28 – Nov 15, 2026',
    lastSatellitePassDate: '2026-10-29',
    sentinelTileId: 'T43RER',
    ndviMean: 0.69,
    ndreMean: 0.44,
    cloudCoverPercent: 4,
    predictionConfidencePercent: 93,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Combined harvester usage identified via thermal anomaly & Sentinel SAR tracking. Stubble immediately available.',
    registeredSuppliersCount: 5
  },
  {
    id: 'sat-pb-04',
    villageName: 'Baghapurana Farms',
    talukTehsil: 'Baghapurana',
    district: 'Moga',
    state: 'Punjab',
    lat: 30.6842,
    lng: 75.0921,
    cropKey: 'paddy',
    cultivatedAreaHectares: 2100,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Nov 08 – Nov 30, 2026',
    lastSatellitePassDate: '2026-10-28',
    sentinelTileId: 'T43REQ',
    ndviMean: 0.78,
    ndreMean: 0.51,
    cloudCoverPercent: 6,
    predictionConfidencePercent: 91,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Late sown non-basmati PR paddy varieties. Optimal biomass window mid-November.',
    registeredSuppliersCount: 2
  },

  // Haryana: Karnal / Kurukshetra / Panipat Rice & Wheat Corridor
  {
    id: 'sat-hr-01',
    villageName: 'Nilokheri Agro Fields',
    talukTehsil: 'Nilokheri',
    district: 'Karnal',
    state: 'Haryana',
    lat: 29.8320,
    lng: 76.9214,
    cropKey: 'paddy',
    cultivatedAreaHectares: 3200,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Oct 22 – Nov 15, 2026',
    lastSatellitePassDate: '2026-10-31',
    sentinelTileId: 'T43RFQ',
    ndviMean: 0.70,
    ndreMean: 0.45,
    cloudCoverPercent: 4,
    predictionConfidencePercent: 97,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Top tier basmati straw area with automated round balers operating. High calorific value straw.',
    registeredSuppliersCount: 7
  },
  {
    id: 'sat-hr-02',
    villageName: 'Shahabad Markanda Belt',
    talukTehsil: 'Shahabad',
    district: 'Kurukshetra',
    state: 'Haryana',
    lat: 30.1681,
    lng: 76.8710,
    cropKey: 'paddy',
    cultivatedAreaHectares: 2450,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Oct 26 – Nov 20, 2026',
    lastSatellitePassDate: '2026-10-30',
    sentinelTileId: 'T43RFQ',
    ndviMean: 0.73,
    ndreMean: 0.47,
    cloudCoverPercent: 2,
    predictionConfidencePercent: 94,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Kurukshetra GT Road corridor with outstanding highway logistics access for 16-Tonne MCV trucks.',
    registeredSuppliersCount: 4
  },
  {
    id: 'sat-hr-03',
    villageName: 'Israna Stubble Cluster',
    talukTehsil: 'Israna',
    district: 'Panipat',
    state: 'Haryana',
    lat: 29.2741,
    lng: 76.8624,
    cropKey: 'paddy',
    cultivatedAreaHectares: 1750,
    harvestStatus: 'Maturing / Near Harvest',
    expectedHarvestPeriod: 'Nov 03 – Nov 24, 2026',
    lastSatellitePassDate: '2026-10-29',
    sentinelTileId: 'T43RFP',
    ndviMean: 0.75,
    ndreMean: 0.48,
    cloudCoverPercent: 5,
    predictionConfidencePercent: 92,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Located adjacent to Panipat thermal & textile industrial cluster; minimal transit freight distance.',
    registeredSuppliersCount: 3
  },
  {
    id: 'sat-hr-04',
    villageName: 'Kalanwali Agro Zone',
    talukTehsil: 'Kalanwali',
    district: 'Sirsa',
    state: 'Haryana',
    lat: 29.8310,
    lng: 74.9810,
    cropKey: 'cotton',
    cultivatedAreaHectares: 1900,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Dec 05 – Jan 20, 2027',
    lastSatellitePassDate: '2026-10-25',
    sentinelTileId: 'T43REO',
    ndviMean: 0.65,
    ndreMean: 0.40,
    cloudCoverPercent: 9,
    predictionConfidencePercent: 88,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'High lignocellulose woody cotton stalks. Excellent bulk pelletization feedstock with 4,100 kcal/kg GCV.',
    registeredSuppliersCount: 1
  },

  // Western Uttar Pradesh: Meerut / Muzaffarnagar Sugar & Stubble Belt
  {
    id: 'sat-up-01',
    villageName: 'Daurala Sugar Agro Corridor',
    talukTehsil: 'Sardhana',
    district: 'Meerut',
    state: 'Uttar Pradesh',
    lat: 29.1180,
    lng: 77.7120,
    cropKey: 'sugarcane',
    cultivatedAreaHectares: 3800,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Nov 15 – Feb 28, 2027',
    lastSatellitePassDate: '2026-10-28',
    sentinelTileId: 'T44RLQ',
    ndviMean: 0.83,
    ndreMean: 0.55,
    cloudCoverPercent: 3,
    predictionConfidencePercent: 96,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Daurala mill command area. Massive sugarcane trash volume available as farmers de-trash fields before cutting.',
    registeredSuppliersCount: 5
  },
  {
    id: 'sat-up-02',
    villageName: 'Khatauli Rural Belt',
    talukTehsil: 'Khatauli',
    district: 'Muzaffarnagar',
    state: 'Uttar Pradesh',
    lat: 29.2815,
    lng: 77.7291,
    cropKey: 'sugarcane',
    cultivatedAreaHectares: 3200,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Nov 20 – Mar 10, 2027',
    lastSatellitePassDate: '2026-10-28',
    sentinelTileId: 'T44RLQ',
    ndviMean: 0.82,
    ndreMean: 0.54,
    cloudCoverPercent: 4,
    predictionConfidencePercent: 95,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'World-renowned sugarcane basin; high moisture bagasse and dry field-cured leaves available at farm gates.',
    registeredSuppliersCount: 4
  },
  {
    id: 'sat-up-03',
    villageName: 'Garhmukteshwar Plains',
    talukTehsil: 'Garhmukteshwar',
    district: 'Hapur',
    state: 'Uttar Pradesh',
    lat: 28.7845,
    lng: 78.0910,
    cropKey: 'paddy',
    cultivatedAreaHectares: 1450,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Oct 28 – Nov 20, 2026',
    lastSatellitePassDate: '2026-10-26',
    sentinelTileId: 'T44RLP',
    ndviMean: 0.67,
    ndreMean: 0.43,
    cloudCoverPercent: 7,
    predictionConfidencePercent: 90,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Ganga river basin silt soil with high biomass productivity. 0 registered suppliers in immediate taluk.',
    registeredSuppliersCount: 0
  },

  // Rajasthan: Alwar / Bharatpur Mustard Belt
  {
    id: 'sat-rj-01',
    villageName: 'Kishangarh Bas Mustard Tract',
    talukTehsil: 'Kishangarh Bas',
    district: 'Alwar',
    state: 'Rajasthan',
    lat: 27.8180,
    lng: 76.7210,
    cropKey: 'mustard',
    cultivatedAreaHectares: 2800,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Feb 10 – Mar 20, 2027',
    lastSatellitePassDate: '2026-10-25',
    sentinelTileId: 'T43RGP',
    ndviMean: 0.58,
    ndreMean: 0.36,
    cloudCoverPercent: 1,
    predictionConfidencePercent: 91,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Winter Rabi mustard crop emergence detected. Projected 7,560 tonnes of high-energy stalk biomass.',
    registeredSuppliersCount: 2
  },
  {
    id: 'sat-rj-02',
    villageName: 'Deeg Agri Basin',
    talukTehsil: 'Deeg',
    district: 'Bharatpur',
    state: 'Rajasthan',
    lat: 27.4720,
    lng: 77.3250,
    cropKey: 'mustard',
    cultivatedAreaHectares: 1650,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Feb 15 – Mar 25, 2027',
    lastSatellitePassDate: '2026-10-25',
    sentinelTileId: 'T43RGP',
    ndviMean: 0.54,
    ndreMean: 0.33,
    cloudCoverPercent: 3,
    predictionConfidencePercent: 89,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Oilseed residue with minimal cattle consumption factor; ~75% available for briquetting.',
    registeredSuppliersCount: 1
  },

  // Maharashtra: Pune / Baramati Sugarcane & Stover Belt
  {
    id: 'sat-mh-01',
    villageName: 'Daund Rural Sugarcane Zone',
    talukTehsil: 'Daund',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.4610,
    lng: 74.5820,
    cropKey: 'sugarcane',
    cultivatedAreaHectares: 2200,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Nov 01 – Jan 30, 2027',
    lastSatellitePassDate: '2026-10-27',
    sentinelTileId: 'T43QDA',
    ndviMean: 0.79,
    ndreMean: 0.52,
    cloudCoverPercent: 8,
    predictionConfidencePercent: 93,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Bhima river sugar cooperative zone. High densification potential into 25mm industrial pellets.',
    registeredSuppliersCount: 3
  },

  // Bihar: Patna / Nalanda Gangetic Biomass Belt
  {
    id: 'sat-br-01',
    villageName: 'Bikram Agricultural Plains',
    talukTehsil: 'Bikram',
    district: 'Patna',
    state: 'Bihar',
    lat: 25.4310,
    lng: 84.8510,
    cropKey: 'paddy',
    cultivatedAreaHectares: 1850,
    harvestStatus: 'Active Harvesting Window',
    expectedHarvestPeriod: 'Nov 05 – Dec 05, 2026',
    lastSatellitePassDate: '2026-10-29',
    sentinelTileId: 'T45RUK',
    ndviMean: 0.71,
    ndreMean: 0.46,
    cloudCoverPercent: 11,
    predictionConfidencePercent: 91,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Gangetic alluvial soil paddy. Untapped virgin biomass pool with zero registered local suppliers.',
    registeredSuppliersCount: 0
  },

  // Insufficient Data Sample (for testing grey indicator)
  {
    id: 'sat-cloud-01',
    villageName: 'Sakleshpur Clouded Ridge',
    talukTehsil: 'Sakleshpur',
    district: 'Hassan',
    state: 'Karnataka',
    lat: 12.8940,
    lng: 75.7820,
    cropKey: 'paddy',
    cultivatedAreaHectares: 120,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Dec 01 – Dec 25, 2026',
    lastSatellitePassDate: '2026-10-18',
    sentinelTileId: 'T43PGL',
    ndviMean: 0.31,
    ndreMean: 0.18,
    cloudCoverPercent: 78, // High cloud cover triggers grey indicator
    predictionConfidencePercent: 42,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Heavy Western Ghats cloud cover prevented clean Sentinel-2 surface reflectance classification.',
    registeredSuppliersCount: 0
  }
];

export class SatelliteEstimationService {
  /**
   * Retrieves all satellite regions with calculated agronomic estimates.
   */
  public getAllRegions(filters?: {
    district?: string;
    crop?: string;
    availabilityLevel?: string;
    harvestStatus?: string;
    minTonnes?: number;
    query?: string;
  }): SatelliteRegion[] {
    const computedRegions: SatelliteRegion[] = RAW_REGIONS_DATA.map(r => {
      const cfg = CROP_PARAMETERS[r.cropKey] || CROP_PARAMETERS['paddy'];
      const estimates = calculateResidueEstimate(r.cultivatedAreaHectares, r.cropKey);
      const availabilityLevel = determineAvailabilityLevel(
        estimates.estimatedResidueTonnes,
        r.cloudCoverPercent,
        r.predictionConfidencePercent
      );

      return {
        ...r,
        cropName: cfg.cropName,
        estimatedCropProductionTonnes: estimates.cropProductionTonnes,
        rpr: estimates.rpr,
        caf: estimates.caf,
        theoreticalResidueTonnes: estimates.theoreticalResidueTonnes,
        estimatedResidueTonnes: estimates.estimatedResidueTonnes,
        availabilityLevel
      };
    });

    if (!filters) return computedRegions;

    return computedRegions.filter(reg => {
      if (filters.district && filters.district !== 'all') {
        if (reg.district.toLowerCase() !== filters.district.toLowerCase()) return false;
      }
      if (filters.crop && filters.crop !== 'all') {
        if (reg.cropKey.toLowerCase() !== filters.crop.toLowerCase()) return false;
      }
      if (filters.availabilityLevel && filters.availabilityLevel !== 'all') {
        if (reg.availabilityLevel !== filters.availabilityLevel) return false;
      }
      if (filters.harvestStatus && filters.harvestStatus !== 'all') {
        if (reg.harvestStatus !== filters.harvestStatus) return false;
      }
      if (filters.minTonnes && filters.minTonnes > 0) {
        if (reg.estimatedResidueTonnes < filters.minTonnes) return false;
      }
      if (filters.query && filters.query.trim()) {
        const q = filters.query.toLowerCase().trim();
        const matches = 
          reg.villageName.toLowerCase().includes(q) ||
          reg.talukTehsil.toLowerCase().includes(q) ||
          reg.district.toLowerCase().includes(q) ||
          reg.state.toLowerCase().includes(q) ||
          reg.cropName.toLowerCase().includes(q) ||
          reg.notes.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  /**
   * Retrieves a single region by ID.
   */
  public getRegionById(id: string): SatelliteRegion | null {
    const all = this.getAllRegions();
    return all.find(r => r.id === id) || null;
  }

  /**
   * Calculates custom crop residue availability on demand (interactive calculator).
   */
  public calculateCustomResidue(params: {
    areaHectares: number;
    cropKey: string;
    customYield?: number;
    customRpr?: number;
    customCaf?: number;
  }) {
    const estimates = calculateResidueEstimate(
      params.areaHectares,
      params.cropKey,
      params.customYield,
      params.customRpr,
      params.customCaf
    );
    const cfg = CROP_PARAMETERS[params.cropKey] || CROP_PARAMETERS['paddy'];
    const availabilityLevel = determineAvailabilityLevel(
      estimates.estimatedResidueTonnes,
      0,
      95
    );

    return {
      ...estimates,
      cropKey: params.cropKey,
      cropName: cfg.cropName,
      calorificValueKcalKg: cfg.calorificValueKcalKg,
      availabilityLevel,
      formulaNote: 'Residue = Area (ha) × Yield (t/ha) × RPR × CAF'
    };
  }

  /**
   * Provides overall aggregate summary metrics across all monitored satellite areas.
   */
  public getAggregateMetrics() {
    const regions = this.getAllRegions();
    const totalAreaHa = regions.reduce((acc, r) => acc + r.cultivatedAreaHectares, 0);
    const totalProductionTonnes = regions.reduce((acc, r) => acc + r.estimatedCropProductionTonnes, 0);
    const totalResidueTonnes = regions.reduce((acc, r) => acc + r.estimatedResidueTonnes, 0);
    const highAvailabilityCount = regions.filter(r => r.availabilityLevel === 'high').length;
    const mediumAvailabilityCount = regions.filter(r => r.availabilityLevel === 'medium').length;
    const lowAvailabilityCount = regions.filter(r => r.availabilityLevel === 'low').length;
    const insufficientCount = regions.filter(r => r.availabilityLevel === 'insufficient').length;
    const avgConfidence = Math.round(
      regions.reduce((acc, r) => acc + r.predictionConfidencePercent, 0) / (regions.length || 1)
    );

    return {
      monitoredRegionsCount: regions.length,
      totalAreaHectares: totalAreaHa,
      totalCropProductionTonnes: totalProductionTonnes,
      totalResidueTonnes: totalResidueTonnes,
      highAvailabilityCount,
      mediumAvailabilityCount,
      lowAvailabilityCount,
      insufficientCount,
      averageConfidencePercent: avgConfidence,
      dataMode: 'DEMO_ESTIMATE',
      spectralSensors: ['Sentinel-2 MSI Level-2A', 'Landsat-9 OLI-2'],
      lastPipelineRun: new Date().toISOString()
    };
  }
}

export const satelliteEstimationService = new SatelliteEstimationService();
