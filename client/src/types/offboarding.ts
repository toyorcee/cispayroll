export type OffboardingType =
  | "voluntary_resignation"
  | "involuntary_termination"
  | "retirement"
  | "contract_end";

export interface OffboardingTask {
  _id: string;
  name: string;
  description: string;
  category: string;
  deadline: Date;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface OffboardingData {
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  type: OffboardingType;
  reason: string;
  initiatedAt?: Date;
  initiatedBy?: string;
  targetExitDate: Date;
  actualExitDate?: Date;
  tasks: OffboardingTask[];
  progress: number;
  exitInterview?: {
    completed: boolean;
    conductedBy?: string;
    date?: Date;
    notes?: string;
  };
  rehireEligible?: {
    status: boolean;
    notes?: string;
  };
}
