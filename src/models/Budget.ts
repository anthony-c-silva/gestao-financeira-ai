import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  scope: "PAYMENT_METHOD" | "CATEGORY";
  key: string; // ex: "Cartão Crédito", "Cartão Débito" ou o nome de uma categoria
  monthlyLimitCents: number;
  alertThresholdPercent: number; // a partir de quantos % do limite avisar (padrão 80)
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ["PAYMENT_METHOD", "CATEGORY"],
      required: true,
    },
    key: { type: String, required: true, trim: true },
    monthlyLimitCents: { type: Number, required: true, min: 1 },
    alertThresholdPercent: { type: Number, default: 80, min: 1, max: 100 },
  },
  { timestamps: true },
);

// Um usuário não pode ter dois limites configurados para a mesma chave/escopo
BudgetSchema.index({ userId: 1, scope: 1, key: 1 }, { unique: true });

export default mongoose.models.Budget ||
  mongoose.model<IBudget>("Budget", BudgetSchema);
