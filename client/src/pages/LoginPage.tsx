import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, CircularProgress, Container, TextField, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import { setCredentials } from "../redux/slices/authSlice";
import AuthLayout from "../components/AuthLayout";

const SIGN_IN_HEADING = "Partner Login";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typedHeading, setTypedHeading] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    let headingIndex = 0;
    const headingInterval = setInterval(() => {
      headingIndex += 1;
      setTypedHeading(SIGN_IN_HEADING.slice(0, headingIndex));
      if (headingIndex >= SIGN_IN_HEADING.length) {
        clearInterval(headingInterval);
        setIsFormVisible(true);
      }
    }, 7);
    return () => clearInterval(headingInterval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      dispatch(setCredentials({ user: res.data.data, token: res.data.accessToken }));
      navigate(res.data.data.profileComplete ? "/dashboard" : "/create-account", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-center text-4xl font-play min-h-[3rem]">{typedHeading}</h1>
      <div className="loginDividingContainer shrink-container">
        <div className="w-5/6 md:w-2/3">
          <Container maxWidth="lg" style={{ padding: "3rem 0 0" }}>
            <Box
              component="form"
              sx={{ flexGrow: 1 }}
              onSubmit={handleLogin}
              noValidate
              autoComplete="off"
              className={isFormVisible ? "visible" : "invisible"}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TextField
                  label="Email"
                  variant="standard"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
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
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>

              <div className="mt-6 text-end">
                <Link to="/forgot-password" className="hover:underline text-black">
                  Forgot Password?
                </Link>
              </div>

              <div className="flex flex-col justify-center w-full items-center gap-6 mt-6">
                <div className="centerInPhone">
                  <button disabled={loading} type="submit" className="loginButtonStyling text-subtitle font-medium w-40">
                    {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Login"}
                  </button>
                </div>
                <p className="text-[0.9rem]">
                  Don't have an account?{" "}
                  <a href="https://wono.co/become-a-contributor" className="cursor-pointer underline">
                    Become a Contributor
                  </a>
                </p>
              </div>
            </Box>
          </Container>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
