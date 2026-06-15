import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SearchingPartnerOverlayProps {
  onFound: () => void;
}

export default function SearchingPartnerOverlay({
  onFound,
}: SearchingPartnerOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onFound, 6000);
    return () => clearTimeout(timer);
  }, [onFound]);

  return (
    <View style={styles.searchingOverlay}>
      <LinearGradient
        colors={["#A7009D", "#6B0068"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.searchingCenter}>
        {/* Ripple rings */}
        <View style={styles.rippleContainer}>
          <View style={styles.searchingIconCircle}>
            <Text style={{ fontSize: 36 }}>🐾</Text>
          </View>
        </View>
        <Text style={styles.searchingTitle}>Finding your partner...</Text>
        <Text style={styles.searchingSubtitle}>Matching you with the best available vet near you</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A7009D",
  },
  searchingCenter: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  rippleContainer: {
    width: 176,
    height: 176,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  searchingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#A7009D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  searchingSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
});
