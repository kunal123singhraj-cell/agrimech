import { Injectable } from '@angular/core';
import { Listing } from '../models/marketplace.model';

export interface QualityScorecard {
  aqiScore: number;
  grade: 'Boiler Premium Grade A+' | 'Factory Grade A' | 'Standard Grade B' | 'Basic Commercial Grade C';
  badgeColor: string;
  rank?: number;
  breakdown: {
    moistureScore: number;      // max 30
    calorificScore: number;     // max 25
    ashScore: number;           // max 15
    verificationScore: number;  // max 15
    balingScore: number;        // max 15
  };
  highlights: string[];
}

@Injectable({
  providedIn: 'root'
})
export class QualityRankingService {
  /**
   * Computes the transparent Agrimech Quality Index (AQI 0-100)
   * USP 3: Quality-Based Supplier Ranking
   */
  calculateAqi(listing: Partial<Listing>): QualityScorecard {
    // 1. Moisture Score (Max 30)
    const moisture = listing.moisturePercent ?? 12;
    let moistureScore = 10;
    if (moisture <= 10) moistureScore = 30;
    else if (moisture <= 13) moistureScore = 26;
    else if (moisture <= 16) moistureScore = 20;
    else if (moisture <= 19) moistureScore = 14;
    else moistureScore = 8;

    // 2. Calorific Energy Score (Max 25)
    let gcv = 3200;
    if (listing.calorificValue) {
      const match = listing.calorificValue.match(/\d+/g);
      if (match && match.length > 0) {
        gcv = parseInt(match.join(''), 10);
      }
    } else if (listing.cropKey === 'coconut' || listing.cropKey === 'mulberry') {
      gcv = 4200;
    } else if (listing.cropKey === 'wheat' || listing.cropKey === 'ragi') {
      gcv = 3500;
    }

    let calorificScore = 15;
    if (gcv >= 3900) calorificScore = 25;
    else if (gcv >= 3400) calorificScore = 22;
    else if (gcv >= 3000) calorificScore = 18;
    else calorificScore = 14;

    // 3. Ash Content Score (Max 15)
    const ash = listing.ashPercent ?? (listing.cropKey === 'coconut' ? 2.5 : listing.cropKey === 'paddy' ? 11 : 6);
    let ashScore = 7;
    if (ash <= 3.5) ashScore = 15;
    else if (ash <= 6.5) ashScore = 13;
    else if (ash <= 9.5) ashScore = 10;
    else ashScore = 6;

    // 4. Verification & APMC Weighbridge Score (Max 15)
    const verificationScore = listing.verified ? 15 : 6;

    // 5. Baling Format & Density Score (Max 15)
    const baling = listing.balingKey || 'square';
    let balingScore = 8;
    if (baling === 'square' || baling === 'pellets') balingScore = 15;
    else if (baling === 'round') balingScore = 11;
    else balingScore = 7;

    const totalAqi = Math.min(100, moistureScore + calorificScore + ashScore + verificationScore + balingScore);

    let grade: QualityScorecard['grade'] = 'Standard Grade B';
    let badgeColor = '#3B82F6';
    if (totalAqi >= 90) {
      grade = 'Boiler Premium Grade A+';
      badgeColor = '#10B981';
    } else if (totalAqi >= 80) {
      grade = 'Factory Grade A';
      badgeColor = '#D97706';
    } else if (totalAqi >= 70) {
      grade = 'Standard Grade B';
      badgeColor = '#2563EB';
    } else {
      grade = 'Basic Commercial Grade C';
      badgeColor = '#64748B';
    }

    const highlights: string[] = [];
    if (moisture <= 12) highlights.push(`Direct Boiler Ready (${moisture}% Moisture)`);
    if (gcv >= 3400) highlights.push(`High Thermal Energy (${gcv.toLocaleString()} kcal/kg)`);
    if (listing.verified) highlights.push('APMC Certified Weighbridge Slip');
    if (baling === 'square') highlights.push('High-Density Square Bales (Low Freight Vol)');

    return {
      aqiScore: totalAqi,
      grade,
      badgeColor,
      breakdown: {
        moistureScore,
        calorificScore,
        ashScore,
        verificationScore,
        balingScore
      },
      highlights
    };
  }

  /**
   * Sorts listings descending by their computed AQI quality score
   */
  rankListings(listings: Listing[]): (Listing & { scorecard: QualityScorecard })[] {
    const withScore = listings.map(l => ({
      ...l,
      scorecard: this.calculateAqi(l)
    }));

    // Sort descending by AQI score, breaking ties by verified status and lowest moisture
    withScore.sort((a, b) => {
      if (b.scorecard.aqiScore !== a.scorecard.aqiScore) {
        return b.scorecard.aqiScore - a.scorecard.aqiScore;
      }
      return (a.moisturePercent || 15) - (b.moisturePercent || 15);
    });

    return withScore.map((item, index) => {
      item.scorecard.rank = index + 1;
      return item;
    });
  }
}
