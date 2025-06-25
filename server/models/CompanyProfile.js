import mongoose from "mongoose";
const { Schema } = mongoose;

const CompanyProfileSchema = new Schema(
  {
    basic: {
      name: { type: String, required: true },
      registrationNumber: { type: String },
      taxId: { type: String },
      industry: { type: String },
    },
    contact: {
      email: { type: String },
      phone: { type: String },
      website: { type: String },
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    legal: {
      incorporationDate: { type: String }, 
      businessType: { type: String },
      fiscalYear: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("CompanyProfile", CompanyProfileSchema);
