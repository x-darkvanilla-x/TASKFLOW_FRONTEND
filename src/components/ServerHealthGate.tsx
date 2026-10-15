'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Smile,
} from 'lucide-react';
import { healthService, HealthCheckResult } from '@/services/health.service';

interface ServerHealthContextType {
  isConnected: boolean;
  healthData: HealthCheckResult | null;
  checkAgain: () => Promise<void>;
}

const ServerHealthContext = createContext<ServerHealthContextType>({
  isConnected: false,
  healthData: null,
  checkAgain: async () => { },
});

export const useServerHealth = () => useContext(ServerHealthContext);

type BootStage = 'turning_on' | 'booting' | 'database' | 'just_a_sec' | 'connected';

interface StageConfig {
  title: string;
  subtitle: string;
  badge: string;
  progress: number;
}

const STAGES: Record<BootStage, StageConfig> = {
  turning_on: {
    title: 'Waking things up...',
    subtitle: 'Getting everything ready for you',
    badge: 'STARTING UP',
    progress: 25,
  },
  booting: {
    title: 'Loading your space...',
    subtitle: 'Setting up your personal workspace and features',
    badge: 'LOADING',
    progress: 55,
  },
  database: {
    title: 'Gathering your info...',
    subtitle: 'Connecting securely to save your progress',
    badge: 'SYNCING',
    progress: 78,
  },
  just_a_sec: {
    title: 'Almost ready...',
    subtitle: 'Putting the final touches on your experience',
    badge: 'FINALIZING',
    progress: 92,
  },
  connected: {
    title: 'All set! Opening your workspace...',
    subtitle: 'Everything looks great. Enjoy your session!',
    badge: 'READY',
    progress: 100,
  },
};

export default function ServerHealthGate({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [fadeState, setFadeState] = useState<'entering' | 'visible' | 'fading_out' | 'hidden'>('visible');
  const [currentStage, setCurrentStage] = useState<BootStage>('turning_on');
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const mountedRef = useRef(true);
  const isConnectedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if server was already verified in this browser session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyVerified = sessionStorage.getItem('server_health_checked');
      if (alreadyVerified === 'true') {
        isConnectedRef.current = true;
        setIsConnected(true);
        setIsGateOpen(true);
        setFadeState('hidden');
      }
    }
  }, []);

  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const completeConnectionSequence = useCallback(async (result: HealthCheckResult) => {
    setHealthResult(result);

    setCurrentStage('turning_on');
    await new Promise((res) => setTimeout(res, 400));
    if (!mountedRef.current) return;

    setCurrentStage('booting');
    await new Promise((res) => setTimeout(res, 500));
    if (!mountedRef.current) return;

    setCurrentStage('database');
    await new Promise((res) => setTimeout(res, 450));
    if (!mountedRef.current) return;

    setCurrentStage('just_a_sec');
    await new Promise((res) => setTimeout(res, 450));
    if (!mountedRef.current) return;

    setCurrentStage('connected');
    isConnectedRef.current = true;
    setIsConnected(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('server_health_checked', 'true');
    }

    await new Promise((res) => setTimeout(res, 600));
    if (!mountedRef.current) return;

    setFadeState('fading_out');
    await new Promise((res) => setTimeout(res, 450));
    if (!mountedRef.current) return;

    setFadeState('hidden');
    setIsGateOpen(true);
  }, []);

  const runHealthCheck = useCallback(async () => {
    if (isConnectedRef.current) return;

    setIsRetrying(true);
    const result = await healthService.checkHealth(4000);

    if (!mountedRef.current) return;
    setIsRetrying(false);

    if (result.ok) {
      await completeConnectionSequence(result);
    } else {
      setHealthResult(result);
      setRetryCount((prev) => prev + 1);

      setCurrentStage((prev) => {
        if (prev === 'turning_on') return 'booting';
        if (prev === 'booting') return 'database';
        if (prev === 'database') return 'just_a_sec';
        return 'booting';
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (mountedRef.current && !isConnectedRef.current) {
          runHealthCheck();
        }
      }, 2000);
    }
  }, [completeConnectionSequence]);

  useEffect(() => {
    mountedRef.current = true;
    runHealthCheck();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runHealthCheck]);

  const activeStageConfig = STAGES[currentStage];

  return (
    <ServerHealthContext.Provider
      value={{
        isConnected,
        healthData: healthResult,
        checkAgain: runHealthCheck,
      }}
    >
      {isGateOpen && children}

      {fadeState !== 'hidden' && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none bg-[#09090b] text-[#f4f4f5] transition-all duration-500 ease-out ${fadeState === 'fading_out'
              ? 'opacity-0 scale-[1.02] pointer-events-none'
              : 'opacity-100 scale-100'
            }`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 60%)`,
          }}
        >
          <div className="relative w-full max-w-md px-6 py-8 mx-auto flex flex-col items-center text-center">
            {/* Logo / Icon */}
            <div className="relative mb-6">
              <div
                className={`absolute -inset-3 rounded-2xl blur-lg transition-all duration-700 ${isConnected
                    ? 'bg-emerald-500/30'
                    : 'bg-indigo-500/20 animate-pulse'
                  }`}
              />

              <div className="relative w-16 h-16 rounded-2xl bg-[#121215] border border-white/10 shadow-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
            </div>

            {/* App Name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Follow Up
              </span>
            </div>

            {/* Status Badge */}
            <div className="mt-2 mb-5">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-300 ${isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  }`}
              >
                {isConnected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                )}
                <span className="tracking-wide uppercase text-[11px] font-semibold">
                  {activeStageConfig.badge}
                </span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight min-h-[36px] flex items-center justify-center transition-all duration-300">
              {activeStageConfig.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mt-1 mb-6 min-h-[38px] leading-relaxed">
              {activeStageConfig.subtitle}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 border border-white/10 rounded-full h-2 p-[2px] mb-6 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${isConnected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                  }`}
                style={{ width: `${activeStageConfig.progress}%` }}
              />
            </div>

            {/* Retry Button (if taking a bit longer) */}
            {!isConnected && timeElapsed > 4 && (
              <div className="w-full mt-2 flex flex-col items-center gap-3 animate-fadeIn">
                <p className="text-xs text-zinc-400">
                  This is taking a tiny bit longer than usual...
                </p>

                <button
                  type="button"
                  onClick={() => runHealthCheck()}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`}
                  />
                  <span>{isRetrying ? 'Checking again...' : 'Try Again'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ServerHealthContext.Provider>
  );
}