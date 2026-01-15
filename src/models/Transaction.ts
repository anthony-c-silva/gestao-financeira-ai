import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  paymentMethod: string;
  date: Date;
  status: "PENDING" | "PAID";
  // NOVOS CAMPOS PARA RECORRÊNCIA
  recurrenceId?: string; // Um ID único para agrupar todas as parcelas dessa compra
  installment?: number; // Qual é a parcela atual (ex: 1)
  totalInstallments?: number; // Total de parcelas (ex: 12)
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
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
    },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    category: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },

    // Configuração dos Novos Campos
    recurrenceId: { type: String, index: true },
    installment: { type: Number, default: 1 },
    totalInstallments: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
