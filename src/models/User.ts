import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Por favor, insira um nome."],
    },
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
    email: {
      type: String,
      required: [true, "Por favor, insira um e-mail."],
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    // Endereço Estruturado (não mais apenas uma string simples)
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
      select: false, // Por segurança, não retorna a senha nas buscas padrão
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
