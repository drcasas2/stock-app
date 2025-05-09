import React from 'react';
import { Svg, Path, Text as SvgText, Line } from 'react-native-svg';
import { MetricRange, MetricThreshold } from '../../types/gauge';
import useGaugeLogic from '../hooks/useGaugeLogic';

// --- Internal Constants for Styling and Layout (FROM STEP 2) ---
const STROKE_WIDTH: number = 20;
const GAUGE_BACKGROUND_COLOR: string = '#E0E0E0';
const VALUE_ARC_COLOR: string = '#007AFF';
const MAJOR_TICK_COLOR: string = '#002366';
const MINOR_TICK_COLOR: string = '#607D8B';
const TICK_LABEL_COLOR: string = '#002366';
const VALUE_TEXT_COLOR: string = VALUE_ARC_COLOR;
const NUMBER_OF_MAJOR_TICKS: number = 5;

// --- Tick Styling Constants ---
const MAJOR_TICK_LENGTH = 10; 
const MINOR_TICK_LENGTH = 5;  
const TICK_LABEL_OFFSET = 5; // Additional offset for labels from the end of major ticks (towards center)
const TICK_LABEL_FONT_SIZE = 10;

// --- Central Value Styling --- 
const VALUE_FONT_SIZE = 32; // Adjust as needed for visual fit

// --- SVG/Angle Constants (RETAINED from previous work, but not directly used in this step's placeholder output) ---
const START_ANGLE_VISUAL_DEGREES = -225+90;
const END_ANGLE_VISUAL_DEGREES = 45+90;
const VISUAL_SWEEP_DEGREES = END_ANGLE_VISUAL_DEGREES - START_ANGLE_VISUAL_DEGREES;

// --- Prop Types (Exported) ---
export interface CircularGaugeProps {
  value: number;
  min: number;
  max: number;
  size: number;
  ranges?: MetricRange[];
  thresholds?: MetricThreshold[];
}

// --- Helper Functions (RETAINED from previous work, but not directly used in this step's placeholder output) ---
// mapPercentToAngle, polarToCartesian, describeArc would be here, but commented out or removed if not used by placeholder
// For simplicity of this step, they are omitted from direct use by the placeholder.

