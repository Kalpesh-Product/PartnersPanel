import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Box, CircularProgress, Container, TextField } from "@mui/material";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import AuthLayout from "../components/AuthLayout";

const HEADING = "Verify OTP";
const RESEND_COOLDOWN_SECONDS = 30;

const ForgotPasswordVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string } | null)?.email || "";
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [typedHeading, setTypedHeading] = useState("");

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedHeading(HEADING.slice(0, index));
      if (index >= HEADING.length) clearInterval(interval);
    }, 7);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    try {
      const res = await api.post("/auth/forgot-password/start", { email });
      toast.success(res.data?.message || "Verification code resent.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend code."));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password/verify-otp", { email, otp });
      navigate("/forgot-password/reset", { state: { resetSessionToken: res.data.resetSessionToken } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid verification code."));
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
            <p className="text-center text-sm text-gray-700 mb-6">
              Enter the OTP sent to <span className="font-semibold text-gray-900">{email}</span>
            </p>
            <Box component="form" sx={{ flexGrow: 1 }} onSubmit={handleSubmit} noValidate autoComplete="off">
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
                    <button type="button" onClick={handleResend} className="hover:underline text-black">
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

export default ForgotPasswordVerifyPage;
