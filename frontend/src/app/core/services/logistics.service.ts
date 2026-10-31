import { Injectable } from '@angular/core';
import { CropKey } from '../models/marketplace.model';

export type VehicleTypeKey = 'pickup' | 'lcv' | 'mcv' | 'trailer';

export interface VehicleOption {
  key: VehicleTypeKey;
  name: string;
  capacityTons: number;
  ratePerKm: number;
  loadingFee: number;
  unloadingFee: number;
  icon: string;
}

export interface CropRateInfo {
  name: string;
  defaultRate: number;
  calorific: number;
  ashPercent: number;
}

export interface LogisticsCalculationResult {
  cropName: string;
  quantityTons: number;
  distanceKm: number;
  baseResidueValue: number;
  balingCost: number;
  farmerNetEarning: number;
  loadingCost: number;
  roadFreight: number;
  totalFreight: number;
  co2AvoidedTons: number;
  carbonCreditsInr: number;
  pm25AvoidedKg: number;
  treesEquivalent: number;
  // USP 2 Smart Extensions
  vehicleSelected?: VehicleOption;
  trucksRequired?: number;
  tollCharges?: number;
  dieselSurcharge?: number;
  moisturePercent?: number;
  moisturePenaltyPerTon?: number;
  totalMoistureDeduction?: number;
  landedCostTotal?: number;
  landedCostPerTon?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  readonly vehicleFleet: VehicleOption[] = [
    {
      key: 'pickup',
      name: 'Pick-Up SCV (Tata Yodha / Bolero Camper)',
      capacityTons: 3,
      ratePerKm: 18,
      loadingFee: 400,
      unloadingFee: 350,
      icon: 'truck'
    },
    {
      key: 'lcv',
      name: 'Eicher 1109 LCV (6-Tonne / 8-Tonne)',
      capacityTons: 8,
      ratePerKm: 24,
      loadingFee: 750,
      unloadingFee: 650,
      icon: 'truck'
    },
    {
      key: 'mcv',
      name: '16-Tonne 6-Wheeler (BharatBenz / Tata LPT)',
      capacityTons: 16,
      ratePerKm: 32,
      loadingFee: 1300,
      unloadingFee: 1100,
      icon: 'truck'
    },
    {
      key: 'trailer',
      name: '28-Tonne Multi-Axle Trailer (Commercial Straw Bales)',
      capacityTons: 28,
      ratePerKm: 42,
      loadingFee: 2100,
      unloadingFee: 1800,
      icon: 'truck'
    }
  ];

  private readonly cropRates: Record<CropKey, CropRateInfo> = {
    ragi: { name: 'Ragi Straw (ರಾಗಿ ಹುಲ್ಲು)', defaultRate: 2600, calorific: 3450, ashPercent: 7 },
    mulberry: { name: 'Mulberry Stalks (ರೇಷ್ಮೆ ಕಡ್ಡಿ)', defaultRate: 2300, calorific: 4200, ashPercent: 3.5 },
    coconut: { name: 'Coconut Shell & Coir (ತೆಂಗಿನ ಚಿಪ್ಪು)', defaultRate: 3100, calorific: 4500, ashPercent: 2.2 },
    sugarcane: { name: 'Sugarcane Bagasse Pellets (ಕಬ್ಬಿನ ಸಿಪ್ಪೆ)', defaultRate: 1950, calorific: 2350, ashPercent: 3.8 },
    paddy: { name: 'Sona Masoori Paddy Straw (ಭತ್ತದ ಹುಲ್ಲು)', defaultRate: 2150, calorific: 3280, ashPercent: 11.5 },
    maize: { name: 'Hybrid Maize Stover (ಮೆಕ್ಕೆಜೋಳ)', defaultRate: 1750, calorific: 3350, ashPercent: 6 },
    wheat: { name: 'Wheat Stubble', defaultRate: 1950, calorific: 3550, ashPercent: 8 },
    cotton: { name: 'Cotton Stalks', defaultRate: 2800, calorific: 4100, ashPercent: 5 },
    mustard: { name: 'Mustard Husk', defaultRate: 1850, calorific: 3700, ashPercent: 7 }
  };

  private readonly pricingRules = {
    basePerKmPerTon: 4.5,
    baseLoadingFeePerTon: 85,
    balingServiceCostPerTon: 450,
    co2FactorPerTon: 1.46,
    carbonCreditValuePerTonCO2: 750
  };

