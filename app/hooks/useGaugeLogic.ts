import { useState, useEffect, useMemo } from 'react';
import { MetricRange, MetricThreshold } from '../../types/gauge'; // Import base types

// Define the possible scenarios
type GaugeScenario = 
  | 'INVALID' 
  | 'CROSS_ZERO' 
  | 'POSITIVE_ONLY'               // Scenario 3 (min < max, min >= 0)
  | 'NEGATIVE_ONLY_MIN_ABS_LTE_MAX' // Scenario 3 (min < max, max <= 0)
  | 'NEGATIVE_ONLY_MIN_ABS_GT_MAX'  // Scenario 4 (min < max, max <= 0)
  | 'POSITIVE_ONLY_MIN_GT_MAX'      // Scenario 4 (min > max, max >= 0)
  | 'INVERTED';                     // Scenario 2 (min > 0, max < 0)

// --- Define Return Types --- 

// Type for processed thresholds
interface ProcessedThreshold {
  id: number | string; // Use thresholdId
  percent: number;
}

// Type for processed ranges
interface ProcessedRange {
  id: number | string; // Use rangeId
  startPercent: number;
  endPercent: number;
}

// Define the structure of the returned object
interface GaugeLogicResult {
  isValid: boolean;
  scenario: GaugeScenario;
  valuePercent: number;      
  anchorPercent: number;     
  fillStartPercent: number;  
  fillEndPercent: number;    
  thresholdsPercent: ProcessedThreshold[]; // Add processed thresholds
  rangesPercent: ProcessedRange[];       // Add processed ranges
}

/**
 * Custom hook to calculate gauge rendering logic based on value, min, and max.
 * Handles different scenarios including ranges crossing zero and inverted ranges.
 */