// --- Helper Functions (Reinstated) ---
const mapPercentToAngle = (percent: number): number => {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  return START_ANGLE_VISUAL_DEGREES + (clampedPercent / 100) * VISUAL_SWEEP_DEGREES;
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  let currentEndAngle = endAngle;
  if (currentEndAngle < startAngle) { currentEndAngle += 360; }
  if (Math.abs(currentEndAngle - startAngle) < 0.001) return ""; // Avoid issues with zero-length arcs
  const largeArcFlag = currentEndAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  return d;
};

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  min,
  max,
  size,
  ranges,
  thresholds,
}) => {
  const {
    isValid,
    valuePercent,
    fillStartPercent,
    fillEndPercent,
  } = useGaugeLogic(value, min, max, thresholds, ranges);

  const centerX = size / 2;
  const centerY = size / 2;
  const R = (size / 2) - (STROKE_WIDTH / 2);
  const backgroundArcPath = describeArc(centerX, centerY, R, START_ANGLE_VISUAL_DEGREES, END_ANGLE_VISUAL_DEGREES);
  let valueArcPath = "";
  if (isValid) {
    const valueStartAngle = mapPercentToAngle(fillStartPercent);
    const valueEndAngle = mapPercentToAngle(fillEndPercent);
    valueArcPath = describeArc(centerX, centerY, R, valueStartAngle, valueEndAngle);
  }
  
  const renderTicks = () => {
    const ticksSvgElements = [];
    if (max === min || !isValid) return null;
    const numSegments = NUMBER_OF_MAJOR_TICKS - 1;

    for (let i = 0; i < NUMBER_OF_MAJOR_TICKS; i++) {
      const tickValue = min + (i * (max - min) / numSegments);
      let tickPercent = ((tickValue - min) / (max - min)) * 100;
      tickPercent = Math.max(0, Math.min(100, tickPercent));
      const angle = mapPercentToAngle(tickPercent);
      
      // User-modified: Ticks start beyond the outer edge of the main arc stroke
      const tickRadiusStart = R + STROKE_WIDTH/2 + STROKE_WIDTH/4; 
      
      const majorTickStartPoint = polarToCartesian(centerX, centerY, tickRadiusStart, angle);
      const majorTickEndPoint = polarToCartesian(centerX, centerY, tickRadiusStart - MAJOR_TICK_LENGTH, angle); // Drawn inwards from the new start
      ticksSvgElements.push(
        <Line
          key={`major-tick-${i}`}
          x1={majorTickStartPoint.x}
          y1={majorTickStartPoint.y}
          x2={majorTickEndPoint.x}
          y2={majorTickEndPoint.y}
          stroke={MAJOR_TICK_COLOR}
          strokeWidth={2}
        />
      );

      const labelRadius = tickRadiusStart - MAJOR_TICK_LENGTH - TICK_LABEL_OFFSET;
      const labelPos = polarToCartesian(centerX, centerY, labelRadius, angle);
      const rangeDiff = max - min;
      const showOneDecimal = rangeDiff > 0 && (rangeDiff < 5 || !Number.isInteger(min) || !Number.isInteger(max) || !Number.isInteger(rangeDiff / numSegments));
      const labelText = showOneDecimal ? tickValue.toFixed(1) : tickValue.toFixed(0);
      ticksSvgElements.push(
        <SvgText
          key={`label-${i}`}
          x={labelPos.x}
          y={labelPos.y}
          fill={TICK_LABEL_COLOR}
          fontSize={TICK_LABEL_FONT_SIZE}
          textAnchor="middle"
          dy={TICK_LABEL_FONT_SIZE / 3}
        >
          {labelText}
        </SvgText>
      );

      if (i < numSegments) {
        const minorTickValuePercent = tickPercent + (100 / numSegments / 2);
        if (minorTickValuePercent < 100) { 
            const minorAngle = mapPercentToAngle(minorTickValuePercent);
            const minorTickStartPoint = polarToCartesian(centerX, centerY, tickRadiusStart, minorAngle);
            // Minor ticks also start from the same extended radius but are shorter
            const minorTickEndPoint = polarToCartesian(centerX, centerY, tickRadiusStart - MINOR_TICK_LENGTH, minorAngle);
            ticksSvgElements.push(
              <Line
                key={`minor-tick-${i}`}
                x1={minorTickStartPoint.x}
                y1={minorTickStartPoint.y}
                x2={minorTickEndPoint.x}
                y2={minorTickEndPoint.y}
                stroke={MINOR_TICK_COLOR}
                strokeWidth={1}
              />
            );
        }
      }
    }
    return ticksSvgElements;
  };

  // Re-introduce viewBoxExpansion for scaling effect
  const viewBoxExpansion = 15; 

  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox={`${-viewBoxExpansion} ${-viewBoxExpansion} ${size + viewBoxExpansion * 2} ${size + viewBoxExpansion * 2}`}
    >
      {/* Background Arc */}
      <Path
        d={backgroundArcPath}
        stroke={GAUGE_BACKGROUND_COLOR}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeLinecap="round" 
      />
      {isValid && valueArcPath !== "" && (
        <Path
          d={valueArcPath}
          stroke={VALUE_ARC_COLOR}
          strokeWidth={STROKE_WIDTH} 
          fill="none"
          strokeLinecap="round"
        />
      )}
      {renderTicks()} 

      {/* Central Value Text */}
      {isValid && (
        <SvgText
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fontSize={VALUE_FONT_SIZE}
          fontWeight="bold"
          fill={VALUE_TEXT_COLOR}
          dy={VALUE_FONT_SIZE / 3} // Adjust for vertical centering
        >
          {value.toFixed(2)} {/* Example formatting */} 
        </SvgText>
      )}
      
      {/* Display Invalid State centrally if needed */}
      {!isValid && (
         <SvgText x={centerX} y={centerY} fill="red" fontSize="12" textAnchor="middle">
           Invalid State
         </SvgText>
      )} 

      {/* Debug Text commented out */}
    </Svg>
  );
};

export default CircularGauge;

