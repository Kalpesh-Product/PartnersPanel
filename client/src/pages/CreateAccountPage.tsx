import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { ArrowRight, ChevronDown, LockKeyhole } from "lucide-react";
import { Country, State, City } from "country-state-city";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import AuthLayout from "../components/AuthLayout";
import { SERVICE_LABELS, SERVICE_DESCRIPTIONS, VISA_TYPES_SUPPORTED, type PartnerService } from "../lib/partnerServices";

interface ServiceFormState {
  companyName: string;
  countryOfOrigin: string;
  state: string;
  city: string;
  address: string;
  website: string;
  servicesOffered: string[];
  marketsServed: string[];
}

const emptyServiceForm = (): ServiceFormState => ({
  companyName: "",
  countryOfOrigin: "",
  state: "",
  city: "",
  address: "",
  website: "",
  servicesOffered: [],
  marketsServed: [],
});

const countries = Country.getAllCountries();
const countryNames = countries.map((country) => country.name);
const requiredServiceFields: Array<keyof ServiceFormState> = ["companyName", "countryOfOrigin", "state", "city", "address"];

const fieldClassName = (hasError = false) =>
  `h-[42px] w-full rounded-xl border bg-[#f2f4f8] px-3.5 text-[13px] font-pmedium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${hasError ? "border-rose-500 focus:ring-rose-200" : "border-[#d2d9e5] focus:ring-[#bcd0ff]"}`;

