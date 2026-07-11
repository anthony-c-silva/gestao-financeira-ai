/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Em algumas redes (VPNs corporativas/acadêmicas, certos roteadores) o resolver
// de DNS padrão do Node RECUSA (REFUSED) consultas SRV (usadas por
// "mongodb+srv://"), mesmo quando o resolver do sistema operacional funciona
// normalmente. Como REFUSED é uma resposta definitiva (não um timeout), o
// Node não tenta o próximo servidor da lista — por isso substituímos a lista
// inteira por resolvedores públicos confiáveis em vez de só adicionar no fim.
if (MONGODB_URI.startsWith("mongodb+srv://")) {
  try {
    dns.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1"]);
  } catch {
    // Se não for possível ajustar, segue com o resolver padrão.
  }
}

interface MongooseConn {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseConn = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

function connectWithRetry(attempt = 1): Promise<typeof mongoose> {
  const opts = { bufferCommands: false };

  return mongoose.connect(MONGODB_URI!, opts).catch((err) => {
    // Em algumas redes, a resolução SRV do Node falha de forma intermitente
    // (ver ajuste de dns.setServers acima) mesmo quando o resolver do SO
    // funciona. Tenta novamente algumas vezes antes de desistir.
    const isTransientDnsError =
      err?.code === "ECONNREFUSED" || /querySrv/.test(String(err?.message));

    if (isTransientDnsError && attempt < 4) {
      const delayMs = attempt * 500;
      return new Promise((resolve) => setTimeout(resolve, delayMs)).then(() =>
        connectWithRetry(attempt + 1),
      );
    }

    throw err;
  });
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
