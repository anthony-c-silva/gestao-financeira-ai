import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Por favor, insira um nome."],
    },
    // --- ESTE CAMPO É O SEGREDO ---
    companyName: {
      type: String,
      required: false, // É opcional no banco para não quebrar contas antigas
    },
    // -----------------------------
    document: {
      type: String,
      required: [true, "Por favor, insira CPF ou CNPJ."],
      unique: true,
    },
    type: {
      type: String,
      enum: ["PF", "PJ"],
      default: "PF",
    },
    businessSize: {
      type: String,
      enum: ["MEI", "ME", "EPP", "OTHER"],
      default: null,
    },
    email: {
      type: String,
      required: [true, "Por favor, insira um e-mail."],
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      cep: String,
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
    },
    password: {
      type: String,
      required: [true, "Por favor, defina uma senha."],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);