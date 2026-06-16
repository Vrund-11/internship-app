/**
 * Helper to check if a string contains 3 or more consecutive identical characters
 * (e.g. "aaaaa", "bbbbbbcdd", "1111")
 */
export function hasRepeatingChars(str: string): boolean {
  return /(.)\1\1/.test(str);
}

/**
 * Validates a phone number is exactly 10 digits and starts with 6-9
 */
export function validatePhone(phone: string): string | null {
  const clean = phone.replace(/\D/g, "");
  if (clean.length !== 10) {
    return "Phone number must be exactly 10 digits";
  }
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return "Phone number must start with 6, 7, 8, or 9";
  }
  return null;
}

/**
 * Validates a user or pet name
 */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Name is required";
  }
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters";
  }
  if (/[0-9]/.test(trimmed)) {
    return "Name cannot contain digits";
  }
  if (hasRepeatingChars(trimmed)) {
    return "Name cannot contain consecutive repeating characters";
  }
  if (!/^[a-zA-Z\s.-]+$/.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, or dots";
  }
  return null;
}

/**
 * Validates a pet breed
 */
export function validateBreed(breed: string): string | null {
  const trimmed = breed.trim();
  if (!trimmed) {
    return "Breed is required";
  }
  if (trimmed.length < 2) {
    return "Breed must be at least 2 characters";
  }
  if (/[0-9]/.test(trimmed)) {
    return "Breed cannot contain digits";
  }
  if (hasRepeatingChars(trimmed)) {
    return "Breed cannot contain consecutive repeating characters";
  }
  if (!/^[a-zA-Z\s.-]+$/.test(trimmed)) {
    return "Breed can only contain letters, spaces, hyphens, or dots";
  }
  return null;
}

/**
 * Validates the house/flat/floor number
 */
export function validateHouse(house: string): string | null {
  const trimmed = house.trim();
  if (!trimmed) {
    return "House/Flat number is required";
  }
  if (trimmed.length < 1) {
    return "House/Flat number is required";
  }
  if (hasRepeatingChars(trimmed)) {
    return "House/Flat number cannot contain consecutive repeating characters";
  }
  return null;
}

/**
 * Validates the area/landmark
 */
export function validateArea(area: string): string | null {
  const trimmed = area.trim();
  if (!trimmed) {
    return "Area is required";
  }
  if (trimmed.length < 3) {
    return "Area must be at least 3 characters";
  }
  if (/^\d+$/.test(trimmed)) {
    return "Area cannot consist of only digits";
  }
  if (hasRepeatingChars(trimmed)) {
    return "Area cannot contain consecutive repeating characters";
  }
  return null;
}

/**
 * Validates the city name
 */
export function validateCity(city: string): string | null {
  const trimmed = city.trim();
  if (!trimmed) {
    return "City is required";
  }
  if (trimmed.length < 2) {
    return "City must be at least 2 characters";
  }
  if (/[0-9]/.test(trimmed)) {
    return "City cannot contain digits";
  }
  if (hasRepeatingChars(trimmed)) {
    return "City cannot contain consecutive repeating characters";
  }
  return null;
}

/**
 * Validates the state name
 */
export function validateState(state: string): string | null {
  const trimmed = state.trim();
  if (!trimmed) {
    return "State is required";
  }
  if (trimmed.length < 2) {
    return "State must be at least 2 characters";
  }
  if (/[0-9]/.test(trimmed)) {
    return "State cannot contain digits";
  }
  if (hasRepeatingChars(trimmed)) {
    return "State cannot contain consecutive repeating characters";
  }
  return null;
}

/**
 * Validates pincode (exactly 6 digits, no repeating sequences like 111111)
 */
export function validatePincode(pincode: string): string | null {
  const trimmed = pincode.trim();
  if (!trimmed) {
    return "Pincode is required";
  }
  if (!/^\d{6}$/.test(trimmed)) {
    return "Pincode must be exactly 6 digits";
  }
  if (/^(\d)\1{5}$/.test(trimmed)) {
    return "Pincode cannot be repeating digits";
  }
  return null;
}

/**
 * Validates email (RFC 5322 regex)
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Email is required";
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address";
  }
  return null;
}

/**
 * Validates password meets standard strength requirements
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character (e.g., !, @, #, $, %)";
  }
  return null;
}