  getCropRates(): Record<CropKey, CropRateInfo> {
    return this.cropRates;
  }

  getVehicleFleet(): VehicleOption[] {
    return this.vehicleFleet;
  }

  /**
   * Backwards-compatible base calculate method
   */
  calculate(
    crop: CropKey,
    quantityTons: number,
    distanceKm: number,
    includeBaling: boolean,
    customRatePerTon?: number
  ): LogisticsCalculationResult {
    return this.calculateSmartLogistics({
      crop,
      quantityTons,
      distanceKm,
      includeBaling,
      customRatePerTon
    });
  }

  /**
   * USP 2: Smart Logistics Cost Calculator
   * Comprehensive calculations including vehicle fleet, diesel surcharge, tolls, and moisture penalty
   */
  calculateSmartLogistics(params: {
    crop: CropKey;
    quantityTons: number;
    distanceKm: number;
    includeBaling: boolean;
    customRatePerTon?: number;
    vehicleKey?: VehicleTypeKey;
    moisturePercent?: number;
    includeTolls?: boolean;
  }): LogisticsCalculationResult {
    const {
      crop,
      quantityTons,
      distanceKm,
      includeBaling,
      customRatePerTon,
      vehicleKey = 'mcv',
      moisturePercent = 12,
      includeTolls = true
    } = params;

    const cropInfo = this.cropRates[crop] || this.cropRates.paddy;
    const rate = customRatePerTon ?? cropInfo.defaultRate;
    const baseResidueValue = quantityTons * rate;
    const balingCost = includeBaling ? quantityTons * this.pricingRules.balingServiceCostPerTon : 0;
    const farmerNetEarning = baseResidueValue - balingCost;

    // Vehicle calculations
    const vehicle = this.vehicleFleet.find(v => v.key === vehicleKey) || this.vehicleFleet[2]; // Default 16T MCV
    const trucksRequired = Math.max(1, Math.ceil(quantityTons / vehicle.capacityTons));

    // Road freight based on vehicle rate per km
    const roundTripKm = distanceKm;
    const baseVehicleFreight = roundTripKm * vehicle.ratePerKm * trucksRequired;
    const loadingCost = (vehicle.loadingFee + vehicle.unloadingFee) * trucksRequired;

    // Toll charges: 1 toll plaza roughly every 60 km
    const tollPlazasCount = includeTolls ? Math.floor(distanceKm / 60) : 0;
    const tollCharges = tollPlazasCount * 185 * trucksRequired;

    // Fuel/Diesel surcharge (8% buffer for volatile regional fuel rates)
    const dieselSurcharge = Math.round(baseVehicleFreight * 0.08);

    const totalFreight = Math.round(baseVehicleFreight + loadingCost + tollCharges + dieselSurcharge);

    // Moisture penalty adjustment: Standard boiler contracts penalize moisture above 14% at ₹50 per tonne per 1% excess
    let moisturePenaltyPerTon = 0;
    if (moisturePercent > 14) {
      moisturePenaltyPerTon = Math.round((moisturePercent - 14) * 50);
    }
    const totalMoistureDeduction = moisturePenaltyPerTon * quantityTons;

    // Landed cost at factory gate
    const landedCostTotal = Math.round(baseResidueValue + totalFreight - totalMoistureDeduction);
    const landedCostPerTon = quantityTons > 0 ? Math.round(landedCostTotal / quantityTons) : rate;

    // Environmental metrics
    const co2AvoidedTons = parseFloat((quantityTons * this.pricingRules.co2FactorPerTon).toFixed(1));
    const carbonCreditsInr = Math.round(co2AvoidedTons * this.pricingRules.carbonCreditValuePerTonCO2);
    const pm25AvoidedKg = Math.round(quantityTons * 3.8);
    const treesEquivalent = Math.round(co2AvoidedTons * 45);

    return {
      cropName: cropInfo.name,
      quantityTons,
      distanceKm,
      baseResidueValue,
      balingCost,
      farmerNetEarning,
      loadingCost,
      roadFreight: Math.round(baseVehicleFreight),
      totalFreight,
      co2AvoidedTons,
      carbonCreditsInr,
      pm25AvoidedKg,
      treesEquivalent,
      vehicleSelected: vehicle,
      trucksRequired,
      tollCharges,
      dieselSurcharge,
      moisturePercent,
      moisturePenaltyPerTon,
      totalMoistureDeduction,
      landedCostTotal,
      landedCostPerTon
    };
  }
}
