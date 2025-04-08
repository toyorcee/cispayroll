import { FaUserPlus, FaUsers } from "react-icons/fa";

interface ProcessActionsBarProps {
  onProcessSingle: () => void;
  onProcessBulk: () => void;
}

const ProcessActionsBar = ({
  onProcessSingle,
  onProcessBulk,
}: ProcessActionsBarProps) => {
  return (
    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow">
      <div className="flex gap-4">
        <button
          onClick={onProcessSingle}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FaUserPlus className="w-4 h-4" />
          Process Single Employee
        </button>
        <button
          onClick={onProcessBulk}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaUsers className="w-4 h-4" />
          Process Department
        </button>
      </div>
    </div>
  );
};

export default ProcessActionsBar;
