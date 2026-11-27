import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Box, CircularProgress, Container, TextField, InputAdornment, IconButton } from "@mui/material";
import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import AuthLayout from "../components/AuthLayout";

const HEADING = "Reset Password";

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resetSessionToken = (location.state as { resetSessionToken?: string } | null)?.resetSessionToken || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typedHeading, setTypedHeading] = useState("");

  useEffect(() => {
    if (!resetSessionToken) navigate("/forgot-password", { replace: true });
  }, [resetSessionToken, navigate]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedHeading(HEADING.slice(0, index));
      if (index >= HEADING.length) clearInterval(interval);
    }, 7);
    return () => clearInterval(interval);
  }, []);

  const passwordChecks = [
    { key: "length", label: "Must be at least 8 characters long.", passed: password.length >= 8 },
    {
      key: "case",
      label: "Should include uppercase and lowercase letters.",
      passed: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { key: "digitOrSpecial", label: "Must contain at least one number or special character.", passed: /[\d\W]/.test(password) },
  ];
  const hasAllPasswordChecks = passwordChecks.every((rule) => rule.passed);
  const hasConfirmValue = confirmPassword.length > 0;
  const isPasswordMatch = password === confirmPassword;
  const canSubmit = hasAllPasswordChecks && hasConfirmValue && isPasswordMatch && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password/reset", { resetSessionToken, password, confirmPassword });
      toast.success(res.data?.message || "Password reset successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reset password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-center text-4xl font-play min-h-[3rem]">{typedHeading}</h1>
      <div className="loginDividingContainer shrink-container">
        <div className="w-5/6 md:w-2/3">
          <Container maxWidth="lg" style={{ padding: "3rem 0 0" }}>
            <Box component="form" sx={{ flexGrow: 1 }} onSubmit={handleSubmit} noValidate autoComplete="off">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TextField
                  label="New Password"
                  variant="standard"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" size="small">
                            {showPassword ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Confirm Password"
                  variant="standard"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end" size="small">
                            {showConfirmPassword ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>

              {hasConfirmValue ? (
                <div className={`w-full text-left text-xs mt-1 ml-1 ${isPasswordMatch ? "text-green-600" : "text-red-600"}`}>
                  {isPasswordMatch ? "Passwords match." : "Passwords do not match."}
                </div>
              ) : null}
              <div className="w-full text-left text-xs mt-2 leading-6 ml-1">
                {passwordChecks.map((rule) => (
                  <p key={rule.key} className={`flex items-center gap-1 ${rule.passed ? "text-green-600" : "text-red-600"}`}>
                    {rule.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>{rule.label}</span>
                  </p>
                ))}
              </div>

              <div className="flex flex-col justify-center w-full items-center gap-4 mt-4">
                <div className="centerInPhone">
                  <button disabled={!canSubmit} type="submit" className="loginButtonStyling text-subtitle w-40">
                    {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "RESET"}
                  </button>
                </div>
                <p className="text-[0.9rem]">
                  Remembered it?{" "}
                  <Link to="/login" className="underline hover:text-primary">
                    Login
                  </Link>
                </p>
              </div>
            </Box>
          </Container>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
