import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { ArrowRight, ChevronDown, LockKeyhole, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import { getErrorMessage } from "../lib/getErrorMessage";
import { showSuccessAlert } from "../utils/alerts";
import AuthLayout from "../components/AuthLayout";
import CountryMultiSelect from "../components/CountryMultiSelect";
import CountrySingleSelect from "../components/CountrySingleSelect";
import CheckboxMultiSelect from "../components/CheckboxMultiSelect";
import { getContinentForCountry } from "../lib/countryContinent";
import { SERVICE_LABELS, SERVICE_DESCRIPTIONS, SERVICE_OFFERED_OPTIONS, type PartnerService } from "../lib/partnerServices";

interface SetupDocument {
  url: string;
  id: string;
  name: string;
}

type SetupDocumentKind = "signedAgreement" | "businessDocument";
const SETUP_DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";
const SETUP_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const MAX_BUSINESS_DOCUMENTS = 5;

interface ServiceFormState {
  companyName: string;
  countryOfOrigin: string;
  state: string;
  city: string;
  address: string;
  website: string;
  servicesOffered: string[];
  marketsServed: string[];
  sameAsFullName: boolean;
  sameAsCountry: boolean;
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
  sameAsFullName: false,
  sameAsCountry: false,
});

const countries = Country.getAllCountries();
const requiredServiceFields: Array<keyof ServiceFormState> = ["companyName", "countryOfOrigin", "state", "city", "address"];

const fieldClassName = (hasError = false) =>
  `h-[42px] w-full rounded-xl border bg-[#f2f4f8] px-3.5 text-[13px] font-pmedium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${hasError ? "border-rose-500 focus:ring-rose-200" : "border-[#d2d9e5] focus:ring-[#bcd0ff]"}`;

const selectClassName = (hasError = false, disabled = false) =>
  `h-[42px] w-full appearance-none rounded-xl border bg-[#f2f4f8] px-3.5 pr-10 text-[13px] font-pmedium text-slate-700 focus:outline-none focus:ring-2 ${hasError ? "border-rose-500 focus:ring-rose-200" : "border-[#d2d9e5] focus:ring-[#bcd0ff]"} ${disabled ? "opacity-100" : ""}`;

const SelectChevron = () => (
  <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d99ad]" />
);

const FieldLabel = ({ children, required = false }: { children: string; required?: boolean }) => (
  <label className="mb-2 text-[10px] font-pmedium uppercase tracking-[0.16em] text-[#3d4d67] md:text-xs">
    {children}{required ? <span className="ml-0.5 text-rose-500">*</span> : null}
  </label>
);

const FieldError = ({ children }: { children: string }) => (
  <p className="mt-1 text-[11px] font-pmedium text-rose-600">{children}</p>
);

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <FieldLabel>{label}</FieldLabel>
    <div className="relative">
      <input value={value} disabled className={`${fieldClassName()} pr-10 opacity-100`} />
      <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d99ad]" size={15} />
    </div>
  </div>
);

const CreateAccountPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [services, setServices] = useState<PartnerService[]>([]);
  const [forms, setForms] = useState<Record<string, ServiceFormState>>({});

  // Same upload-filled-in-agreement + business-documents pattern as
  // HostPanel's Create Business Location — one continuous page, no wizard.
  const [agreementInfo, setAgreementInfo] = useState<{ url: string; name: string } | null>(null);
  const [isAgreementLoaded, setIsAgreementLoaded] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [signedDocument, setSignedDocument] = useState<SetupDocument | null>(null);
  const [businessDocuments, setBusinessDocuments] = useState<SetupDocument[]>([]);
  const [uploadingKind, setUploadingKind] = useState<SetupDocumentKind | "">("");

  useEffect(() => {
    api.get("/partners/me")
      .then((response) => {
        const data = response.data.data;
        setFullName(data.fullName);
        setEmail(data.email);
        setPhone([data.contactCode, data.contactNumber].filter(Boolean).join(" "));
        setCurrentCountry(data.currentCountry || "");
        setLinkedinProfile(data.linkedinProfile || "");
        setServices(data.services.map((service: { service: PartnerService }) => service.service));
        const nextForms: Record<string, ServiceFormState> = {};
        data.services.forEach((entry: { service: string } & Partial<ServiceFormState>) => {
          nextForms[entry.service] = {
            companyName: entry.companyName || "",
            countryOfOrigin: entry.countryOfOrigin || "",
            state: entry.state || "",
            city: entry.city || "",
            address: entry.address || "",
            website: entry.website || "",
            servicesOffered: entry.servicesOffered || [],
            marketsServed: entry.marketsServed || [],
            sameAsFullName: false,
            sameAsCountry: false,
          };
        });
        setForms(nextForms);
        const acceptance = data.agreementAcceptance;
        if (acceptance) {
          setAgreementAccepted(Boolean(acceptance.accepted));
          setSignedDocument(acceptance.signedDocument || null);
          setBusinessDocuments(Array.isArray(acceptance.businessDocuments) ? acceptance.businessDocuments : []);
        }
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to load your profile.")))
      .finally(() => setLoading(false));

    api.get("/partners/me/agreement")
      .then((response) => setAgreementInfo(response?.data?.agreement || null))
      .catch(() => toast.error("Couldn't load your agreement. Refresh the page to try again."))
      .finally(() => setIsAgreementLoaded(true));
  }, []);

  const uploadSetupDocument = async (kind: SetupDocumentKind, file?: File): Promise<SetupDocument | null> => {
    if (!file) return null;
    if (file.size > SETUP_DOCUMENT_MAX_BYTES) {
      toast.error("Each file must be 10 MB or smaller.");
      return null;
    }
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    try {
      setUploadingKind(kind);
      const response = await api.post("/partners/me/setup-documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response?.data?.document || null;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload the file. Please try again."));
      return null;
    } finally {
      setUploadingKind("");
    }
  };

  const handleSignedAgreementPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const uploaded = await uploadSetupDocument("signedAgreement", file);
    if (uploaded) setSignedDocument(uploaded);
  };

  const handleBusinessDocumentPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (businessDocuments.length >= MAX_BUSINESS_DOCUMENTS) {
      toast.error(`You can add up to ${MAX_BUSINESS_DOCUMENTS} business documents.`);
      return;
    }
    const uploaded = await uploadSetupDocument("businessDocument", file);
    if (uploaded) setBusinessDocuments((previous) => [...previous, uploaded]);
  };

  const isAgreementFieldMissing = (field: "signedAgreement" | "businessDocument" | "agreementAccepted") => {
    if (!showValidationErrors) return false;
    if (field === "businessDocument") return businessDocuments.length === 0;
    if (field === "signedAgreement") return Boolean(agreementInfo) && !signedDocument;
    return Boolean(agreementInfo) && !agreementAccepted;
  };

  const updateField = (service: string, field: keyof ServiceFormState, value: string | string[] | boolean) => {
    setForms((previous) => ({
      ...previous,
      [service]: { ...(previous[service] || emptyServiceForm()), [field]: value },
    }));
  };

  const toggleSameAsFullName = (service: string, checked: boolean) => {
    updateField(service, "sameAsFullName", checked);
    if (checked) updateField(service, "companyName", fullName);
  };

  const toggleSameAsCountry = (service: string, checked: boolean) => {
    updateField(service, "sameAsCountry", checked);
    if (checked) {
      updateField(service, "countryOfOrigin", currentCountry);
      updateField(service, "state", "");
      updateField(service, "city", "");
    }
  };

  const isMissing = (service: string, field: keyof ServiceFormState) => {
    const value = forms[service]?.[field];
    return showValidationErrors && typeof value === "string" && !value.length;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowValidationErrors(true);
    const hasMissingRequiredField = services.length === 0 || services.some((service) =>
      requiredServiceFields.some((field) => String(forms[service]?.[field] || "").length === 0),
    );
    if (hasMissingRequiredField) {
      toast.error("Please complete the highlighted required fields.");
      return;
    }
    if (!isAgreementLoaded) {
      toast.error("Please wait while we load your agreement.");
      return;
    }
    if (businessDocuments.length === 0 || (agreementInfo && (!signedDocument || !agreementAccepted))) {
      toast.error("Please complete the agreement & documents section below.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put("/partners/me/profile", {
        linkedinProfile,
        services: services.map((service) => {
          const form = forms[service] || emptyServiceForm();
          return {
            service,
            companyName: form.companyName,
            countryOfOrigin: form.countryOfOrigin,
            state: form.state,
            city: form.city,
            address: form.address,
            website: form.website,
            servicesOffered: form.servicesOffered,
            marketsServed: form.marketsServed,
          };
        }),
        agreementAcceptance: { accepted: agreementAccepted, signedDocument, businessDocuments },
      });
      await showSuccessAlert(response.data?.message || "Your partner account is set up.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save your details."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-pmedium text-slate-500">Loading...</div>;
  }

  const continent = getContinentForCountry(currentCountry);

  return (
    <AuthLayout contentClassName="flex-1 px-4 pb-12 pt-8 sm:px-6 md:pt-12 lg:px-8">
      <main className="mx-auto w-full max-w-[900px]">
        <div className="mb-7 text-center">
          <h1 className="min-h-[3.5rem] text-center text-3xl font-play">CREATE NEW PARTNERS ACCOUNT</h1>
          <p className="text-sm font-pmedium text-[#63738d] md:text-[15px]">
            Start with the main identity of your partners account. You can still refine and expand it after setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          <section>
            <div className="mb-4 border-b border-[#e1e6ef] pb-3">
              <h2 className="text-lg font-pmedium text-[#233552]">Personal information</h2>
              <p className="text-[13px] font-pmedium text-[#63738d]">Tell us about the person setting up this partner account.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
              <LockedField label="Full Name" value={fullName} />
              <LockedField label="Email Address" value={email} />
              <LockedField label="Phone Number" value={phone} />
              <LockedField label="Continent" value={continent || "--"} />
              <LockedField label="Country" value={currentCountry} />
              <div className="flex flex-col">
                <FieldLabel required>LinkedIn</FieldLabel>
                <input
                  type="url"
                  placeholder="linkedin.com/in/..."
                  value={linkedinProfile}
                  onChange={(event) => setLinkedinProfile(event.target.value)}
                  className={fieldClassName(showValidationErrors && !linkedinProfile.length)}
                />
                {showValidationErrors && !linkedinProfile.length ? <FieldError>LinkedIn profile is required.</FieldError> : null}
              </div>
            </div>
          </section>

          {services.map((service) => {
            const form = forms[service] || emptyServiceForm();
            const selectedCountry = countries.find((country) => country.name === form.countryOfOrigin);
            const states = selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [];
            const selectedState = states.find((state) => state.name === form.state);
            const cities = selectedCountry && selectedState ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) : [];
            const servicesOfferedOptions = SERVICE_OFFERED_OPTIONS[service];

            return (
              <section key={service}>
                <div className="mb-4 border-b border-[#e1e6ef] pb-3">
                  <h2 className="text-lg font-pmedium text-[#233552]">{SERVICE_LABELS[service]} Details</h2>
                  <p className="mt-1 text-[13px] font-pmedium text-[#63738d]">{SERVICE_DESCRIPTIONS[service]}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 font-pmedium">
                  <div className="flex flex-col ">
                    <FieldLabel required>Company Name</FieldLabel>
                    <input
                      placeholder="Enter company name"
                      value={form.companyName}
                      disabled={form.sameAsFullName}
                      onChange={(event) => updateField(service, "companyName", event.target.value)}
                      className={`${fieldClassName(isMissing(service, "companyName"))} ${form.sameAsFullName ? "opacity-70" : ""}`}
                    />
                    {isMissing(service, "companyName") ? <FieldError>Company name is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel required>Country of Origin</FieldLabel>
                    <CountrySingleSelect
                      value={form.countryOfOrigin}
                      disabled={form.sameAsCountry}
                      hasError={isMissing(service, "countryOfOrigin")}
                      onChange={(next) => {
                        updateField(service, "countryOfOrigin", next);
                        updateField(service, "state", "");
                        updateField(service, "city", "");
                      }}
                    />
                    {isMissing(service, "countryOfOrigin") ? <FieldError>Country is required.</FieldError> : null}
                  </div>

                  <label className="-mt-1.5 flex items-center gap-2 text-[12px] font-pmedium text-[#63738d]">
                    <input type="checkbox" checked={form.sameAsFullName} onChange={(event) => toggleSameAsFullName(service, event.target.checked)} className="h-3.5 w-3.5 accent-[#2d67f0]" />
                    Same as Full Name
                  </label>
                  <label className="-mt-1.5 flex items-center gap-2 text-[12px] font-pmedium text-[#63738d]">
                    <input type="checkbox" checked={form.sameAsCountry} onChange={(event) => toggleSameAsCountry(service, event.target.checked)} className="h-3.5 w-3.5 accent-[#2d67f0]" />
                    Same as country
                  </label>

                  <div className="flex flex-col">
                    <FieldLabel required>State</FieldLabel>
                    <div className="relative">
                      <select
                        value={form.state}
                        disabled={!selectedCountry}
                        onChange={(event) => {
                          updateField(service, "state", event.target.value);
                          updateField(service, "city", "");
                        }}
                        className={selectClassName(isMissing(service, "state"))}
                      >
                        <option value="">Select state</option>
                        {states.map((state) => (
                          <option key={state.isoCode} value={state.name}>{state.name}</option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                    {isMissing(service, "state") ? <FieldError>State is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel required>City</FieldLabel>
                    <div className="relative">
                      <select
                        value={form.city}
                        disabled={!selectedState}
                        onChange={(event) => updateField(service, "city", event.target.value)}
                        className={selectClassName(isMissing(service, "city"))}
                      >
                        <option value="">Select city</option>
                        {cities.map((city) => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                    {isMissing(service, "city") ? <FieldError>City is required.</FieldError> : null}
                  </div>

                  <div className="flex flex-col">
                    <FieldLabel required>Address</FieldLabel>
                    <input
                      placeholder="Enter your address"
                      value={form.address}
                      onChange={(event) => updateField(service, "address", event.target.value)}
                      className={fieldClassName(isMissing(service, "address"))}
                    />
                    {isMissing(service, "address") ? <FieldError>Address is required.</FieldError> : null}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel>Website</FieldLabel>
                    <input
                      type="url"
                      placeholder="Enter website URL"
                      value={form.website}
                      onChange={(event) => updateField(service, "website", event.target.value)}
                      className={fieldClassName()}
                    />
                  </div>

                  <div className="flex flex-col">
                    <FieldLabel required={Boolean(servicesOfferedOptions)}>Services Offered</FieldLabel>
                    {servicesOfferedOptions ? (
                      <CheckboxMultiSelect
                        options={servicesOfferedOptions}
                        value={form.servicesOffered}
                        onChange={(next) => updateField(service, "servicesOffered", next)}
                        placeholder="Select services offered"
                      />
                    ) : (
                      <div className="flex h-[42px] w-full items-center rounded-xl border border-[#d2d9e5] bg-[#f2f4f8] px-3.5 text-[13px] font-pmedium text-slate-500 opacity-70">
                        Coming soon
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <FieldLabel required>Countries of Expertise</FieldLabel>
                    <CountryMultiSelect value={form.marketsServed} onChange={(next) => updateField(service, "marketsServed", next)} />
                  </div>
                </div>
              </section>
            );
          })}

          <section className="space-y-4 rounded-2xl border border-[#d9e1ec] bg-[#f7f9fc] p-4 md:p-5">
            <div>
              <p className="text-[10px] font-pmedium uppercase tracking-[0.16em] text-[#3d4d67] md:text-xs">Agreement &amp; Documents</p>
              <p className="mt-1 text-[12px] font-pmedium text-[#63738d]">
                {agreementInfo
                  ? "Read the agreement, fill it in, then upload the completed copy below. Also upload a document that verifies your business."
                  : "Upload a document that verifies your business, such as a registration certificate or licence."}
              </p>
            </div>

            {agreementInfo ? (
              <a
                href={agreementInfo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#c8d6f2] bg-white px-3.5 py-2.5 text-[13px] font-pmedium text-[#2d67f0] hover:bg-[#eef3ff]"
              >
                <Paperclip size={16} />
                <span className="break-all">View agreement (PDF) &middot; {agreementInfo.name}</span>
              </a>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div className="flex flex-col">
                <FieldLabel required={Boolean(agreementInfo)}>{agreementInfo ? "Filled-in Agreement" : "Agreement Document"}</FieldLabel>
                {signedDocument ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d2d9e5] bg-white px-3.5 py-2.5">
                    <a href={signedDocument.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-[13px] font-pmedium text-[#334155] hover:underline">
                      <Paperclip size={14} className="shrink-0 text-[#8d99ad]" />
                      <span className="truncate">{signedDocument.name}</span>
                    </a>
                    <button type="button" onClick={() => setSignedDocument(null)} aria-label="Remove agreement document" className="shrink-0 text-[#8d99ad] hover:text-rose-600">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed bg-white px-3.5 text-[13px] font-pmedium text-[#63738d] hover:border-[#2d67f0] hover:text-[#2d67f0] ${isAgreementFieldMissing("signedAgreement") ? "border-rose-500" : "border-[#c2ccdc]"}`}>
                    <Paperclip size={14} />
                    {uploadingKind === "signedAgreement" ? "Uploading..." : "Upload agreement"}
                    <input type="file" accept={SETUP_DOCUMENT_ACCEPT} className="sr-only" disabled={Boolean(uploadingKind)} onChange={handleSignedAgreementPick} />
                  </label>
                )}
                {isAgreementFieldMissing("signedAgreement") ? <FieldError>Upload the filled-in agreement.</FieldError> : null}
              </div>

              <div className="flex flex-col">
                <FieldLabel required>Business Documents</FieldLabel>
                <div className="space-y-2">
                  {businessDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#d2d9e5] bg-white px-3.5 py-2.5">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-[13px] font-pmedium text-[#334155] hover:underline">
                        <Paperclip size={14} className="shrink-0 text-[#8d99ad]" />
                        <span className="truncate">{doc.name}</span>
                      </a>
                      <button type="button" onClick={() => setBusinessDocuments((previous) => previous.filter((item) => item.id !== doc.id))} aria-label={`Remove ${doc.name}`} className="shrink-0 text-[#8d99ad] hover:text-rose-600">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {businessDocuments.length < MAX_BUSINESS_DOCUMENTS ? (
                    <label className="flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c2ccdc] bg-white px-3.5 text-[13px] font-pmedium text-[#63738d] hover:border-[#2d67f0] hover:text-[#2d67f0]">
                      <Paperclip size={14} />
                      {uploadingKind === "businessDocument" ? "Uploading..." : "Add a document"}
                      <input type="file" accept={SETUP_DOCUMENT_ACCEPT} className="sr-only" disabled={Boolean(uploadingKind)} onChange={handleBusinessDocumentPick} />
                    </label>
                  ) : null}
                </div>
                {isAgreementFieldMissing("businessDocument") ? <FieldError>Upload at least one business document.</FieldError> : null}
                <p className="mt-1 text-[11px] font-pmedium text-[#7b8ba3]">Any business-related document that verifies your business. PDF, Word or image, up to 10 MB each.</p>
              </div>
            </div>

            {agreementInfo ? (
              <div>
                <label className="inline-flex cursor-pointer select-none items-start gap-2.5 text-[13px] font-pmedium text-[#334155]">
                  <input type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#2d67f0]" />
                  <span>
                    I have read and agree to this{" "}
                    <a href={agreementInfo.url} target="_blank" rel="noreferrer" className="text-[#2d67f0] underline">agreement</a>.
                  </span>
                </label>
                {isAgreementFieldMissing("agreementAccepted") ? <FieldError>You need to accept the agreement to continue.</FieldError> : null}
              </div>
            ) : null}
          </section>

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#e1e6ef] pt-5 sm:flex-row sm:items-center">
            <p className="text-[13px] font-pmedium text-[#63738d]">You can update these details later from partner settings.</p>
            <button type="submit" disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2d67f0] px-7 text-[13px] font-pmedium text-white transition-colors hover:bg-[#2558d5] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {submitting ? "Saving..." : "Continue"} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>
    </AuthLayout>
  );
};

export default CreateAccountPage;
