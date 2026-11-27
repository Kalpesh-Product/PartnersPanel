import { useState } from "react";
import logo from "../assets/WONO_LOGO_Black_TP.svg";
import { FaGlobe, FaFacebookF, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { AiOutlineClose } from "react-icons/ai";

// Same footer design used across the WONO product family (HostPanel, the
// Figma "Create New Partners Account" mock) — ported here for consistency.
const languages = [
  { code: "en-US", name: "English (US)" },
  { code: "en-IN", name: "English (IN)" },
  { code: "en-SG", name: "English (Singapore)" },
  { code: "hi-IN", name: "हिन्दी (India)" },
  { code: "es-ES", name: "Español (Spain)" },
  { code: "fr-FR", name: "Français (France)" },
  { code: "de-DE", name: "Deutsch (Germany)" },
];
const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
];

const footerSections = [
  {
    heading: "Services",
    links: [
      { name: "About", href: "https://wono.co/about" },
      { name: "Career", href: "https://wono.co/career" },
      { name: "FAQs", href: "https://wono.co/faq" },
    ],
  },
  {
    heading: "Corporate",
    links: [
      { name: "Privacy", href: "https://wono.co/privacy" },
      { name: "T&C", href: "https://wono.co/terms-and-conditions" },
      { name: "Contact", href: "https://wono.co/contact" },
    ],
  },
];

const Footer = () => {
  const [showLangModal, setShowLangModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  return (
    <footer className="flex w-full flex-col items-center justify-center bg-gray-100 text-black shadow-lg">
      <div className="flex w-full flex-wrap items-center justify-center px-4 pb-8 pt-12 md:px-20 lg:justify-between">
        <div className="mb-8 flex w-full flex-col items-center text-center lg:mb-0 lg:w-auto lg:items-start lg:text-left">
          <img src={logo} className="mx-auto mb-4 w-36 lg:mx-0" alt="WONO" />
          <p className="text-sm leading-6">
            WONOCO PRIVATE LIMITED - SINGAPORE
            <br />
            <a href="mailto:response@wono.co" className="lowercase text-blue-600 hover:underline">
              response@wono.co
            </a>
          </p>
        </div>

        <div className="flex w-full justify-center lg:w-fit lg:justify-end">
          <div className="grid grid-cols-2 gap-x-10 text-center lg:text-left">
            {footerSections.map((section) => (
              <div key={section.heading} className="flex flex-col items-center lg:items-start">
                {section.links.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-sm uppercase opacity-80 hover:text-gray-500"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center border-t-2 border-white px-4 py-6 text-center md:px-20 lg:flex-row lg:justify-between lg:text-left">
        <div className="mb-3 flex flex-col items-center gap-1 text-[10px] font-semibold text-gray-800 md:flex-row md:text-xs lg:mb-0">
          <span>
            &copy; Copyright {new Date().getFullYear()}-{(new Date().getFullYear() + 1).toString().slice(-2)}
          </span>
          <span className="text-[10px] font-semibold md:ml-2 md:text-xs">
            WONOCO PRIVATE LIMITED - SINGAPORE. All Rights Reserved.
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 text-[10px] uppercase text-gray-800 md:flex-row md:text-xs">
          <a href="https://host.wono.co/content-and-copyright" target="_blank" rel="noreferrer" className="hover:text-gray-500">
            Content and Copyright Policy
          </a>
          <a href="https://host.wono.co/content-use-removal" target="_blank" rel="noreferrer" className="hover:text-gray-500">
            Content Use &amp; Removal Policy
          </a>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-4 border-t border-gray-200 bg-gray-50 py-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setShowLangModal(true)}
          className="flex items-center gap-1 hover:underline"
        >
          <FaGlobe className="text-[12px]" />
          <span>{selectedLang.name}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowCurrencyModal(true)}
          className="flex items-center gap-1 rounded-md border border-gray-700 px-2 py-[2px] hover:underline"
        >
          <span>{selectedCurrency.symbol}</span>
          <span>{selectedCurrency.code}</span>
        </button>
        <FaFacebookF className="text-[12px]" />
        <FaXTwitter className="text-[12px]" />
        <FaInstagram className="text-[12px]" />
      </div>

      {showLangModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <button
              type="button"
              onClick={() => setShowLangModal(false)}
              className="absolute right-3 top-3 text-gray-600 hover:text-black"
            >
              <AiOutlineClose size={20} />
            </button>
            <h2 className="mb-4 text-lg font-semibold">Choose a language and region</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {languages.map((language, index) => (
                <button
                  key={language.code}
                  type="button"
                  disabled={index !== 0}
                  onClick={() => {
                    setSelectedLang(language);
                    setShowLangModal(false);
                  }}
                  className={`rounded-md border px-3 py-2 text-left ${index !== 0 ? "cursor-not-allowed opacity-40" : "hover:border-black"} ${selectedLang.code === language.code ? "border-black" : "border-gray-300"}`}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showCurrencyModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <button
              type="button"
              onClick={() => setShowCurrencyModal(false)}
              className="absolute right-3 top-3 text-gray-600 hover:text-black"
            >
              <AiOutlineClose size={20} />
            </button>
            <h2 className="mb-4 text-lg font-semibold">Choose a currency</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {currencies.map((currency, index) => (
                <button
                  key={currency.code}
                  type="button"
                  disabled={index !== 0}
                  onClick={() => {
                    setSelectedCurrency(currency);
                    setShowCurrencyModal(false);
                  }}
                  className={`rounded-md border px-3 py-2 text-left ${index !== 0 ? "cursor-not-allowed opacity-40" : "hover:border-black"} ${selectedCurrency.code === currency.code ? "border-black" : "border-gray-300"}`}
                >
                  <span className="block font-medium">{currency.name}</span>
                  <span className="block text-sm text-gray-500">{currency.code} — {currency.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
};

export default Footer;
