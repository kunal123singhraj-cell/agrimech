import { Injectable, inject } from '@angular/core';
import { Listing, CropKey } from '../models/marketplace.model';
import { QualityRankingService, QualityScorecard } from './quality-ranking.service';

export interface FarmerBundleItem {
  listingId: string;
  farmerName: string;
  farmerPhone: string;
  district: string;
  state: string;
  cropType: string;
  allocatedTonnage: number;
  availableTonnage: number;
  pricePerTon: number;
  distanceKm: number;
  freightCostPerTon: number;
  landedCostPerTon: number;
  totalLotCost: number;
  scorecard: QualityScorecard;
  lat: number;
  lng: number;
  trucksNeeded: number;
}

export interface OptimizationResult {
  cropKey: CropKey | 'all';
  targetTonnage: number;
  allocatedTonnage: number;
  fulfillmentPercent: number;
  farmersCount: number;
  bundles: FarmerBundleItem[];
  weightedAvgPricePerTon: number;
  weightedAvgDistanceKm: number;
  totalExFarmCost: number;
  totalFreightCost: number;
  totalLandedCost: number;
  landedPricePerTon: number;
  estimatedSavingsInr: number;
  co2AvoidedTons: number;
  trucksTotal: number;
  optimizationPriority: 'optimal_landed_cost' | 'highest_aqi_quality' | 'nearest_proximity';
  avgAqiScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderOptimizerService {
  private qualityService = inject(QualityRankingService);

  /**
   * USP 1: Intelligent Multi-Farmer Order Optimizer
   * Bundles smallholder farmer residues to fulfill large buyer industrial quotas with minimal cost and distance.
   */
  optimize(
    listings: Listing[],
    targetTonnage: number,
    cropKey: CropKey | 'all',
    priority: 'optimal_landed_cost' | 'highest_aqi_quality' | 'nearest_proximity' = 'optimal_landed_cost',
    maxRadiusKm: number = 100
  ): OptimizationResult {
    // 1. Filter available (unreserved) listings matching criteria
    let candidates = listings.filter(l => {
      if (l.status === 'reserved' || l.status === 'sold') return false;
      if (cropKey !== 'all' && l.cropKey !== cropKey) return false;
      if (l.distanceKm > maxRadiusKm) return false;
      return (l.quantityTons || 0) > 0;
    });

    // If no candidate found within radius, fallback to Pan-India candidates
    if (candidates.length === 0) {
      candidates = listings.filter(l => {
        if (l.status === 'reserved' || l.status === 'sold') return false;
        if (cropKey !== 'all' && l.cropKey !== cropKey) return false;
        return (l.quantityTons || 0) > 0;
      });
    }

    // Attach quality scorecards
    const scoredCandidates = candidates.map(c => ({
      item: c,
      scorecard: this.qualityService.calculateAqi(c),
      freightPerTon: Math.round(85 + (c.distanceKm * 4.2)) // Loading + road freight
    }));

    // 2. Score and sort candidates based on selected priority
    scoredCandidates.sort((a, b) => {
      if (priority === 'highest_aqi_quality') {
        // Prioritize highest AQI, then lowest landed cost
        if (b.scorecard.aqiScore !== a.scorecard.aqiScore) {
          return b.scorecard.aqiScore - a.scorecard.aqiScore;
        }
        return (a.item.pricePerTon + a.freightPerTon) - (b.item.pricePerTon + b.freightPerTon);
      } else if (priority === 'nearest_proximity') {
        // Prioritize closest distance
        if (a.item.distanceKm !== b.item.distanceKm) {
          return a.item.distanceKm - b.item.distanceKm;
        }
        return a.item.pricePerTon - b.item.pricePerTon;
      } else {
        // 'optimal_landed_cost'
        const landedA = a.item.pricePerTon + a.freightPerTon;
        const landedB = b.item.pricePerTon + b.freightPerTon;
        if (landedA !== landedB) return landedA - landedB;
        return b.scorecard.aqiScore - a.scorecard.aqiScore;
      }
    });

    // 3. Multi-Farmer Knapsack Allocation
    let remainingNeeded = targetTonnage;
    let allocatedTotal = 0;
    const bundles: FarmerBundleItem[] = [];

    for (const cand of scoredCandidates) {
      if (remainingNeeded <= 0) break;

      const avail = cand.item.quantityTons || 50;
      const alloc = Math.min(avail, remainingNeeded);
      const exFarmPrice = cand.item.pricePerTon || 2200;
      const freightPerTon = cand.freightPerTon;
      const landedPerTon = exFarmPrice + freightPerTon;
      const totalLotCost = Math.round(alloc * landedPerTon);
      const trucksNeeded = Math.ceil(alloc / 16); // 16T standard 6-wheeler capacity

      bundles.push({
        listingId: cand.item.id,
        farmerName: cand.item.farmerName,
        farmerPhone: cand.item.farmerPhone,
        district: cand.item.district,
        state: cand.item.region || 'India',
        cropType: cand.item.cropType,
        allocatedTonnage: alloc,
        availableTonnage: avail,
        pricePerTon: exFarmPrice,
        distanceKm: cand.item.distanceKm,
        freightCostPerTon: freightPerTon,
        landedCostPerTon: landedPerTon,
        totalLotCost,
        scorecard: cand.scorecard,
        lat: cand.item.lat,
        lng: cand.item.lng,
        trucksNeeded
      });

      allocatedTotal += alloc;
      remainingNeeded -= alloc;
    }

    // 4. Compute Aggregate Metrics
    const fulfillmentPercent = targetTonnage > 0 ? Math.min(100, Math.round((allocatedTotal / targetTonnage) * 100)) : 100;
    
    let totalExFarm = 0;
    let totalFreight = 0;
    let weightedDistanceSum = 0;
    let weightedAqiSum = 0;
    let totalTrucks = 0;

    for (const b of bundles) {
      totalExFarm += b.allocatedTonnage * b.pricePerTon;
      totalFreight += b.allocatedTonnage * b.freightCostPerTon;
      weightedDistanceSum += b.distanceKm * b.allocatedTonnage;
      weightedAqiSum += b.scorecard.aqiScore * b.allocatedTonnage;
      totalTrucks += b.trucksNeeded;
    }

    const totalLanded = totalExFarm + totalFreight;
    const weightedAvgPrice = allocatedTotal > 0 ? Math.round(totalExFarm / allocatedTotal) : 0;
    const weightedAvgDist = allocatedTotal > 0 ? Math.round(weightedDistanceSum / allocatedTotal) : 0;
    const avgAqi = allocatedTotal > 0 ? Math.round(weightedAqiSum / allocatedTotal) : 0;
    const landedPricePerTon = allocatedTotal > 0 ? Math.round(totalLanded / allocatedTotal) : 0;

    // Estimated savings compared to unbundled / spot sourcing with 25% logistical overhead
    const unoptimizedLandedRate = landedPricePerTon * 1.18;
    const estimatedSavingsInr = Math.round((unoptimizedLandedRate - landedPricePerTon) * allocatedTotal);
    const co2AvoidedTons = parseFloat((allocatedTotal * 1.46).toFixed(1));

    return {
      cropKey,
      targetTonnage,
      allocatedTonnage: allocatedTotal,
      fulfillmentPercent,
      farmersCount: bundles.length,
      bundles,
      weightedAvgPricePerTon: weightedAvgPrice,
      weightedAvgDistanceKm: weightedAvgDist,
      totalExFarmCost: Math.round(totalExFarm),
      totalFreightCost: Math.round(totalFreight),
      totalLandedCost: Math.round(totalLanded),
      landedPricePerTon,
      estimatedSavingsInr,
      co2AvoidedTons,
      trucksTotal: totalTrucks,
      optimizationPriority: priority,
      avgAqiScore: avgAqi
    };
  }
}
