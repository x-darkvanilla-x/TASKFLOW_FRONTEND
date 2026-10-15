'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Triangle, User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.register(name, email, password);
      login(result.token, result.user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. User with this email may already exist.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await authService.guestLogin('Dexter');
      login(result.token, result.user);
      router.push('/dashboard');
    } catch {
      setError('Could not connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8 select-none">
        <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white shadow-xs">
          <Triangle className="w-4.5 h-4.5 fill-white text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900">Follow Up</span>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white border border-gray-200/90 rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs flex flex-col items-center">
        {/* Navigation Tabs */}
        <div className="w-full bg-gray-100/80 p-1 rounded-2xl flex mb-6 text-xs font-semibold select-none">
          <Link
            href="/auth/login"
            className="flex-1 py-2 text-gray-500 hover:text-gray-900 rounded-xl text-center transition-all cursor-pointer"
          >
            Login
          </Link>
          <button
            type="button"
            className="flex-1 py-2 bg-white text-gray-900 rounded-xl shadow-xs text-center transition-all cursor-pointer"
          >
            Sign Up
          </button>
        </div>

        {/* Header Title */}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1 text-center">
          Create your account
        </h1>
        <p className="text-xs text-gray-500 mb-6 text-center">
          Join Follow Up to save and manage all your tasks and projects.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="w-full p-3 mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl text-center font-medium">
            ⚠ {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dexter"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl outline-none text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dexter@gmail.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl outline-none text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 characters)"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl outline-none text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-70 cursor-pointer mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="w-full border-t border-gray-100 my-5 pt-4 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-gray-900 font-semibold transition-colors cursor-pointer"
          >
            Or Continue as Guest
          </button>
        </div>
      </div>

      {/* Footer text */}
      <p className="mt-6 text-[11px] text-gray-400 max-w-xs text-center leading-relaxed">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-gray-900 font-semibold underline">
          Log in here
        </Link>
      </p>
    </div>
  );
}
