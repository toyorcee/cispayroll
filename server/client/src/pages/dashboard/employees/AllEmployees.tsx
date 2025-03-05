import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUserPlus,
  FaFilter,
  FaUser,
  FaBuilding,
  FaMoneyBill,
  FaPencilAlt,
  FaEye,
} from "react-icons/fa";
import { Employee } from "../../../types/employee";
import { Status } from "../../../types/common";

const employees: Employee[] = [
  {
    id: "EMP001",
    employeeId: "2023001",
    firstName: "Oluwaseun",
    lastName: "Adebayo",
    email: "oluwaseun.adebayo@company.com",
    phone: "+234 801 234 5678",
    department: "Engineering",
    position: "Senior Developer",
    gradeLevel: "L5",
    bankDetails: {
      bankName: "Zenith Bank",
      accountNumber: "1234567890",
      accountName: "Oluwaseun Adebayo",
    },
    dateJoined: new Date("2023-01-15"),
    status: "active",
    salary: {
      basic: 850000,
      allowances: [
        {
          id: "all-001",
          type: "Housing",
          amount: 150000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-002",
          type: "Transport",
          amount: 50000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-001",
          type: "Tax",
          amount: 85000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-002",
          type: "Pension",
          amount: 42500,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "1234567890",
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: "PEN123456",
      pensionProvider: "ARM Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    nhfNumber: "NHF123456",
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
    },
    overtime: {
      rate: 1.5,
      hoursWorked: 0,
    },
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-02-28"),
  },
  {
    id: "EMP002",
    employeeId: "2023002",
    firstName: "Chidinma",
    lastName: "Okonkwo",
    email: "chidinma.okonkwo@company.com",
    phone: "+234 802 345 6789",
    department: "Marketing",
    position: "Marketing Manager",
    gradeLevel: "L4",
    bankDetails: {
      bankName: "Access Bank",
      accountNumber: "2345678901",
      accountName: "Chidinma Okonkwo",
    },
    dateJoined: new Date("2023-03-01"),
    status: "active",
    salary: {
      basic: 750000,
      allowances: [
        {
          id: "all-003",
          type: "Housing",
          amount: 120000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-004",
          type: "Transport",
          amount: 45000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-003",
          type: "Tax",
          amount: 75000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-004",
          type: "Pension",
          amount: 37500,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "2345678901",
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: "PEN234567",
      pensionProvider: "Stanbic IBTC Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    nhfNumber: "NHF234567",
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
    },
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2024-02-28"),
  },
  {
    id: "EMP003",
    employeeId: "2023003",
    firstName: "Babajide",
    lastName: "Oluwole",
    email: "babajide.oluwole@company.com",
    phone: "+234 803 456 7890",
    department: "Finance",
    position: "Financial Analyst",
    gradeLevel: "L3",
    bankDetails: {
      bankName: "Guaranty Trust Bank",
      accountNumber: "3456789012",
      accountName: "Babajide Oluwole",
    },
    dateJoined: new Date("2023-06-10"),
    status: "suspended",
    salary: {
      basic: 650000,
      allowances: [
        {
          id: "all-005",
          type: "Housing",
          amount: 100000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-006",
          type: "Transport",
          amount: 40000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-005",
          type: "Tax",
          amount: 65000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-006",
          type: "Pension",
          amount: 32500,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "3456789012",
    },
    pensionInfo: {
      pensionNumber: "PEN345678",
      pensionProvider: "Stanbic IBTC Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
    },
    createdAt: new Date("2023-06-10"),
    updatedAt: new Date("2024-02-28"),
  },
  {
    id: "EMP004",
    employeeId: "2023004",
    firstName: "Aisha",
    lastName: "Ibrahim",
    email: "aisha.ibrahim@company.com",
    phone: "+234 804 567 8901",
    department: "HR",
    position: "HR Specialist",
    gradeLevel: "L3",
    bankDetails: {
      bankName: "First Bank",
      accountNumber: "4567890123",
      accountName: "Aisha Ibrahim",
    },
    dateJoined: new Date("2023-09-05"),
    status: "active",
    salary: {
      basic: 600000,
      allowances: [
        {
          id: "all-007",
          type: "Housing",
          amount: 90000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-008",
          type: "Transport",
          amount: 35000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-007",
          type: "Tax",
          amount: 60000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-008",
          type: "Pension",
          amount: 30000,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "4567890123",
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: "PEN456789",
      pensionProvider: "NLPC Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    nhfNumber: "NHF456789",
    leave: {
      annual: 24,
      sick: 10,
      maternity: 90,
      unpaid: 0,
    },
    createdAt: new Date("2023-09-05"),
    updatedAt: new Date("2024-02-28"),
  },
];

export default function AllEmployees() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const filteredEmployees =
    selectedDepartment === "all"
      ? employees
      : employees.filter(
          (emp) => emp.department.toLowerCase() === selectedDepartment
        );

  const calculateTotalCompensation = (employee: Employee) => {
    const basic = employee.salary.basic;
    const allowances = employee.salary.allowances.reduce(
      (sum, a) => sum + a.amount,
      0
    );
    const deductions = employee.salary.deductions.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    return basic + allowances - deductions;
  };

  const getStatusColor = (status: Status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "terminated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/employees/add"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaUserPlus className="h-5 w-5 mr-2" />
          Add Employee
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                    hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUser className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {employees.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                    hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBuilding className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Departments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Set(employees.map((e) => e.department)).size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                    hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaMoneyBill className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Payroll
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(
                      employees.reduce(
                        (sum, emp) => sum + calculateTotalCompensation(emp),
                        0
                      )
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <FaFilter className="h-4 w-4 text-green-600 mr-2" />
          <select
            className="text-sm md:text-base border-gray-300 rounded-lg shadow-sm 
                     !bg-green-600 !text-white px-3 py-1.5 
                     hover:bg-green-700 transition-all duration-200
                     transform hover:-translate-y-0.5 hover:shadow-md
                     focus:ring-0 focus:outline-none cursor-pointer"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="marketing">Marketing</option>
            <option value="finance">Finance</option>
            <option value="hr">HR</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position & Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FaUser className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm md:text-base font-medium text-gray-900">
                          {`${employee.firstName} ${employee.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {employee.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaBuilding className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <div className="text-sm md:text-base text-gray-900">
                          {employee.department}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Grade: {employee.gradeLevel}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      {employee.position}
                    </div>
                    <div className="flex items-center text-xs md:text-sm text-gray-500">
                      <FaMoneyBill className="h-4 w-4 mr-1 text-green-600" />₦
                      {calculateTotalCompensation(employee).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                        employee.status
                      )}`}
                    >
                      {employee.status.charAt(0).toUpperCase() +
                        employee.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {employee.dateJoined.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base">
                    <button
                      className="text-green-600 hover:text-green-700 mr-4 
                             transition-all duration-200 
                             transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                             focus:outline-none focus:ring-0"
                    >
                      <FaPencilAlt className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-700
                             transition-all duration-200 
                             transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                             focus:outline-none focus:ring-0"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
