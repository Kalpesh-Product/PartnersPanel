import { CircularProgress } from "@mui/material";

// Same loader HostPanel uses (components/LoadingContainer.tsx), with an
// optional caption so the partner pages read like the rest of the panel.
interface LoadingContainerProps {
  height?: string;
  label?: string;
}

const LoadingContainer = ({ height = "40vh", label }: LoadingContainerProps) => {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-3 ${height}`}>
      <CircularProgress />
      {label ? <p className="font-pmedium text-sm text-slate-500">{label}</p> : null}
    </div>
  );
};

export default LoadingContainer;
