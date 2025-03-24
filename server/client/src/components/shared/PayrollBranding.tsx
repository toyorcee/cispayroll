import { FaMoneyCheckAlt } from "react-icons/fa";

interface PayrollBrandingProps {
  showLogo?: boolean;
  className?: string;
}

export const PayrollBranding = ({
  showLogo = true,
  className = "",
}: PayrollBrandingProps) => (
  <div className={`text-center ${className}`}>
    <div className="flex items-center justify-center gap-2 mb-2">
      {showLogo && <FaMoneyCheckAlt size={24} className="text-green-600" />}
      <div>
        <span className="text-xl font-bold text-green-600">PEOPLEMAX</span>
        <span className="block text-xs text-gray-600">
          Payroll Management System
        </span>
      </div>
    </div>
  </div>
);
