import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { 
  SatelliteRegion, 
  SatelliteAggregateMetrics, 
  CropParameterConfig, 
  AvailabilityLevel, 
  HarvestStatus 
} from '../models/marketplace.model';
import { MarketplaceService } from './marketplace.service';
import { getApiBaseUrl } from '../config/api.config';

// Crop-specific standard agricultural parameters
export const DEFAULT_CROP_PARAMETERS: Record<string, CropParameterConfig> = {
  paddy: {
    cropKey: 'paddy',
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
    averageYieldPerHa: 4.2,
    rpr: 1.30,
    caf: 0.65,
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
    caf: 0.55,
    calorificValueKcalKg: 3500,
    bulkDensityKgM3: 85,
    typicalHarvestWindow: 'Apr 05 – May 10',
    fodderRetentionPercent: 40,
    mulchRetentionPercent: 5
  },
  sugarcane: {
    cropKey: 'sugarcane',
    cropName: 'Sugarcane Trash & Bagasse',
    averageYieldPerHa: 75.0,
    rpr: 0.15,
    caf: 0.70,
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
    caf: 0.50,
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
    rpr: 2.00,
    caf: 0.75,
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
    rpr: 2.80,
    caf: 0.85,
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
    typicalHarvestWindow: 'Quarterly pruning',
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
    typicalHarvestWindow: 'Bi-monthly cycles',
    fodderRetentionPercent: 0,
    mulchRetentionPercent: 30
  }
};

