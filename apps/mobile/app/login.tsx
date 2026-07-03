import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { validateEmail, validatePassword } from "@canovet/shared";

const PawIcon = () => (
  <View style={styles.pawContainer}>
    <View style={[styles.pawCircle, { left: 12, top: 21, width: 20, height: 18, borderRadius: 9, opacity: 0.95 }]} />
    <View style={[styles.pawCircle, { left: 4, top: 12, width: 10, height: 13, borderRadius: 5, opacity: 0.8 }]} />
    <View style={[styles.pawCircle, { left: 30, top: 12, width: 10, height: 13, borderRadius: 5, opacity: 0.8 }]} />
    <View style={[styles.pawCircle, { left: 11, top: 6, width: 8, height: 10, borderRadius: 4, opacity: 0.7 }]} />
    <View style={[styles.pawCircle, { left: 25, top: 6, width: 8, height: 10, borderRadius: 4, opacity: 0.7 }]} />
  </View>
);

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/home" as any);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Authentication failed. Check details.");
    } finally {
      setLoading(false);
    }
  };




  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.innerContent}>

          <View style={styles.cardContainer}>
            {/* Logo box */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#CC00BE", "#A7009D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <PawIcon />
              </LinearGradient>
            </View>

            {/* Heading */}
            <Text style={styles.title}>Welcome to Canovet</Text>
            <Text style={styles.subtitle}>
              Sign in with your email or enter details to register a new account.
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, isEmailFocused && styles.textInputFocused]}
                  placeholder="Enter email address"
                  placeholderTextColor={Colors.light.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError("");
                  }}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, isPasswordFocused && styles.textInputFocused]}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.light.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitButtonContainer,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleSubmit}
                disabled={!email || !password || loading}
              >
                <LinearGradient
                  colors={(email && password) ? ["#CC00BE", "#A7009D"] : ["#E8DCE6", "#D9CDD7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Continue 🐾</Text>
                  )}
                </LinearGradient>
              </Pressable>


            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },
  keyboardView: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  cardContainer: {
    flex: 1,
    paddingTop: 30,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 28,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  iconGradient: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pawContainer: {
    width: 44,
    height: 44,
    position: "relative",
  },
  pawCircle: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
    fontFamily: Colors.fonts.extraBold,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 20,
    fontFamily: Colors.fonts.medium,
  },
  errorContainer: {
    width: "100%",
    backgroundColor: "rgba(224, 92, 53, 0.08)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(224, 92, 53, 0.15)",
  },
  errorText: {
    color: Colors.light.destructive,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: Colors.fonts.bold,
  },
  form: {
    width: "100%",
    gap: 18,
  },
  inputContainer: {
    flexDirection: "row",
    width: "100%",
  },
  textInput: {
    flex: 1,
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.text,
    shadowColor: "#1a0a18",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    fontFamily: Colors.fonts.medium,
  },
  textInputFocused: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  submitButtonContainer: {
    height: 52,
    borderRadius: 100,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Colors.fonts.extraBold,
  },

});
