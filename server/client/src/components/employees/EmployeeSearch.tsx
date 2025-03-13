import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaTimes } from "react-icons/fa";

interface EmployeeSearchProps {
  onSearch: (query: string) => void;
}

export const EmployeeSearch = ({ onSearch }: EmployeeSearchProps) => {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <motion.div
      initial={{ width: "300px" }}
      animate={{ width: focused ? "400px" : "300px" }}
      className="relative"
    >
      <div className="relative flex items-center">
        <FaSearch className="absolute left-3 text-green-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search employees by name, email, or position..."
          className="w-full pl-10 pr-10 py-2 border-2 border-green-100 focus:border-green-500 
                   rounded-full outline-none transition-all duration-300"
        />
        {query && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
