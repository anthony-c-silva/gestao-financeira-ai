import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Por favor, insira um nome."],
    },
    email: {
      type: String,
      required: [true, "Por favor, insira um email."],
      unique: true,
      lowercase: true, // Garante que o email seja salvo em minúsculo
      trim: true,
    },
    document: {
      type: String,
      required: [true, "Por favor, insira um CPF ou CNPJ."],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Por favor, insira uma senha."],
      select: false, // Por segurança, não retorna a senha nas buscas normais
    },
    companyName: {
      type: String,
    },
    type: {
      type: String,
      enum: ["PF", "PJ"],
      default: "PF",
    },
    businessSize: {
      type: String,
    },
    phone: {
      type: String,
    },
    
    // --- NOVOS CAMPOS DE SEGURANÇA (EMAIL & RECUPERAÇÃO) ---
    
    emailVerified: {
      type: Boolean,
      default: false, // O usuário começa como "não verificado"
    },
    verificationToken: {
      type: String, // Código para validar o e-mail no cadastro
      select: false,
    },
    resetPasswordToken: {
      type: String, // Código de 6 dígitos para recuperar senha
      select: false,
    },
    resetPasswordExpires: {
      type: Date, // Hora que o código expira (segurança)
      select: false,
    },
  },
  {
    timestamps: true, // Cria createdAt e updatedAt automaticamente
  }
);

// Evita re-compilar o modelo se ele já existir (erro comum no Next.js)
export default mongoose.models.User || mongoose.model("User", UserSchema);