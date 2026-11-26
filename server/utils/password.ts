const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*])/;

export const validateStrongPassword = (password: string): string => {
  if (!password || password.length < 8) return "Must be at least 8 characters long.";
  if (password.length > 72) return "Password cannot exceed 72 characters.";
  if (!PASSWORD_REGEX.test(password)) {
    return "Should include both uppercase and lowercase letters and at least one number or special character.";
  }
  return "";
};
