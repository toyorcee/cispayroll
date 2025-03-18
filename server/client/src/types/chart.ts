export interface WeeklyStats {
  _id: {
    week: number;
  };
  count: number;
}

export interface DepartmentStats {
  _id: string;
  department: string;
  count: number;
  active: number;
  pending: number;
}

export interface OnboardingStats {
  weekly: WeeklyStats[];
  departments: DepartmentStats[];
}

export interface LineDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}

export interface BarDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

export interface LineChartData {
  labels: string[];
  datasets: LineDataset[];
}

export interface BarChartData {
  labels: string[];
  datasets: BarDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
  tension?: number;
  fill?: boolean;
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartState {
  onboarding: LineChartData;
  departments: BarChartData;
}
