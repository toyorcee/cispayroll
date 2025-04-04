import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

const qualificationSchema = z.object({
  highestEducation: z.string().min(1, "Highest education is required"),
  institution: z.string().min(1, "Institution is required"),
  yearGraduated: z.string().min(1, "Year graduated is required"),
});

const nextOfKinSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: addressSchema,
});

const personalDetailsSchema = z.object({
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: addressSchema,
  maritalStatus: z.string().min(1, "Marital status is required"),
  nationality: z.string().min(1, "Nationality is required"),
  nextOfKin: nextOfKinSchema,
  qualifications: z
    .array(qualificationSchema)
    .min(1, "At least one qualification is required"),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
});

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account name is required"),
  bankCode: z.string().min(1, "Bank code is required"),
});

export const registrationSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    personalDetails: personalDetailsSchema,
    emergencyContact: emergencyContactSchema,
    bankDetails: bankDetailsSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