// Fallback high-fidelity dataset for offline or standalone client preview
const FALLBACK_REGIONS: SatelliteRegion[] = [
  {
    id: 'sat-ka-01',
    villageName: 'Maralawadi Hobli',
    talukTehsil: 'Kanakapura',
    district: 'Ramanagara',
    state: 'Karnataka',
    lat: 12.5714,
    lng: 77.4912,
    cropKey: 'ragi',
    cropName: 'Finger Millet (Ragi) Straw',
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
    estimatedCropProductionTonnes: 2982,
    rpr: 1.40,
    caf: 0.50,
    theoreticalResidueTonnes: 4175,
    estimatedResidueTonnes: 2088,
    availabilityLevel: 'high',
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
    cropName: 'Mulberry Pruned Dry Stems',
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
    estimatedCropProductionTonnes: 6800,
    rpr: 0.35,
    caf: 0.80,
    theoreticalResidueTonnes: 2380,
    estimatedResidueTonnes: 1904,
    availabilityLevel: 'high',
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
    cropName: 'Sugarcane Trash & Bagasse',
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
    notes: 'Intensive canal-irrigated sugarcane tracts along Shimsha river. High trash volume available for boiler co-firing.',
    estimatedCropProductionTonnes: 195000,
    rpr: 0.15,
    caf: 0.70,
    theoreticalResidueTonnes: 29250,
    estimatedResidueTonnes: 20475,
    availabilityLevel: 'high',
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
    cropName: 'Finger Millet (Ragi) Straw',
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
    estimatedCropProductionTonnes: 1638,
    rpr: 1.40,
    caf: 0.50,
    theoreticalResidueTonnes: 2293,
    estimatedResidueTonnes: 1147,
    availabilityLevel: 'medium',
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
    cropName: 'Maize Stover & Cob Residue',
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
    estimatedCropProductionTonnes: 2970,
    rpr: 1.20,
    caf: 0.60,
    theoreticalResidueTonnes: 3564,
    estimatedResidueTonnes: 2138,
    availabilityLevel: 'high',
    registeredSuppliersCount: 2
  },
  {
    id: 'sat-pb-01',
    villageName: 'Dhurkot & Dhuri Rural Belt',
    talukTehsil: 'Dhuri',
    district: 'Sangrur',
    state: 'Punjab',
    lat: 30.3702,
    lng: 75.8711,
    cropKey: 'paddy',
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 20160,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 26208,
    estimatedResidueTonnes: 17035,
    availabilityLevel: 'high',
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
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 15120,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 19656,
    estimatedResidueTonnes: 12776,
    availabilityLevel: 'high',
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
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 12390,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 16107,
    estimatedResidueTonnes: 10470,
    availabilityLevel: 'high',
    registeredSuppliersCount: 5
  },
  {
    id: 'sat-hr-01',
    villageName: 'Nilokheri Agro Fields',
    talukTehsil: 'Nilokheri',
    district: 'Karnal',
    state: 'Haryana',
    lat: 29.8320,
    lng: 76.9214,
    cropKey: 'paddy',
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 13440,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 17472,
    estimatedResidueTonnes: 11357,
    availabilityLevel: 'high',
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
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 10290,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 13377,
    estimatedResidueTonnes: 8695,
    availabilityLevel: 'high',
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
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 7350,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 9555,
    estimatedResidueTonnes: 6211,
    availabilityLevel: 'high',
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
    cropName: 'Cotton Stalks',
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
    estimatedCropProductionTonnes: 4180,
    rpr: 2.80,
    caf: 0.85,
    theoreticalResidueTonnes: 11704,
    estimatedResidueTonnes: 9948,
    availabilityLevel: 'high',
    registeredSuppliersCount: 1
  },
  {
    id: 'sat-up-01',
    villageName: 'Daurala Sugar Agro Corridor',
    talukTehsil: 'Sardhana',
    district: 'Meerut',
    state: 'Uttar Pradesh',
    lat: 29.1180,
    lng: 77.7120,
    cropKey: 'sugarcane',
    cropName: 'Sugarcane Trash & Bagasse',
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
    estimatedCropProductionTonnes: 285000,
    rpr: 0.15,
    caf: 0.70,
    theoreticalResidueTonnes: 42750,
    estimatedResidueTonnes: 29925,
    availabilityLevel: 'high',
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
    cropName: 'Sugarcane Trash & Bagasse',
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
    estimatedCropProductionTonnes: 240000,
    rpr: 0.15,
    caf: 0.70,
    theoreticalResidueTonnes: 36000,
    estimatedResidueTonnes: 25200,
    availabilityLevel: 'high',
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
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 6090,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 7917,
    estimatedResidueTonnes: 5146,
    availabilityLevel: 'high',
    registeredSuppliersCount: 0
  },
  {
    id: 'sat-rj-01',
    villageName: 'Kishangarh Bas Mustard Tract',
    talukTehsil: 'Kishangarh Bas',
    district: 'Alwar',
    state: 'Rajasthan',
    lat: 27.8180,
    lng: 76.7210,
    cropKey: 'mustard',
    cropName: 'Mustard Stalk & Husk',
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
    estimatedCropProductionTonnes: 5040,
    rpr: 2.00,
    caf: 0.75,
    theoreticalResidueTonnes: 10080,
    estimatedResidueTonnes: 7560,
    availabilityLevel: 'high',
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
    cropName: 'Mustard Stalk & Husk',
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
    estimatedCropProductionTonnes: 2970,
    rpr: 2.00,
    caf: 0.75,
    theoreticalResidueTonnes: 5940,
    estimatedResidueTonnes: 4455,
    availabilityLevel: 'high',
    registeredSuppliersCount: 1
  },
  {
    id: 'sat-mh-01',
    villageName: 'Daund Rural Sugarcane Zone',
    talukTehsil: 'Daund',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.4610,
    lng: 74.5820,
    cropKey: 'sugarcane',
    cropName: 'Sugarcane Trash & Bagasse',
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
    estimatedCropProductionTonnes: 165000,
    rpr: 0.15,
    caf: 0.70,
    theoreticalResidueTonnes: 24750,
    estimatedResidueTonnes: 17325,
    availabilityLevel: 'high',
    registeredSuppliersCount: 3
  },
  {
    id: 'sat-br-01',
    villageName: 'Bikram Agricultural Plains',
    talukTehsil: 'Bikram',
    district: 'Patna',
    state: 'Bihar',
    lat: 25.4310,
    lng: 84.8510,
    cropKey: 'paddy',
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
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
    estimatedCropProductionTonnes: 7770,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 10101,
    estimatedResidueTonnes: 6566,
    availabilityLevel: 'high',
    registeredSuppliersCount: 0
  },
  {
    id: 'sat-cloud-01',
    villageName: 'Sakleshpur Clouded Ridge',
    talukTehsil: 'Sakleshpur',
    district: 'Hassan',
    state: 'Karnataka',
    lat: 12.8940,
    lng: 75.7820,
    cropKey: 'paddy',
    cropName: 'Paddy Straw (Non-Basmati & Basmati)',
    cultivatedAreaHectares: 120,
    harvestStatus: 'Standing Crop (Vegetative)',
    expectedHarvestPeriod: 'Dec 01 – Dec 25, 2026',
    lastSatellitePassDate: '2026-10-18',
    sentinelTileId: 'T43PGL',
    ndviMean: 0.31,
    ndreMean: 0.18,
    cloudCoverPercent: 78,
    predictionConfidencePercent: 42,
    dataMode: 'DEMO_ESTIMATE',
    notes: 'Heavy Western Ghats cloud cover prevented clean Sentinel-2 surface reflectance classification.',
    estimatedCropProductionTonnes: 504,
    rpr: 1.30,
    caf: 0.65,
    theoreticalResidueTonnes: 655,
    estimatedResidueTonnes: 426,
    availabilityLevel: 'insufficient',
    registeredSuppliersCount: 0
  }
];

