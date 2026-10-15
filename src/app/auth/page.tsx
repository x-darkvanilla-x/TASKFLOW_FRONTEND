'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Triangle, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';

export default function AuthLandingPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleGuestLogin = async () => {
    try {
      const result = await authService.guestLogin('Dexter');
      login(result.token, result.user);
      router.push('/dashboard');
    } catch {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8 select-none">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
          <Triangle className="w-4 h-4 fill-white text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight text-black">Follow Up</span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
        {/* Title & Subtitle */}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          Let's get back on track
        </h1>
        <p className="text-xs text-gray-500 mb-8">
          Enter your email below to login to your account.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Login with Email Button (Primary Black Button) */}
          <button
            type="button"
            id="login-email-btn"
            onClick={() => router.push('/auth/login')}
            className="w-full h-12 bg-[#111111] hover:bg-black text-white font-medium text-xs rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Mail className="w-4 h-4 text-white" />
            <span>Login with Email</span>
          </button>

          {/* Guest Login Option */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-200 rounded-full transition-colors flex items-center justify-center gap-3 shadow-sm cursor-pointer"
          >
            <span>Continue as Guest</span>
          </button>
        </div>
      </div>

      {/* Footer Legal Text */}
      <p className="mt-8 text-xs text-gray-400 max-w-xs text-center leading-relaxed">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline hover:text-gray-600 transition-colors">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline hover:text-gray-600 transition-colors">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
