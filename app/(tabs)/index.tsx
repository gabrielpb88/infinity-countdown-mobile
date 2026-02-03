import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import {
  MoonIcon,
  SunIcon,
  PlusIcon,
  Trash2Icon,
  ChevronUpIcon,
  ChevronDownIcon
} from '../../components/Icons';

const { width, height } = Dimensions.get('window');


function App() {
  // Initial timers with default values
  const [timers, setTimers] = useState([
    { id: 1, label: 'Timer 1', minutes: 0, seconds: 0 }
  ]);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTimerIndex, setActiveTimerIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [nextTimerId, setNextTimerId] = useState(3);
  const intervalRef = useRef(null);

  // Animation values
  const progressHeight = useRef(new Animated.Value(0)).current;

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/bell.mp3') // Adjust the path to your sound file
    );
    await sound.playAsync();
  };

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft !== null) {
      if (timeLeft > 0) {
        intervalRef.current = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      } else {
        // Timer reached zero - move to next timer
        playSound(); // Play sound when timer completes

        const nextIndex = (activeTimerIndex + 1) % timers.length;
        setActiveTimerIndex(nextIndex);
        setTimeLeft(timers[nextIndex].minutes * 60 + timers[nextIndex].seconds);

        // Increment cycle when we loop back to first timer
        if (nextIndex === 0) {
          setCycles(prev => prev + 1);
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, activeTimerIndex, timers]);

  // Update progress animation
  useEffect(() => {
    if (isRunning && timeLeft !== null) {
      const activeTimer = timers[activeTimerIndex];
      const totalTime = activeTimer ? (activeTimer.minutes * 60 + activeTimer.seconds) : 0;
      const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) : 0;

      Animated.timing(progressHeight, {
        toValue: progress * height,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(progressHeight, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, isRunning, activeTimerIndex, timers]);

  const handleStart = () => {
    if (!isRunning && timers.length > 0) {
      const allValid = timers.every(t => (t.minutes * 60 + t.seconds) > 0);
      if (allValid) {
        setActiveTimerIndex(0);
        setTimeLeft(timers[0].minutes * 60 + timers[0].seconds);
        setIsRunning(true);
        setCycles(0);
      }
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(null);
    setActiveTimerIndex(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const addTimer = () => {
    setTimers([...timers, {
      id: nextTimerId,
      label: `Timer ${nextTimerId}`,
      minutes: 1,
      seconds: 0
    }]);
    setNextTimerId(nextTimerId + 1);
  };

  const removeTimer = (id) => {
    if (timers.length > 1) {
      setTimers(timers.filter(t => t.id !== id));
    }
  };

  const updateTimer = (id, field, value) => {
    setTimers(timers.map(t =>
        t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const adjustActiveTimer = (minutesChange) => {
    if (isRunning && timeLeft !== null) {
      const newTime = Math.max(0, timeLeft + (minutesChange * 60));
      setTimeLeft(newTime);
    }
  };

  const displayMinutes = timeLeft !== null
      ? Math.floor(timeLeft / 60)
      : 0;
  const displaySeconds = timeLeft !== null
      ? timeLeft % 60
      : 0;

  const activeTimer = timers[activeTimerIndex];

  const getTimerColor = (index) => {
    const colors = ['#2DD4BF', '#38BDF8', '#A78BFA', '#FB923C', '#F472B6', '#34D399'];
    return colors[index % colors.length];
  };


  const theme = {
    bg: isDark ? '#0F172A' : '#F5F7FA',
    cardBg: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F8FAFC' : '#1E293B',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
  };

  return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Background Progress Fill */}
        <Animated.View
            style={[
              styles.progressBackground,
              {
                height: progressHeight,
                backgroundColor: `${getTimerColor(activeTimerIndex)}30`
              }
            ]}
        />

        {/* Theme Toggle */}
        <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => setIsDark(!isDark)}
        >
          {isDark ? (
              <SunIcon size={20} color="#2DD4BF" />
          ) : (
              <MoonIcon size={20} color="#1E293B" />
          )}
        </TouchableOpacity>

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
        >
          {/* Timer Configuration (when stopped) */}
          {!isRunning && (
              <View style={styles.configContainer}>
                {timers.map((timer, index) => (
                    <View
                        key={timer.id}
                        style={[styles.timerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    >
                      {/* Remove button */}
                      {timers.length > 1 && (
                          <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeTimer(timer.id)}
                          >
                            <Trash2Icon size={16} color="#EF4444" />
                          </TouchableOpacity>
                      )}

                      {/* Label input */}
                      <TextInput
                          style={[styles.labelInput, { color: getTimerColor(index) }]}
                          value={timer.label}
                          onChangeText={(text) => updateTimer(timer.id, 'label', text)}
                          placeholder="Timer label"
                          placeholderTextColor={`${getTimerColor(index)}80`}
                      />

                      {/* Time inputs */}
                      <View style={styles.timeInputContainer}>
                        <TextInput
                            style={[styles.timeInput, { color: theme.text }]}
                            keyboardType="numeric"
                            maxLength={2}
                            value={String(timer.minutes).padStart(1, '0')}
                            onChangeText={(text) => {
                              const num = parseInt(text) || 0;
                              updateTimer(timer.id, 'minutes', Math.max(0, Math.min(99, num)));
                            }}
                        />
                        <Text style={[styles.timeSeparator, { color: getTimerColor(index) }]}>:</Text>
                        <TextInput
                            style={[styles.timeInput, { color: theme.text }]}
                            keyboardType="numeric"
                            maxLength={2}
                            value={String(timer.seconds).padStart(1, '0')}
                            onChangeText={(text) => {
                              const num = parseInt(text) || 0;
                              updateTimer(timer.id, 'seconds', Math.max(0, Math.min(59, num)));
                            }}
                        />
                      </View>
                    </View>
                ))}

                {/* Add Timer Button */}
                <TouchableOpacity
                    style={styles.addTimerButton}
                    onPress={addTimer}
                >
                  <PlusIcon size={20} color="#2DD4BF" />
                  <Text style={styles.addTimerText}>Add Timer</Text>
                </TouchableOpacity>
              </View>
          )}

          {/* Timer Display (when running) */}
          {isRunning && (
              <View style={styles.runningContainer}>
                {/* Active Timer Label */}
                <View style={[styles.activeTimerLabel, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.activeTimerLabelText, { color: getTimerColor(activeTimerIndex) }]}>
                    {activeTimer?.label || 'Timer'}
                  </Text>
                </View>

                {/* Time Display */}
                <View style={styles.timeDisplay}>
                  <Text style={[styles.timeDigit, { color: theme.text }]}>
                    {String(displayMinutes).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.timeSeparatorLarge, { color: getTimerColor(activeTimerIndex) }]}>:</Text>
                  <Text style={[styles.timeDigit, { color: theme.text }]}>
                    {String(displaySeconds).padStart(2, '0')}
                  </Text>
                </View>

                {/* Adjustment Buttons */}
                <View style={styles.adjustButtons}>
                  <TouchableOpacity
                      style={[styles.adjustButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      onPress={() => adjustActiveTimer(1)}
                  >
                    <ChevronUpIcon size={20} color={getTimerColor(activeTimerIndex)} />
                    <Text style={[styles.adjustButtonText, { color: theme.text }]}>+1 min</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      style={[styles.adjustButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      onPress={() => adjustActiveTimer(-1)}
                  >
                    <ChevronDownIcon size={20} color={getTimerColor(activeTimerIndex)} />
                    <Text style={[styles.adjustButtonText, { color: theme.text }]}>-1 min</Text>
                  </TouchableOpacity>
                </View>

                {/* Timer Sequence Indicator */}
                <View style={styles.sequenceIndicator}>
                  {timers.map((timer, index) => (
                      <View
                          key={timer.id}
                          style={[
                            styles.sequenceBadge,
                            {
                              backgroundColor: `${getTimerColor(index)}${index === activeTimerIndex ? '40' : '20'}`,
                              borderColor: getTimerColor(index),
                              transform: [{ scale: index === activeTimerIndex ? 1.1 : 0.9 }],
                              opacity: index === activeTimerIndex ? 1 : 0.5,
                            }
                          ]}
                      >
                        <Text style={[styles.sequenceBadgeText, { color: getTimerColor(index) }]}>
                          {timer.label}
                        </Text>
                      </View>
                  ))}
                </View>
              </View>
          )}

          {/* Status Label */}
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
            {isRunning ? `Running • ${timers.length} Timers` : `Configure ${timers.length} Timer${timers.length !== 1 ? 's' : ''}`}
          </Text>

          {/* Cycle Counter */}
          {cycles > 0 && (
              <View style={styles.cycleCounter}>
                <Text style={[styles.cycleLabel, { color: theme.textSecondary }]}>
                  {cycles} Cycles Completed
                </Text>
              </View>
          )}
        </ScrollView>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={[styles.controlsContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {!isRunning ? (
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStart}
                >
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStop}
                >
                  <Text style={styles.stopButtonText}>Stop</Text>
                </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  themeToggle: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 50,
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 120,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  configContainer: {
    width: '100%',
    maxWidth: 600,
  },
  timerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 20,
  },
  labelInput: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 70,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  addTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    marginTop: 8,
  },
  addTimerText: {
    color: '#2DD4BF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  runningContainer: {
    alignItems: 'center',
    width: '100%',
  },
  activeTimerLabel: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 24,
  },
  activeTimerLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeDigit: {
    fontSize: 80,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    width: 140,
    textAlign: 'center',
  },
  timeSeparatorLarge: {
    fontSize: 64,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  adjustButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  adjustButtonText: {
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  sequenceIndicator: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    maxWidth: 600,
  },
  sequenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
  },
  sequenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 16,
  },
  cycleCounter: {
    alignItems: 'center',
    marginTop: 16,
  },
  cycleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cycleDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cycleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2DD4BF',
    shadowColor: '#2DD4BF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  cycleExtraText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2DD4BF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  controls: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsContainer: {
    borderRadius: 50,
    padding: 8,
    borderWidth: 1,
  },
  startButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: '#2DD4BF',
    borderRadius: 50,
  },
  startButtonText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 18,
  },
  stopButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: '#EF4444',
    borderRadius: 50,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
});

export default App;
