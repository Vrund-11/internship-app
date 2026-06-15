/**
 * Canovet design tokens — matching the web app's globals.css.
 * Used throughout the mobile app for consistent branding.
 */

const primary = "#FF10F0";
const primaryLight = "#FF5CED";
const primarySoft = "#FFE7F9";

export default {
  light: {
    text: "#121212",
    textSecondary: "#4A4A4A",
    textTertiary: "#8A6888",
    background: "#F8F8F8",
    card: "#FFFFFF",
    border: "#EEEEEE",
    borderLight: "#EEEEEE",
    primary,
    primaryLight,
    primarySoft,
    primaryDark: "#390035",
    tint: primary,
    tabIconDefault: "#B090A8",
    tabIconSelected: primary,
    destructive: "#E05C35",
    success: "#22C55E",

    // Muted tones
    muted: "#F3EEF1",
    mutedForeground: "#5C3A58",

    // Service-specific tints
    svcGrooming: primary,
    svcGroomingSoft: primarySoft,
    svcVet: "#1d4ed8",
    svcVetSoft: "#DBEAFE",
    svcClinic: "#b45309",
    svcClinicSoft: "#FEF3C7",
    svcFood: "#b45309",
    svcFoodSoft: "#FEF3C7",
    svcPharma: "#059669",
    svcPharmaSoft: "#D1FAE5",
    svcInsurance: "#6d28d9",
    svcInsuranceSoft: "#EDE9FE",

    // Badge colors
    greenBg: "#D1FAE5",
    greenText: "#065F46",
    yellowBg: "#FEF3C7",
    yellowText: "#78350F",
    blueBg: "#DBEAFE",
    blueText: "#1d4ed8",

    // FBF0FB (very soft pink)
    softPink: "#FBF0FB",
  },
  dark: {
    text: "#F5EBF5",
    textSecondary: "#B896B3",
    textTertiary: "#8A6888",
    background: "#130A12",
    card: "#1C0E1A",
    border: "#2E1A2C",
    borderLight: "#2E1A2C",
    primary: "#CC33C4",
    primaryLight,
    primarySoft: "#2E1A2C",
    primaryDark: "#390035",
    tint: "#CC33C4",
    tabIconDefault: "#B896B3",
    tabIconSelected: "#CC33C4",
    destructive: "#C0482A",
    success: "#16A34A",

    muted: "#2E1A2C",
    mutedForeground: "#B896B3",

    svcGrooming: "#CC33C4",
    svcGroomingSoft: "#2E1A2C",
    svcVet: "#4B7AE8",
    svcVetSoft: "#1A2540",
    svcClinic: "#D4891F",
    svcClinicSoft: "#332110",
    svcFood: "#D4891F",
    svcFoodSoft: "#332110",
    svcPharma: "#34D399",
    svcPharmaSoft: "#0D2818",
    svcInsurance: "#A78BFA",
    svcInsuranceSoft: "#1E1340",

    greenBg: "#064E3B",
    greenText: "#A7F3D0",
    yellowBg: "#78350F",
    yellowText: "#FEF3C7",
    blueBg: "#1E3A5F",
    blueText: "#93C5FD",

    softPink: "#2E1A2C",
  },

  // Gradient presets (for use with LinearGradient)
  gradients: {
    primary: [primary, primaryLight],
    heroBanner: ["#390035", "#A7009D", "#CC00BE"],
    splash: ["#390035", "#A7009D", "#CC00BE", "#E040D0"],
    avatar: [primary, "#6B0068"],
  },

  // Font families — Plus Jakarta Sans (per DESIGN.md)
  fonts: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semiBold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    extraBold: "PlusJakartaSans-ExtraBold",
  },
};
