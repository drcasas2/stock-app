export interface MetricRange {
  rangeId: number;
  start: number;
  end: number;
}

export interface MetricThreshold {
  thresholdId: number;
  value: number;
}

export interface GaugeConfig {
  id: string;
  type: 'linear' | 'circular';
  ticker: string;
  metricName: string;
  metricValue: number;
  metricMin: number;
  metricMax: number;
  metricRanges: MetricRange[];
  metricThresholds: MetricThreshold[];
}
