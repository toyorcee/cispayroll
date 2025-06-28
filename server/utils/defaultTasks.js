import {
  DefaultOffboardingTasks,
  OffboardingTaskCategory,
} from "../models/User.js";

// Default onboarding tasks with descriptions and categories (no deadlines for now)
export const DEFAULT_ONBOARDING_TASKS = [
  {
    name: "Welcome Meeting",
    description: "Initial orientation and welcome meeting with HR and team",
    category: "orientation",
    completed: false,
  },
  {
    name: "Department Introduction",
    description:
      "Meet team members and understand department workflow and processes",
    category: "orientation",
    completed: false,
  },
  {
    name: "System Access Setup",
    description: "Set up system access, email accounts, and required software",
    category: "setup",
    completed: false,
  },
  {
    name: "Policy Documentation Review",
    description:
      "Review and acknowledge company policies, handbook, and procedures",
    category: "compliance",
    completed: false,
  },
  {
    name: "Initial Training Session",
    description:
      "Complete initial training modules and job-specific orientation",
    category: "training",
    completed: false,
  },
];

// Default offboarding tasks with descriptions and categories (no deadlines for now)
export const DEFAULT_OFFBOARDING_TASKS = [
  {
    name: DefaultOffboardingTasks.EXIT_INTERVIEW,
    description:
      "Conduct exit interview to gather feedback and complete formalities",
    category: OffboardingTaskCategory.EXIT_INTERVIEW,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.EQUIPMENT_RETURN,
    description: "Return all company equipment, devices, and access cards",
    category: OffboardingTaskCategory.EQUIPMENT_RETURN,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.ACCESS_REVOCATION,
    description:
      "Revoke all system access, email accounts, and building access",
    category: OffboardingTaskCategory.ACCESS_REVOCATION,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.DOCUMENTATION_HANDOVER,
    description: "Handover all documentation, projects, and knowledge to team",
    category: OffboardingTaskCategory.DOCUMENTATION,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.KNOWLEDGE_TRANSFER,
    description: "Complete knowledge transfer sessions with team members",
    category: OffboardingTaskCategory.KNOWLEDGE_TRANSFER,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.FINAL_PAYROLL,
    description: "Process final payroll, benefits termination, and settlement",
    category: OffboardingTaskCategory.FINANCIAL,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.BENEFITS_TERMINATION,
    description: "Terminate all benefits, insurance, and company subscriptions",
    category: OffboardingTaskCategory.FINANCIAL,
    completed: false,
  },
  {
    name: DefaultOffboardingTasks.CLEARANCE_FORM,
    description: "Complete clearance form and obtain necessary approvals",
    category: OffboardingTaskCategory.DOCUMENTATION,
    completed: false,
  },
];

// Function to get onboarding tasks (no deadlines for now)
export const getOnboardingTasks = () => {
  return DEFAULT_ONBOARDING_TASKS.map((task) => ({ ...task }));
};

// Function to get offboarding tasks (no deadlines for now)
export const getOffboardingTasks = () => {
  return DEFAULT_OFFBOARDING_TASKS.map((task) => ({ ...task }));
};
