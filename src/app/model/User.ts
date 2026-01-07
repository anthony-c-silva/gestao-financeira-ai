import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "O nome é obrigatório"],
  },
  document: {
    type: String,
    required: [true, "CPF ou CNPJ é obrigatório"],
    unique: true, // Garante que não existam dois cadastros com mesmo documento
  },
  email: {
    type: String,
    required: [true, "O e-mail é obrigatório"],
    unique: true,
  },
  phone: String,
  address: String,
  password: {
    type: String,
    required: [true, "A senha é obrigatória"],
    select: false, // Por segurança, a senha não vem nas buscas por padrão
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Evita erro de recompilação do modelo ao usar hot-reload do Next.js
export default mongoose.models.User || mongoose.model("User", UserSchema);
