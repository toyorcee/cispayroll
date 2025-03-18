export interface WeeklyStats {
  _id: {
    week: number;
  };
  count: number;
}

export interface DepartmentStats {
  _id: string;
  count: number;
  department?: string;
}

export interface OnboardingStats {
  weekly: {
    _id: {
      week: number;
    };
    count: number;
  }[];
  departments: {
    _id: string;
    department: string;
    count: number;
  }[];
}
