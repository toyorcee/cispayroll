import React from "react";
import { Card, CardContent, Typography, Grid, Box, Alert } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";

const MyAllowances: React.FC = () => {
  const { hasPermission } = useAuth();

  // Check if user has permission to view their own allowances
  if (!hasPermission(Permission.VIEW_OWN_ALLOWANCES)) {
    return (
      <Alert severity="error">
        You don't have permission to view your allowances.
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        My Allowances
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Allowance Summary
              </Typography>
              <Box>
                <Typography variant="body1">
                  Your allowances will be displayed here.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default MyAllowances;