const useGaugeLogic = (
  value: number,
  min: number,
  max: number,
  thresholds?: MetricThreshold[], // Add thresholds prop
  ranges?: MetricRange[]          // Add ranges prop
): GaugeLogicResult => {

  // --- 1. Determine Scenario and Validate --- 
  const scenario: GaugeScenario = useMemo(() => {
    // Scenario 2: Inverted Range Check (min > 0 and max < 0)
    if (min > 0 && max < 0) {
      return 'INVERTED';
    }

    // Scenario 4 Positive Case: Reversed Positive Range (min > max >= 0)
    if (min > max && max >= 0) { 
        // Check for abs value isn't strictly needed as min > max > 0 implies |min| > |max|
        return 'POSITIVE_ONLY_MIN_GT_MAX';
    }

    // Standard Invalid Check (if min >= max AND not handled above)
    if (min >= max) {
      return 'INVALID';
    }

    // --- Standard Valid Cases (min < max guaranteed after this point) ---

    // Scenario 1: Crosses Zero (min < 0 and max > 0)
    if (min < 0 && max > 0) {
      return 'CROSS_ZERO';
    }

    // Scenario 3 Part 1: Positive Only (min >= 0)
    if (min >= 0 /* && max > min implied */) {
        return 'POSITIVE_ONLY';
    }

    // Scenarios 3 & 4 Negative Only: (max <= 0)
    if (max <= 0 /* && min < max implied */) {
      if (Math.abs(min) < Math.abs(max)) {
        // Scenario 3 Part 2
        return 'NEGATIVE_ONLY_MIN_ABS_LTE_MAX'; 
      } else {
        // Scenario 4 Negative Case
        return 'NEGATIVE_ONLY_MIN_ABS_GT_MAX'; 
      }
    }
    
    // Fallback
    console.warn('useGaugeLogic: Unhandled min/max combination', { min, max });
    return 'INVALID';
  }, [min, max]);

  const isValid = scenario !== 'INVALID';

  // --- 2. Calculate Anchor Value --- 
  const anchorValue: number = useMemo(() => {
    if (!isValid) return 0;
    
    switch (scenario) {
      case 'CROSS_ZERO':
        // Check if the range is symmetrical around zero
        if (Math.abs(min) === Math.abs(max)) {
          return 0; // Symmetrical: Anchor is 0
        } else {
          return (min + max) / 2; // Asymmetrical: Anchor is the midpoint
        }
      
      case 'INVERTED':
        // Anchor is the simple midpoint for the inverted scenario
        return (min + max) / 2; 
        
      case 'POSITIVE_ONLY':
      case 'NEGATIVE_ONLY_MIN_ABS_LTE_MAX':
        // Scenario 3 types: Anchor is min 
        return min; 
        
      case 'POSITIVE_ONLY_MIN_GT_MAX': // Scenario 4 Positive
      case 'NEGATIVE_ONLY_MIN_ABS_GT_MAX': // Scenario 4 Negative
        // Scenario 4 types: Anchor is max 
        return max; 
        
      // case 'INVALID': // Removed
      default:
        // This should not be reached if isValid is true
        console.warn('useGaugeLogic: Reached default case in anchorValue calculation despite being valid');
        return 0; 
    }
  }, [isValid, scenario, min, max]);

  // --- 3. Define Percentage Calculation --- 
  const calculatePercentage = (inputValue: number, rangeMin: number, rangeMax: number): number => {
    if (rangeMax === rangeMin) return 0; // Avoid division by zero
    const percent = ((inputValue - rangeMin) / (rangeMax - rangeMin)) * 100;
    return Math.max(0, Math.min(100, percent)); // Clamp between 0 and 100
  };

  // --- 4. Calculate Percentages (Value & Anchor) --- 
  const { valuePercent, anchorPercent } = useMemo(() => {
    if (!isValid) return { valuePercent: 0, anchorPercent: 0 };

    // Use min/max directly for range - this mapping works for all valid scenarios
    // Visual 0% = Numerical min, Visual 100% = Numerical max
    // (Handles standard, inverted, reversed positive, negative correctly)
    const rangeMin = min;
    const rangeMax = max;

    const vp = calculatePercentage(value, rangeMin, rangeMax);
    const ap = calculatePercentage(anchorValue, rangeMin, rangeMax);
    
    return { valuePercent: vp, anchorPercent: ap };

  }, [isValid, scenario, value, min, max, anchorValue]);

  // --- 5. Calculate Final Fill Start/End Percentages --- 
  const { fillStartPercent, fillEndPercent } = useMemo(() => {
    if (!isValid) return { fillStartPercent: 0, fillEndPercent: 0 };

    let start = 0;
    let end = 0;

    switch (scenario) {
      case 'CROSS_ZERO':
      case 'INVERTED':
        // Scenarios 1 & 2: Fill is between anchor and value
        if (valuePercent >= anchorPercent) {
          start = anchorPercent;
          end = valuePercent;
        } else {
          start = valuePercent;
          end = anchorPercent;
        }
        break;

      case 'POSITIVE_ONLY':
      case 'NEGATIVE_ONLY_MIN_ABS_LTE_MAX':
        // Scenario 3 types: Anchor is min (0%), fill goes from anchor to value
        start = anchorPercent; // which is 0% for these cases
        end = valuePercent;
        break;

      case 'POSITIVE_ONLY_MIN_GT_MAX':     // Scenario 4 Positive
      case 'NEGATIVE_ONLY_MIN_ABS_GT_MAX': // Scenario 4 Negative
        // Scenario 4 types: Anchor is max (100%), fill goes from value to anchor
        start = valuePercent;
        end = anchorPercent; // which is 100% for these cases
        break;
        
      // case 'INVALID': // Already handled
      default:
         console.warn('useGaugeLogic: Reached default case in fill percentage calculation');
         start = 0;
         end = 0;
         break;
    }
    
    // Ensure start <= end, although the logic above should generally handle this
    return {
       fillStartPercent: Math.min(start, end),
       fillEndPercent: Math.max(start, end)
    };

  }, [isValid, scenario, valuePercent, anchorPercent]);

  // --- 6. Calculate Threshold Percentages --- 
  const thresholdsPercent: ProcessedThreshold[] = useMemo(() => {
    if (!isValid || !thresholds) return [];

    // Use universal range mapping
    const rangeMin = min;
    const rangeMax = max;

    return thresholds
      .map(t => ({
        id: t.thresholdId,
        percent: calculatePercentage(t.value, rangeMin, rangeMax)
      }))
      .filter(t => t.percent >= 0 && t.percent <= 100); // Only include valid percentages

  }, [isValid, scenario, thresholds, min, max]); // Add dependencies

  // --- 7. Calculate Range Percentages --- 
  const rangesPercent: ProcessedRange[] = useMemo(() => {
    if (!isValid || !ranges) return [];

    // Use universal range mapping
    const rangeMin = min;
    const rangeMax = max;

    return ranges.map(r => ({
      id: r.rangeId,
      startPercent: calculatePercentage(r.start, rangeMin, rangeMax),
      endPercent: calculatePercentage(r.end, rangeMin, rangeMax),
    }));
    // Note: We might need to swap start/end percent for ranges later if needed for rendering 
    //       based on direction, but for now, just calculate raw positions.

  }, [isValid, scenario, ranges, min, max]); // Add dependencies

  // --- Return Results --- 
  return {
    isValid,
    scenario,
    valuePercent,
    anchorPercent,
    fillStartPercent,
    fillEndPercent,
    thresholdsPercent, // Add to return object
    rangesPercent,     // Add to return object
  };
};

export default useGaugeLogic; 