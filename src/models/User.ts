import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "O nome é obrigatório."],
    },
    companyName: {
      type: String, // Opcional (apenas PJ)
    },
    document: {
      type: String,
      required: [true, "CPF ou CNPJ é obrigatório."],
      unique: true,
    },
    type: {
      type: String,
      enum: ["PF", "PJ"],
      default: "PF",
    },
    businessSize: {
      type: String, // MEI, ME, EPP... (apenas PJ)
    },
    email: {
      type: String,
      required: [true, "O e-mail é obrigatório."],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "O telefone é obrigatório."],
    },
    password: {
      type: String,
      required: [true, "A senha é obrigatória."],
      select: false, // Por segurança, não retorna a senha nas buscas padrão
    },

    // --- CAMPOS DE VERIFICAÇÃO (CADASTRO) ---
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },

    // --- CAMPOS DE RECUPERAÇÃO DE SENHA (NOVOS) ---
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, // Oculta por padrão
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false, // Oculta por padrão
    },
    // -----------------------------------------------

    address: {
      cep: String,
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const User = (mongoose.models.User as any) || mongoose.model("User", UserSchema);

export default User;
