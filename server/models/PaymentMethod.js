import mongoose from "mongoose";
const { Schema } = mongoose;

const PaymentMethodSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY", "OTHER"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    config: {
      // Configuration specific to each payment method type
      // For BANK_TRANSFER
      bankName: String,
      accountNumber: String,
      accountName: String,
      branch: String,
      // For MOBILE_MONEY
      provider: String,
      phoneNumber: String,
      // For CHECK
      checkNumber: String,
      // For CASH
      cashierName: String,
      // For OTHER
      customFields: {
        type: Map,
        of: Schema.Types.Mixed,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentMethodSchema.index({ name: 1 }, { unique: true });
PaymentMethodSchema.index({ type: 1 });
PaymentMethodSchema.index({ isActive: 1 });

export default mongoose.model("PaymentMethod", PaymentMethodSchema);