@Injectable({
  providedIn: 'root'
})
export class SatelliteIntelligenceService {
  private http = inject(HttpClient);
  private marketplaceService = inject(MarketplaceService);
  private apiUrl = `${getApiBaseUrl()}/satellite`;

  // Raw data from API / fallback
  private rawRegions = signal<SatelliteRegion[]>(FALLBACK_REGIONS);
  cropParameters = signal<Record<string, CropParameterConfig>>(DEFAULT_CROP_PARAMETERS);
  
  // State signals
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  selectedRegion = signal<SatelliteRegion | null>(FALLBACK_REGIONS[0]);
  
  // Filter signals
  searchQuery = signal<string>('');
  selectedCrop = signal<string>('all');
  selectedDistrict = signal<string>('all');
  selectedAvailability = signal<string>('all');
  selectedHarvestStatus = signal<string>('all');
  minTonnes = signal<number>(0);

  // Computed regions with distance calculated relative to currently active marketplace hub
  regionsWithDistance = computed(() => {
    const hub = this.marketplaceService.currentHub();
    const list = this.rawRegions();

    return list.map(item => {
      const dist = this.calculateHaversineDistance(hub.lat, hub.lng, item.lat, item.lng);
      return {
        ...item,
        distanceKm: Math.round(dist)
      };
    });
  });

