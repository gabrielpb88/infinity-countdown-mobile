import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Pressable, StyleSheet, View, Text, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function StopwatchScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [baseElapsedSeconds, setBaseElapsedSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const isRunningRef = useRef(false);
  const baseElapsedSecondsRef = useRef(0);
  const startedAtMsRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isDark = useColorScheme() === 'dark';

  const theme = {
    bg: isDark ? '#0F172A' : '#F5F7FA',
    cardBg: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F8FAFC' : '#1E293B',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    accent: '#2DD4BF',
  };

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    baseElapsedSecondsRef.current = baseElapsedSeconds;
  }, [baseElapsedSeconds]);

  useEffect(() => {
    startedAtMsRef.current = startedAtMs;
  }, [startedAtMs]);

  const syncElapsed = useCallback(() => {
    const base = baseElapsedSecondsRef.current;
    const startedAt = startedAtMsRef.current;

    if (!isRunningRef.current || startedAt === null) {
      setElapsedSeconds(base);
      return;
    }

    const runningSeconds = Math.floor((Date.now() - startedAt) / 1000);
    setElapsedSeconds(base + runningSeconds);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      syncElapsed();
    }, 250);

    syncElapsed();

    return () => clearInterval(intervalId);
  }, [isRunning, syncElapsed]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState !== 'active' && nextState === 'active') {
        syncElapsed();
      }
    });

    return () => subscription.remove();
  }, [syncElapsed]);

  const { displayMinutes, displaySeconds } = useMemo(() => {
    return {
      displayMinutes: Math.floor(elapsedSeconds / 60),
      displaySeconds: elapsedSeconds % 60,
    };
  }, [elapsedSeconds]);

  const handleStartPause = () => {
    if (isRunning) {
      if (startedAtMsRef.current !== null) {
        const total =
          baseElapsedSecondsRef.current + Math.floor((Date.now() - startedAtMsRef.current) / 1000);
        setElapsedSeconds(total);
        setBaseElapsedSeconds(total);
        baseElapsedSecondsRef.current = total;
      }
      setStartedAtMs(null);
      startedAtMsRef.current = null;
      setIsRunning(false);
      isRunningRef.current = false;
      return;
    }

    const nextStart = Date.now();
    setStartedAtMs(nextStart);
    startedAtMsRef.current = nextStart;
    setIsRunning(true);
    isRunningRef.current = true;
  };

  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setStartedAtMs(null);
    startedAtMsRef.current = null;
    setElapsedSeconds(0);
    setBaseElapsedSeconds(0);
    baseElapsedSecondsRef.current = 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.titleBadge, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.accent }]}>CRONÔMETRO</Text>
      </View>

      <View style={[styles.timeContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.timeText, { color: theme.text }]}>
          {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
        </Text>
      </View>

      <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
        {isRunning ? 'Rodando' : 'Pausado'}
      </Text>

      <View style={styles.controls}>
        <Pressable
          style={[
            styles.actionButton,
            isRunning ? styles.pauseButton : styles.startButton,
          ]}
          onPress={handleStartPause}
        >
          <Text style={[styles.actionButtonText, isRunning ? styles.pauseButtonText : styles.startButtonText]}>
            {isRunning ? 'Pausar' : 'Iniciar'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            styles.resetButton,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
          onPress={handleReset}
        >
          <Text style={[styles.actionButtonText, { color: theme.text }]}>Zerar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 18,
  },
  titleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timeContainer: {
    minWidth: 300,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textAlign: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  controls: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    minWidth: 132,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
  },
  startButton: {
    backgroundColor: '#2DD4BF',
    borderColor: '#2DD4BF',
  },
  pauseButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  resetButton: {
    borderColor: '#334155',
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  startButtonText: {
    color: '#0F172A',
  },
  pauseButtonText: {
    color: '#FFFFFF',
  },
});
