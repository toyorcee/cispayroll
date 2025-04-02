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

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  retentionPeriod: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  status: "active" | "inactive";
}

interface DocumentTemplate {
  id: string;
  name: string;
  documentType: string;
  description: string;
  version: string;
  lastUpdated: string;
  status: "active" | "inactive";
}

interface DocumentSettings {
  requireDigitalSignatures: boolean;
  enableVersionControl: boolean;
  autoArchive: boolean;
  retentionPeriod: number;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// Demo data
const documentTypes: DocumentType[] = [
  {
    id: "1",
    name: "Employment Contract",
    description: "Standard employment contract document",
    required: true,
    retentionPeriod: 7,
    allowedFileTypes: ["pdf", "doc", "docx"],
    maxFileSize: 5,
    status: "active",
  },
  {
    id: "2",
    name: "Performance Review",
    description: "Employee performance review documents",
    required: true,
    retentionPeriod: 3,
    allowedFileTypes: ["pdf", "doc", "docx"],
    maxFileSize: 3,
    status: "active",
  },
  {
    id: "3",
    name: "Training Certificate",
    description: "Employee training and certification documents",
    required: false,
    retentionPeriod: 5,
    allowedFileTypes: ["pdf", "jpg", "png"],
    maxFileSize: 2,
    status: "active",
  },
];

const documentTemplates: DocumentTemplate[] = [
  {
    id: "1",
    name: "Standard Employment Contract",
    documentType: "1",
    description: "Template for new employee contracts",
    version: "1.0",
    lastUpdated: "2024-03-15",
    status: "active",
  },
  {
    id: "2",
    name: "Annual Performance Review",
    documentType: "2",
    description: "Template for annual performance reviews",
    version: "2.1",
    lastUpdated: "2024-03-10",
    status: "active",
  },
];

const DocumentSettings: React.FC = () => {
  const [documentTypesList, setDocumentTypesList] =
    useState<DocumentType[]>(documentTypes);
  const [templates, setTemplates] =
    useState<DocumentTemplate[]>(documentTemplates);
  const [settings, setSettings] = useState<DocumentSettings>({
    requireDigitalSignatures: true,
    enableVersionControl: true,
    autoArchive: false,
    retentionPeriod: 7,
    maxFileSize: 10,
    allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png"],
  });

  const handleSettingChange =
    (setting: keyof DocumentSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({
        ...settings,
        [setting]: event.target.checked,
      });
    };

  const handleNumberChange =
    (setting: keyof DocumentSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({
        ...settings,
        [setting]: Number(event.target.value),
      });
    };

  const handleSave = () => {
    // TODO: Implement API call to save settings
    console.log("Saving document settings:", {
      documentTypes: documentTypesList,
      templates,
      settings,
    });
  };

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        Document Settings
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
                        checked={settings.requireDigitalSignatures}
                        onChange={handleSettingChange(
                          "requireDigitalSignatures"
                        )}
                        color="success"
                      />
                    }
                    label="Require Digital Signatures"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableVersionControl}
                        onChange={handleSettingChange("enableVersionControl")}
                        color="success"
                      />
                    }
                    label="Enable Version Control"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoArchive}
                        onChange={handleSettingChange("autoArchive")}
                        color="success"
                      />
                    }
                    label="Auto-archive Documents"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Default Retention Period (years)"
                    value={settings.retentionPeriod}
                    onChange={handleNumberChange("retentionPeriod")}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum File Size (MB)"
                    value={settings.maxFileSize}
                    onChange={handleNumberChange("maxFileSize")}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Allowed File Types"
                    value={settings.allowedFileTypes.join(", ")}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        allowedFileTypes: e.target.value
                          .split(",")
                          .map((type) => type.trim()),
                      })
                    }
                    color="success"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Types */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6">Document Types</Typography>
                <Button variant="contained" color="success">
                  Add Document Type
                </Button>
              </Box>
              <Grid container spacing={2}>
                {documentTypesList.map((type) => (
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
                                Required: {type.required ? "Yes" : "No"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Retention Period: {type.retentionPeriod} years
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Max File Size: {type.maxFileSize}MB
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Status:{" "}
                                <Chip
                                  label={type.status}
                                  size="small"
                                  color={
                                    type.status === "active"
                                      ? "success"
                                      : "error"
                                  }
                                  sx={{
                                    bgcolor:
                                      type.status === "active"
                                        ? "#e8f5e9"
                                        : "#ffebee",
                                  }}
                                />
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                Allowed Types:{" "}
                                {type.allowedFileTypes.map((fileType) => (
                                  <Chip
                                    key={fileType}
                                    label={fileType}
                                    size="small"
                                    className="mr-1"
                                    sx={{ bgcolor: "#e8f5e9" }}
                                  />
                                ))}
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

        {/* Document Templates */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6">Document Templates</Typography>
                <Button variant="contained" color="success">
                  Add Template
                </Button>
              </Box>
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} key={template.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <div>
                            <Typography variant="subtitle1">
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {template.description}
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
                                Document Type:{" "}
                                {
                                  documentTypesList.find(
                                    (t) => t.id === template.documentType
                                  )?.name
                                }
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Version: {template.version}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Last Updated: {template.lastUpdated}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Status:{" "}
                                <Chip
                                  label={template.status}
                                  size="small"
                                  color={
                                    template.status === "active"
                                      ? "success"
                                      : "error"
                                  }
                                  sx={{
                                    bgcolor:
                                      template.status === "active"
                                        ? "#e8f5e9"
                                        : "#ffebee",
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

export default DocumentSettings;
