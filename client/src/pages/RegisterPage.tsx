import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Box, CircularProgress, Container, TextField, InputAdornment, IconButton } from "@mui/material";
import { CheckCircle, Eye, EyeOff, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import AuthLayout from "../components/AuthLayout";

const REGISTER_HEADING = "Register Yourself!";
const VERIFY_OTP_HEADING = "Verify OTP";
const OTP_RESEND_COOLDOWN_SECONDS = 30;

interface InviteData {
  email: string;
  fullName: string;
  services: string[];
}

type Status = "loading" | "invalid" | "form" | "otp" | "done";

const useTypedHeading = (text: string, deps: unknown[]) => {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) clearInterval(interval);
    }, 7);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return typed;
};

const RegisterPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const formHeading = useTypedHeading(REGISTER_HEADING, [status === "form"]);
  const otpHeading = useTypedHeading(VERIFY_OTP_HEADING, [status === "otp"]);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/auth/register/${token}`)
      .then((res) => {
        setInvite(res.data.data);
        setStatus("form");
      })
      .catch((err: unknown) => {
        setErrorMessage(getErrorMessage(err, "Invalid or expired invite link."));
        setStatus("invalid");
      });
  }, [token]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  const sendOtp = async () => {
    setSubmitting(true);
    try {
      await api.post(`/auth/register/${token}/send-otp`, { password, confirmPassword });
      setStatus("otp");
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      toast.success("A verification code was sent to your email.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send verification code."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/auth/register/${token}/verify-otp`, { otp });
      setStatus("done");
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid verification code."));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Invite Link Invalid</h1>
          <p className="max-w-sm text-sm text-gray-500">{errorMessage}</p>
          <Link to="/login" className="wono-blue-text hover:underline">
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === "done") {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Registration Complete</h1>
        <p className="max-w-sm text-center text-sm text-gray-500">
          Your account is ready. You can now sign in to the Partners Panel.
        </p>
        <button onClick={() => navigate("/login")} className="loginButtonStyling text-subtitle font-medium w-40">
          Go to Login
        </button>
        </div>
      </AuthLayout>
    );
  }

  if (status === "otp") {
    return (
      <AuthLayout>
        <h1 className="text-center text-4xl font-play min-h-[3rem]">{otpHeading}</h1>
        <div className="loginDividingContainer shrink-container">
          <div className="w-5/6 md:w-2/3">
            <Container maxWidth="lg" style={{ padding: "3rem 0 0" }}>
              <p className="text-center text-sm text-gray-700 mb-6">
                Enter the OTP sent to <span className="font-semibold text-gray-900">{invite?.email}</span>
              </p>
              <Box component="form" sx={{ flexGrow: 1 }} onSubmit={handleVerifyOtp} noValidate autoComplete="off">
                <div className="w-full lg:max-w-[50%] lg:mx-auto">
                  <TextField
                    label="OTP"
                    variant="standard"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
                    required
                    fullWidth
                  />
                </div>
                <div className="mt-2 text-end">
                  <div className="w-full lg:max-w-[50%] lg:mx-auto">
                    {resendCooldown > 0 ? (
                      <span className="text-black/60">Resend OTP in {resendCooldown}s</span>
                    ) : (
                      <button type="button" disabled={submitting} onClick={sendOtp} className="hover:underline text-black disabled:opacity-50">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-center w-full items-center gap-6 mt-6">
                  <div className="centerInPhone">
                    <button disabled={submitting} type="submit" className="loginButtonStyling text-subtitle font-medium w-40">
                      {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Verify"}
                    </button>
                  </div>
                </div>
              </Box>
            </Container>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-center text-4xl font-play min-h-[3rem] mb-2">{formHeading}</h1>
      <div className="loginDividingContainer shrink-container">
        <div className="w-5/6 md:w-2/3">
          <Container maxWidth="lg" style={{ padding: "3rem 0 0" }}>
            <Box component="form" sx={{ flexGrow: 1 }} onSubmit={handleCreatePassword} noValidate autoComplete="off">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  variant="standard"
                  value={invite?.fullName || ""}
                  disabled
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Lock size={16} className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Email"
                  variant="standard"
                  value={invite?.email || ""}
                  disabled
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Lock size={16} className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Password"
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
                    {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "CONTINUE"}
                  </button>
                </div>
                <p className="text-[0.9rem]">
                  Already have an account?{" "}
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

export default RegisterPage;
