import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "INCOME" | "EXPENSE"; // Entrada ou Saída
  color?: string; // Ex: "text-red-500"
  bg?: string; // Ex: "bg-red-100"
  icon?: string; // Nome do ícone (lucide-react)
  isDefault?: boolean; // Se é uma categoria padrão do sistema (não deletável)
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: true,
    },
    color: { type: String, default: "text-slate-500" },
    bg: { type: String, default: "bg-slate-100" },
    icon: { type: String, default: "Tag" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Índice composto para evitar nomes duplicados para o mesmo usuário e tipo
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
