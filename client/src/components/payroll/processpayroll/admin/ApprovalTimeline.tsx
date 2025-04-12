import React from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Paper,
} from "@mui/material";
import {
  CheckCircle,
  Pending,
  Error,
  HourglassEmpty,
  ArrowForward,
} from "@mui/icons-material";

interface ApprovalStep {
  level: string;
  status: "completed" | "pending" | "rejected";
  date?: string;
  comment?: string;
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  currentLevel: string;
}

const getStepIcon = (status: string, isCurrentLevel: boolean) => {
  if (isCurrentLevel) {
    return <HourglassEmpty color="warning" />;
  }

  switch (status) {
    case "completed":
      return <CheckCircle color="success" />;
    case "pending":
      return <Pending color="warning" />;
    case "rejected":
      return <Error color="error" />;
    default:
      return <ArrowForward color="disabled" />;
  }
};

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
  steps,
  currentLevel,
}) => {
  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: "background.paper" }}>
      <Stepper orientation="vertical">
        {steps.map((step, index) => (
          <Step
            key={index}
            active={step.level === currentLevel}
            completed={step.status === "completed"}
          >
            <StepLabel
              StepIconComponent={() =>
                getStepIcon(step.status, step.level === currentLevel)
              }
            >
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="subtitle1" color="text.primary">
                  {step.level}
                </Typography>
                {step.date && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(step.date).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </StepLabel>
            {step.comment && (
              <StepContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {step.comment}
                </Typography>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default ApprovalTimeline;
