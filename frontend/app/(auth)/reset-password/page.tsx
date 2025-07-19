'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!email) {
      setError('Por favor, informe seu email.');
      setIsLoading(false);
      return;
    }

    const { error: resetError } = await requestPasswordReset(email);
    setIsLoading(false);

    if (resetError) {
      setError(resetError.message || 'Ocorreu um erro ao tentar enviar o link de redefinição.');
    } else {
      setMessage('Se uma conta com este email existir, um link para redefinição de senha foi enviado.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-auto text-2xl font-bold text-indigo-600">
            Dr.Brain
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Redefinir Senha
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="voce@exemplo.com"
            />
          </div>

          {message && (
            <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{message}</p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" legacyBehavior>
            <a className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Voltar para o Login
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
} 