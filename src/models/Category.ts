import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string; // Agora armazena Hex (ex: "#ef4444")
  bg?: string; // Agora armazena Hex (ex: "#fee2e2")
  icon?: string;
  isDefault?: boolean;
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
    // PADRÕES EM HEX (Cinza Slate)
    color: { type: String, default: "#64748b" },
    bg: { type: String, default: "#f1f5f9" },
    icon: { type: String, default: "Tag" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
