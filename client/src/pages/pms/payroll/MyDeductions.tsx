import React from "react";
import { Card, CardContent, Typography, Grid, Box, Alert } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";

const MyDeductions: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Check if user has permission to view their own deductions
  if (!hasPermission(Permission.VIEW_OWN_DEDUCTIONS)) {
    return (
      <Alert severity="error">
        You don't have permission to view your deductions.
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        My Deductions
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Deduction Summary
              </Typography>
              <Box>
                <Typography variant="body1">
                  Your deductions will be displayed here.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default MyDeductions;
