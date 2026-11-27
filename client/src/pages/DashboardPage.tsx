import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@mui/material";
import api from "../lib/axios";
import { logout } from "../redux/slices/authSlice";
import type { RootState } from "../redux/store";
import { SERVICE_LABELS } from "../lib/partnerServices";

// Placeholder landing page — proves the invite -> register -> login loop
// works end to end. The real per-service dashboard (leads, quotes, payments,
// commission wallet) is separate, later work.
const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    api
      .get("/partners/me")
      .then((res) => {
        const services = res.data.data.services as {
          companyName?: string;
          countryOfOrigin?: string;
          state?: string;
          city?: string;
          address?: string;
        }[];
        const isIncomplete =
          services.length === 0 ||
          services.some(
            (service) =>
              !service.companyName ||
              !service.countryOfOrigin ||
              !service.state ||
              !service.city ||
              !service.address,
          );
        setProfileIncomplete(isIncomplete);
        if (isIncomplete) navigate("/create-account", { replace: true });
      })
      .catch(() => {})
      .finally(() => setCheckingProfile(false));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      dispatch(logout());
    }
  };

  if (checkingProfile || profileIncomplete) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading your account…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Welcome, {user?.fullName}</h1>
      <p className="text-sm text-gray-500">{user?.email}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {user?.services.map((service) => (
          <span key={service} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS] || service}
          </span>
        ))}
      </div>
      <Button variant="outlined" onClick={handleLogout} className="mt-4">
        Logout
      </Button>
    </div>
  );
};

export default DashboardPage;
