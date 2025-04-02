"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Box,
  Chip,
} from "@mui/material";
import { FaPencilAlt, FaTrash } from "react-icons/fa";

interface LeaveType {
  id: string;
  name: string;
  description: string;
  isPaid: boolean;
  accrualRate: number;
  maxBalance: number;
  requiresApproval: boolean;
}

interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  leaveTypes: string[];
  approvalWorkflow: string[];
  accrualRules: {
    frequency: string;
    rate: number;
  };
}

interface LeaveSettings {
  allowNegativeBalance: boolean;
  requireDocumentation: boolean;
  autoApprove: boolean;
  notificationDays: number;
  maxConsecutiveDays: number;
}

const LeaveSettings: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    {
      id: "1",
      name: "Annual Leave",
      description: "Paid time off for vacation",
      isPaid: true,
      accrualRate: 1.25,
      maxBalance: 20,
      requiresApproval: true,
    },
    {
      id: "2",
      name: "Sick Leave",
      description: "Leave for medical reasons",
      isPaid: true,
      accrualRate: 1,
      maxBalance: 15,
      requiresApproval: true,
    },
    {
      id: "3",
      name: "Maternity Leave",
      description: "Leave for new mothers",
      isPaid: true,
      accrualRate: 0,
      maxBalance: 90,
      requiresApproval: true,
    },
  ]);

  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([
    {
      id: "1",
      name: "Standard Policy",
      description: "Default leave policy for all employees",
      leaveTypes: ["1", "2"],
      approvalWorkflow: ["immediate_supervisor", "hr_manager"],
      accrualRules: {
        frequency: "monthly",
        rate: 1.25,
      },
    },
    {
      id: "2",
      name: "Executive Policy",
      description: "Extended leave policy for executives",
      leaveTypes: ["1", "2", "3"],
      approvalWorkflow: ["hr_manager", "ceo"],
      accrualRules: {
        frequency: "monthly",
        rate: 1.5,
      },
    },
  ]);

  const [settings, setSettings] = useState<LeaveSettings>({
    allowNegativeBalance: false,
    requireDocumentation: true,
    autoApprove: false,
    notificationDays: 7,
    maxConsecutiveDays: 30,
  });

  const handleSettingChange =
    (setting: keyof LeaveSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({
        ...settings,
        [setting]: event.target.checked,
      });
    };

  const handleNumberChange =
    (setting: keyof LeaveSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({
        ...settings,
        [setting]: Number(event.target.value),
      });
    };

  const handleSave = () => {
    // TODO: Implement API call to save settings
    console.log("Saving leave settings:", {
      leaveTypes,
      leavePolicies,
      settings,
    });
  };

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        Leave Settings
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                General Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowNegativeBalance}
                        onChange={handleSettingChange("allowNegativeBalance")}
                        color="success"
                      />
                    }
                    label="Allow Negative Leave Balance"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requireDocumentation}
                        onChange={handleSettingChange("requireDocumentation")}
                        color="success"
                      />
                    }
                    label="Require Documentation for Leave"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoApprove}
                        onChange={handleSettingChange("autoApprove")}
                        color="success"
                      />
                    }
                    label="Auto-approve Leave Requests"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Notification Days Before Leave"
                    value={settings.notificationDays}
                    onChange={handleNumberChange("notificationDays")}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Consecutive Leave Days"
                    value={settings.maxConsecutiveDays}
                    onChange={handleNumberChange("maxConsecutiveDays")}
                    color="success"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Types */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6">Leave Types</Typography>
                <Button variant="contained" color="success">
                  Add Leave Type
                </Button>
              </Box>
              <Grid container spacing={2}>
                {leaveTypes.map((type) => (
                  <Grid item xs={12} key={type.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <div>
                            <Typography variant="subtitle1">
                              {type.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {type.description}
                            </Typography>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="small" color="success">
                              <FaPencilAlt />
                            </Button>
                            <Button size="small" color="error">
                              <FaTrash />
                            </Button>
                          </div>
                        </Box>
                        <Box mt={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Accrual Rate: {type.accrualRate} days/month
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Max Balance: {type.maxBalance} days
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Paid:{" "}
                                <Chip
                                  label={type.isPaid ? "Yes" : "No"}
                                  size="small"
                                  color={type.isPaid ? "success" : "error"}
                                  sx={{
                                    bgcolor: type.isPaid
                                      ? "#2e7d32"
                                      : "#ffebee",
                                    color: type.isPaid ? "#ffffff" : "#d32f2f",
                                    fontWeight: 500,
                                  }}
                                />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Requires Approval:{" "}
                                <Chip
                                  label={type.requiresApproval ? "Yes" : "No"}
                                  size="small"
                                  color={
                                    type.requiresApproval ? "success" : "error"
                                  }
                                  sx={{
                                    bgcolor: type.requiresApproval
                                      ? "#2e7d32"
                                      : "#ffebee",
                                    color: type.requiresApproval
                                      ? "#ffffff"
                                      : "#d32f2f",
                                    fontWeight: 500,
                                  }}
                                />
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Policies */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6">Leave Policies</Typography>
                <Button variant="contained" color="success">
                  Add Policy
                </Button>
              </Box>
              <Grid container spacing={2}>
                {leavePolicies.map((policy) => (
                  <Grid item xs={12} key={policy.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <div>
                            <Typography variant="subtitle1">
                              {policy.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {policy.description}
                            </Typography>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="small" color="success">
                              <FaPencilAlt />
                            </Button>
                            <Button size="small" color="error">
                              <FaTrash />
                            </Button>
                          </div>
                        </Box>
                        <Box mt={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                Leave Types:{" "}
                                {policy.leaveTypes.map((typeId) => {
                                  const type = leaveTypes.find(
                                    (t) => t.id === typeId
                                  );
                                  return (
                                    <Chip
                                      key={typeId}
                                      label={type?.name || typeId}
                                      size="small"
                                      className="mr-1"
                                      sx={{ bgcolor: "#e8f5e9" }}
                                    />
                                  );
                                })}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                Approval Workflow:{" "}
                                {policy.approvalWorkflow.map((step, index) => (
                                  <React.Fragment key={step}>
                                    <Chip
                                      label={step.replace(/_/g, " ")}
                                      size="small"
                                      sx={{ bgcolor: "#e8f5e9" }}
                                    />
                                    {index <
                                      policy.approvalWorkflow.length - 1 &&
                                      " → "}
                                  </React.Fragment>
                                ))}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                Accrual:{" "}
                                <Chip
                                  label={`${policy.accrualRules.rate} days per ${policy.accrualRules.frequency}`}
                                  size="small"
                                  sx={{ bgcolor: "#e8f5e9" }}
                                />
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end">
            <Button variant="contained" color="success" onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </Grid>
      </Grid>
    </div>
  );
};

export default LeaveSettings;