  // Filtered regions reactive pipeline
  filteredRegions = computed(() => {
    const list = this.regionsWithDistance();
    const q = this.searchQuery().toLowerCase().trim();
    const crop = this.selectedCrop();
    const district = this.selectedDistrict();
    const avail = this.selectedAvailability();
    const harvest = this.selectedHarvestStatus();
    const minT = this.minTonnes();

    return list.filter(reg => {
      if (crop !== 'all' && reg.cropKey.toLowerCase() !== crop.toLowerCase()) return false;
      if (district !== 'all' && reg.district.toLowerCase() !== district.toLowerCase()) return false;
      if (avail !== 'all' && reg.availabilityLevel !== avail) return false;
      if (harvest !== 'all' && reg.harvestStatus !== harvest) return false;
      if (minT > 0 && reg.estimatedResidueTonnes < minT) return false;

      if (q) {
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
  });

  // Unique lists for filter dropdowns
  availableDistricts = computed(() => {
    const set = new Set<string>();
    this.rawRegions().forEach(r => set.add(r.district));
    return Array.from(set).sort();
  });

  availableCrops = computed(() => {
    const map = new Map<string, string>();
    this.rawRegions().forEach(r => map.set(r.cropKey, r.cropName));
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  });

  // Aggregate metrics summary
  summaryMetrics = computed<SatelliteAggregateMetrics>(() => {
    const list = this.filteredRegions();
    const totalArea = list.reduce((acc, r) => acc + r.cultivatedAreaHectares, 0);
    const totalProd = list.reduce((acc, r) => acc + r.estimatedCropProductionTonnes, 0);
    const totalRes = list.reduce((acc, r) => acc + r.estimatedResidueTonnes, 0);
    const high = list.filter(r => r.availabilityLevel === 'high').length;
    const med = list.filter(r => r.availabilityLevel === 'medium').length;
    const low = list.filter(r => r.availabilityLevel === 'low').length;
    const insufficient = list.filter(r => r.availabilityLevel === 'insufficient').length;
    const avgConf = Math.round(list.reduce((acc, r) => acc + r.predictionConfidencePercent, 0) / (list.length || 1));

    return {
      monitoredRegionsCount: list.length,
      totalAreaHectares: totalArea,
      totalCropProductionTonnes: totalProd,
      totalResidueTonnes: totalRes,
      highAvailabilityCount: high,
      mediumAvailabilityCount: med,
      lowAvailabilityCount: low,
      insufficientCount: insufficient,
      averageConfidencePercent: avgConf,
      dataMode: 'DEMO_ESTIMATE',
      spectralSensors: ['Copernicus Sentinel-2 MSI Level-2A', 'Landsat-9 OLI-2'],
      lastPipelineRun: '2026-10-31T18:00:00Z'
    };
  });

  constructor() {
    this.fetchData();
  }

  /**
   * Fetches latest satellite regions and crop parameters from backend with fallback
   */
  async fetchData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/regions`)
      );

      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        this.rawRegions.set(response.data);
        if (this.selectedRegion() && !response.data.some((r: any) => r.id === this.selectedRegion()?.id)) {
          this.selectedRegion.set(response.data[0]);
        }
      }

      // Fetch crop parameters
      const cropsRes: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/crops`)
      ).catch(() => null);

      if (cropsRes && cropsRes.success && cropsRes.data) {
        this.cropParameters.set(cropsRes.data);
      }
    } catch (err: any) {
      console.warn('[SatelliteIntelligenceService] Backend unreachable or offline, using calibrated demo dataset.', err.message);
      // Retain FALLBACK_REGIONS
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Selects a region to inspect in detailed agronomic drawer
   */
  selectRegion(region: SatelliteRegion | null): void {
    this.selectedRegion.set(region);
  }

  /**
   * Resets all search and filter controls
   */
  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCrop.set('all');
    this.selectedDistrict.set('all');
    this.selectedAvailability.set('all');
    this.selectedHarvestStatus.set('all');
    this.minTonnes.set(0);
  }

  /**
   * Calculates custom residue using the standard formula
   */
  calculateEstimate(areaHa: number, cropKey: string, customYield?: number, customRpr?: number, customCaf?: number) {
    const cfg = this.cropParameters()[cropKey] || DEFAULT_CROP_PARAMETERS['paddy'];
    const yieldPerHa = customYield !== undefined ? customYield : cfg.averageYieldPerHa;
    const rpr = customRpr !== undefined ? customRpr : cfg.rpr;
    const caf = customCaf !== undefined ? customCaf : cfg.caf;

    const cropProduction = Math.round(areaHa * yieldPerHa);
    const theoreticalResidue = Math.round(cropProduction * rpr);
    const netResidue = Math.round(theoreticalResidue * caf);

    return {
      cropProduction,
      theoreticalResidue,
      netResidue,
      yieldPerHa,
      rpr,
      caf,
      cropName: cfg.cropName
    };
  }

  /**
   * Haversine formula to compute great-circle distance in kilometers
   */
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
