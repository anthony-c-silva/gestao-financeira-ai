import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/app/model/User';

export async function POST(req: Request) {
  try {
    const { document, password } = await req.json();

    await connectDB();

    // Busca usuário pelo documento e inclui a senha na busca (que estava oculta)
    const user = await User.findOne({ document }).select('+password');

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Validação simples de senha (no futuro usaremos bcrypt)
    if (user.password !== password) {
      return NextResponse.json({ message: 'Senha incorreta.' }, { status: 401 });
    }

    // Retorna sucesso (sem a senha)
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({ 
      message: 'Login realizado com sucesso!',
      user: userWithoutPassword 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Erro interno.' }, { status: 500 });
  }
}