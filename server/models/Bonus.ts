import mongoose, { Schema, Document } from "mongoose";

export enum BonusType {
  PERFORMANCE = "performance",
  THIRTEENTH_MONTH = "thirteenthMonth",
  SPECIAL = "special",
}

export interface IBonus extends Document {
  employee: mongoose.Types.ObjectId;
  type: BonusType;
  amount: number;
  description?: string;
  paymentDate: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BonusSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: Object.values(BonusType),
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBonus>("Bonus", BonusSchema);
