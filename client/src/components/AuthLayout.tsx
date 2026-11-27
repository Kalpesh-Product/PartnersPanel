import type { ReactNode } from "react";
import logo from "../assets/WONO_LOGO_Black_TP.svg";
import Footer from "./Footer";

const AuthLayout = ({
  children,
  contentClassName = "login-section loginTopPadding loginBottomPadding poppinsRegular heightPadding",
}: {
  children: ReactNode;
  contentClassName?: string;
}) => (
  <div className="flex min-h-screen flex-col bg-white font-['Poppins'] text-[#0f172a]">
    <div className="bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between px-6 py-3 lg:px-0">
        <a href="https://partners.wono.co/" aria-label="WONO Partners home">
          <img src={logo} alt="WONO" className="h-10 w-36" />
        </a>
        <div className="hidden items-center gap-6 sm:flex lg:gap-10">
          <a
            href="https://host.wono.co"
            className="group relative whitespace-nowrap bg-transparent pb-1 text-xs text-[#0aa9ef] transition-all duration-300 sm:text-sm"
          >
            Become A Host
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#0aa9ef] transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="https://wono.co"
            className="group relative whitespace-nowrap bg-transparent pb-1 text-xs text-[#0aa9ef] transition-all duration-300 sm:text-sm"
          >
            Become A Nomad
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#0aa9ef] transition-all duration-300 group-hover:w-full" />
          </a>
        </div>
      </div>
    </div>

    <div className={contentClassName}>{children}</div>

    <Footer />
  </div>
);

export default AuthLayout;
