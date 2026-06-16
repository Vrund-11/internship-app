import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [timerFinished, setTimerFinished] = useState(false);

  // Animated values for dots and logo
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  // 2.8s timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimerFinished(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Animations
  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 15,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots animation
    const animateDot = (dotVar: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotVar, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotVar, {
            toValue: 0.2,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 200);
    const anim3 = animateDot(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  // Handle routing when both auth is ready and timer is finished
  useEffect(() => {
    if (timerFinished && !authLoading) {
      if (user) {
        router.replace("/home" as any);
      } else {
        router.replace("/login" as any);
      }
    }
  }, [timerFinished, authLoading, user]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.splash as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      {/* Center content */}
      <Animated.View
        style={[
          styles.centerContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* Logo Badge */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoTextCano}>cano</Text>
          <Text style={styles.logoPaw}>🐾</Text>
          <Text style={styles.logoTextEt}>et</Text>
        </View>

        {/* Tagline Pill */}
        <View style={styles.taglinePill}>
          <View style={styles.greenDot} />
          <Text style={styles.taglineText}>PREMIUM PET CARE</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Because they deserve the best 🐾</Text>
      </Animated.View>

      {/* Loading Dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, styles.dotWide, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>

      {/* Version Badge */}
      <Text style={styles.versionText}>CANOVET v2.0 · AHMEDABAD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#390035",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  orb1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 30,
    left: -60,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  centerContainer: {
    alignItems: "center",
  },
  logoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingHorizontal: 38,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 10,
  },
  logoTextCano: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1a0a18",
  },
  logoPaw: {
    fontSize: 22,
    color: "#1a0a18",
    marginHorizontal: 2,
    bottom: 1,
  },
  logoTextEt: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1a0a18",
  },
  taglinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A7FFD7",
    marginRight: 6,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1.1,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
    marginTop: 4,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 4,
  },
  dotWide: {
    width: 28,
    borderRadius: 3.5,
  },
  versionText: {
    position: "absolute",
    bottom: 24,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.25)",
    fontWeight: "600",
    letterSpacing: 0.8,
  },
});
