import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE"; // INCOME = Entrada, EXPENSE = Saída
  category: string;
  paymentMethod: string;
  date: Date;
  status: "PENDING" | "PAID"; // PENDING = Pendente, PAID = Pago
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    category: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