const autocompleteSx = (hasError = false) => ({
  "& .MuiOutlinedInput-root": {
    minHeight: "42px",
    borderRadius: "12px",
    backgroundColor: "#f2f4f8",
    padding: "2px 10px",
    fontSize: "13px",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 500,
    color: "#334155",
    "& fieldset": { borderColor: hasError ? "#f43f5e" : "#d2d9e5" },
    "&:hover fieldset": { borderColor: hasError ? "#f43f5e" : "#d2d9e5" },
    "&.Mui-focused fieldset": {
      borderColor: hasError ? "#f43f5e" : "#bcd0ff",
      boxShadow: hasError ? "0 0 0 2px rgba(254, 205, 211, 0.7)" : "0 0 0 2px rgba(188, 208, 255, 0.45)",
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "6px 4px !important",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 500,
    color: "#334155",
  },
  "& .MuiChip-root": {
    height: "26px",
    borderRadius: "8px",
    backgroundColor: "#dce9ff",
    color: "#233552",
    fontFamily: "Poppins, sans-serif",
    fontSize: "11px",
    fontWeight: 500,
  },
});

const FieldLabel = ({ children, required = false }: { children: string; required?: boolean }) => (
  <label className="mb-2 text-[10px] font-pmedium uppercase tracking-[0.16em] text-[#3d4d67] md:text-xs">
    {children}{required ? <span className="ml-0.5 text-rose-500">*</span> : null}
  </label>
);

const FieldError = ({ children }: { children: string }) => (
  <p className="mt-1 text-[11px] font-pmedium text-rose-600">{children}</p>
);

const CreateAccountPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [services, setServices] = useState<PartnerService[]>([]);
  const [forms, setForms] = useState<Record<string, ServiceFormState>>({});

  useEffect(() => {
    api.get("/partners/me")
      .then((response) => {
        const data = response.data.data;
        setFullName(data.fullName);
        setEmail(data.email);
        setLinkedinProfile(data.linkedinProfile || "");
        setServices(data.services.map((service: { service: PartnerService }) => service.service));
        const nextForms: Record<string, ServiceFormState> = {};
        data.services.forEach((entry: { service: string } & ServiceFormState) => {
          nextForms[entry.service] = {
            companyName: entry.companyName || "",
            countryOfOrigin: entry.countryOfOrigin || "",
            state: entry.state || "",
            city: entry.city || "",
            address: entry.address || "",
            website: entry.website || "",
            servicesOffered: entry.servicesOffered || [],
            marketsServed: entry.marketsServed || [],
          };
        });
        setForms(nextForms);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to load your profile.")))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (service: string, field: keyof ServiceFormState, value: string | string[]) => {
    setForms((previous) => ({
      ...previous,
      [service]: { ...(previous[service] || emptyServiceForm()), [field]: value },
    }));
  };

  const isMissing = (service: string, field: keyof ServiceFormState) =>
    showValidationErrors && !forms[service]?.[field]?.length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowValidationErrors(true);
    const hasMissingRequiredField = services.length === 0 || services.some((service) =>
      requiredServiceFields.some((field) => !forms[service]?.[field]?.length),
    );
    if (hasMissingRequiredField) {
      toast.error("Please complete the highlighted required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put("/partners/me/profile", {
        linkedinProfile,
        services: services.map((service) => ({ service, ...forms[service] })),
      });
      toast.success("Your partner account is set up.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save your details."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><CircularProgress /></div>;
  }

  return (
    <AuthLayout contentClassName="flex-1 px-4 pb-12 pt-8 sm:px-6 md:pt-12 lg:px-8">
      <main className="mx-auto w-full max-w-[900px]">
        <div className="mb-8 sm:mb-10">
          <p className="mb-4 text-[10px] font-pmedium uppercase tracking-[0.22em] text-[#8da0bd]">Progress</p>
          <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:gap-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce9ff]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d67f0] text-sm font-bold text-white">1</div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-pmedium text-[#233552]">Partner Account</span>
                <span className="text-[11px] font-pmedium text-[#6d9bff]">Current step</span>
              </div>
            </div>
            <div className="mx-4 hidden h-px flex-1 bg-[#2d67f0] md:mx-6 md:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8cfda] text-sm font-pmedium text-[#c8cfda]">2</div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-pmedium text-[#233552]">Partner Dashboard</span>
                <span className="text-[11px] font-pmedium text-[#9aa8bc]">Next</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-7 text-center">
          <h1 className="min-h-[3.5rem] text-center text-3xl font-play">CREATE NEW PARTNERS ACCOUNT</h1>
          <p className="text-sm font-pmedium text-[#63738d] md:text-[15px]">
            Start with your partner identity and business locations. You can refine these details later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          <section>
            <div className="mb-4 border-b border-[#e1e6ef] pb-3">
              <h2 className="text-lg font-semibold text-[#233552]">Personal Information</h2>
              <p className="text-[13px] font-pmedium text-[#63738d]">These verified invite details identify the person managing this partner account.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
              <div className="flex flex-col">
                <FieldLabel>Full Name</FieldLabel>
                <div className="relative">
                  <input value={fullName} disabled className={`${fieldClassName()} pr-10 opacity-100`} />
                  <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d99ad]" size={15} />
                </div>
              </div>
              <div className="flex flex-col">
                <FieldLabel>Email Address</FieldLabel>
                <div className="relative">
                  <input value={email} disabled className={`${fieldClassName()} pr-10 opacity-100`} />
                  <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d99ad]" size={15} />
                </div>
              </div>
              <div className="flex flex-col">
                <FieldLabel>LinkedIn</FieldLabel>
                <input type="url" placeholder="https://linkedin.com/in/..." value={linkedinProfile} onChange={(event) => setLinkedinProfile(event.target.value)} className={fieldClassName()} />
              </div>
            </div>
          </section>

          {services.map((service, index) => {
            const form = forms[service] || emptyServiceForm();
            const selectedCountry = countries.find((country) => country.name === form.countryOfOrigin);
            const states = selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [];
            const selectedState = states.find((state) => state.name === form.state);
            const cities = selectedCountry && selectedState ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) : [];
            const serviceOfferedOptions = service === "visaPartner" ? VISA_TYPES_SUPPORTED : [];

            return (
              <section key={service}>
                <div className="mb-4 border-b border-[#e1e6ef] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dce9ff] text-xs font-semibold text-[#2d67f0]">{index + 1}</span>
                    <h2 className="text-lg font-semibold text-[#233552]">{SERVICE_LABELS[service]} Details</h2>
                  </div>
                  <p className="mt-1 text-[13px] font-pmedium text-[#63738d]">{SERVICE_DESCRIPTIONS[service]}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                  <div className="flex flex-col">
                    <FieldLabel required>Company Name</FieldLabel>
                    <input placeholder="Enter company name" value={form.companyName} onChange={(event) => updateField(service, "companyName", event.target.value)} className={fieldClassName(isMissing(service, "companyName"))} />
                    {isMissing(service, "companyName") ? <FieldError>Company name is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel>Website</FieldLabel>
                    <input type="url" placeholder="https://example.com" value={form.website} onChange={(event) => updateField(service, "website", event.target.value)} className={fieldClassName()} />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <FieldLabel required>Address</FieldLabel>
                    <input placeholder="Enter business address" value={form.address} onChange={(event) => updateField(service, "address", event.target.value)} className={fieldClassName(isMissing(service, "address"))} />
                    {isMissing(service, "address") ? <FieldError>Address is required.</FieldError> : null}
                  </div>

                  <div className="flex flex-col">
                    <FieldLabel required>Country of Origin</FieldLabel>
                    <Autocomplete options={countryNames} value={form.countryOfOrigin || null} onChange={(_, value) => { updateField(service, "countryOfOrigin", value || ""); updateField(service, "state", ""); updateField(service, "city", ""); }} popupIcon={<ChevronDown size={16} />} sx={autocompleteSx(isMissing(service, "countryOfOrigin"))} renderInput={(params) => <TextField {...params} placeholder="Select country" variant="outlined" />} />
                    {isMissing(service, "countryOfOrigin") ? <FieldError>Country is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel required>State</FieldLabel>
                    <Autocomplete options={states.map((state) => state.name)} value={form.state || null} onChange={(_, value) => { updateField(service, "state", value || ""); updateField(service, "city", ""); }} disabled={!selectedCountry} popupIcon={<ChevronDown size={16} />} sx={autocompleteSx(isMissing(service, "state"))} renderInput={(params) => <TextField {...params} placeholder="Select state" variant="outlined" />} />
                    {isMissing(service, "state") ? <FieldError>State is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel required>City</FieldLabel>
                    <Autocomplete options={cities.map((city) => city.name)} value={form.city || null} onChange={(_, value) => updateField(service, "city", value || "")} disabled={!selectedState} popupIcon={<ChevronDown size={16} />} sx={autocompleteSx(isMissing(service, "city"))} renderInput={(params) => <TextField {...params} placeholder="Select city" variant="outlined" />} />
                    {isMissing(service, "city") ? <FieldError>City is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel>Services Offered</FieldLabel>
                    <Autocomplete multiple freeSolo={serviceOfferedOptions.length === 0} options={serviceOfferedOptions} value={form.servicesOffered} onChange={(_, value) => updateField(service, "servicesOffered", value)} popupIcon={<ChevronDown size={16} />} sx={autocompleteSx()} renderInput={(params) => <TextField {...params} placeholder="Select or add services" variant="outlined" />} />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <FieldLabel>Countries / Markets Served</FieldLabel>
                    <Autocomplete multiple options={countryNames} value={form.marketsServed} onChange={(_, value) => updateField(service, "marketsServed", value)} popupIcon={<ChevronDown size={16} />} sx={autocompleteSx()} renderInput={(params) => <TextField {...params} placeholder="Select markets" variant="outlined" />} />
                  </div>
                </div>
              </section>
            );
          })}

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#e1e6ef] pt-5 sm:flex-row sm:items-center">
            <p className="text-[13px] font-pmedium text-[#63738d]">You can update these details later from partner settings.</p>
            <button type="submit" disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2d67f0] px-7 text-[13px] font-pmedium text-white transition-colors hover:bg-[#2558d5] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {submitting ? <CircularProgress size={18} sx={{ color: "white" }} /> : <>Continue <ArrowRight size={16} /></>}
            </button>
          </div>
        </form>
      </main>
    </AuthLayout>
  );
};

export default CreateAccountPage;
