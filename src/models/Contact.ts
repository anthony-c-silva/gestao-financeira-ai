import mongoose, { Schema, Document } from "mongoose";

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "CLIENT" | "SUPPLIER"; // CLIENTE ou FORNECEDOR
  phone?: string;
  document?: string; // CPF ou CNPJ
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "O nome é obrigatório"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["CLIENT", "SUPPLIER"],
      required: true,
      index: true,
    },
    phone: { type: String, default: "" },
    document: { type: String, default: "" }, // CPF/CNPJ opcional
  },
  {
    timestamps: true,
  }
);

// Índice Composto: Garante que um usuário não tenha dois contatos com o mesmo nome e tipo
ContactSchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.models.Contact ||
  mongoose.model<IContact>("Contact", ContactSchema);
