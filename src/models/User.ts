import mongoose, { Schema, model, models } from "mongoose";

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
    
    // --- CAMPOS DE VERIFICAÇÃO (CRUCIAIS) ---
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String, // Armazena o código de 6 dígitos
      default: null,
    },
    // ----------------------------------------

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
    timestamps: true, // Cria automaticamente createdAt e updatedAt
  }
);

// Evita re-compilar o modelo se já existir (Hot Reload do Next.js)
const User = models.User || model("User", UserSchema);

export default User;