import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, CircularProgress, Container, TextField } from "@mui/material";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import AuthLayout from "../components/AuthLayout";

const HEADING = "Forgot Password?";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [typedHeading, setTypedHeading] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedHeading(HEADING.slice(0, index));
      if (index >= HEADING.length) clearInterval(interval);
    }, 7);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password/start", { email });
      toast.success(res.data?.message || "Verification code sent.");
      navigate("/forgot-password/verify", { state: { email } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send email. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-center text-4xl font-play min-h-[3rem]">{typedHeading}</h1>
      <div className="loginDividingContainer shrink-container">
        <div className="w-full md:w-3/4">
          <Container maxWidth="lg" style={{ padding: "3rem 0 0" }}>
            <Box component="form" sx={{ flexGrow: 1 }} onSubmit={onSubmit} noValidate autoComplete="off">
              <div className="w-4/5 md:w-1/2 mx-auto">
                <TextField
                  label="Email"
                  variant="standard"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                />
              </div>

              <div className="flex flex-col justify-center w-full items-center gap-6 mt-6">
                <div className="centerInPhone">
                  <button disabled={submitting} type="submit" className="loginButtonStyling text-subtitle font-medium w-40">
                    {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Send"}
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

export default ForgotPasswordPage;
