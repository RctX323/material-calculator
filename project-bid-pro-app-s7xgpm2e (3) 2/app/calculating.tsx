import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { brand } from '@/constants/theme';

/**
 * 1-second branded splash shown between Calculate tap and the result screen.
 * Uses router.replace so back-nav from /result goes to the calculator, not here.
 */
export default function CalculatingScreen() {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0.65);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0.7);

  useEffect(() => {
    // Pulsing logo: scale 0.92 → 1.08 → 0.92, opacity 0.65 → 1 → 0.65
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.92, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.65, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    // Expanding ring behind the icon
    ringScale.value = withRepeat(
      withTiming(1.6, { duration: 1000, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );

    const t = setTimeout(() => {
      router.replace('/result' as never);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          {/* Official Bid Pro logo — reinforces the brand on every calculation */}
          <Animated.Image
            source={require('../assets/images/icon.png')}
            style={[styles.logo, logoStyle]}
            resizeMode="contain"
            accessibilityLabel="Bid Pro"
          />
        </View>
        <Text style={styles.tagline}>Calculating…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 30,
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: brand.orange,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
