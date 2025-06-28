import { Types } from "mongoose";
import Deduction, {
  DeductionType,
  CalculationMethod,
  AssignmentAction,
} from "../models/Deduction.js";
import { ApiError } from "../utils/errorHandler.js";
import Department from "../models/Department.js";
import { DeductionScope } from "../models/Deduction.js";
import User from "../models/User.js";
import PayrollStatisticsLogger from "../utils/payrollStatisticsLogger.js";

export class DeductionService {
  // Standard PAYE tax brackets for Nigeria
  static DEFAULT_TAX_BRACKETS = [
    { min: 0, max: 300000, rate: 7 },
    { min: 300001, max: 600000, rate: 11 },
    { min: 600001, max: 1100000, rate: 15 },
    { min: 1100001, max: 1600000, rate: 19 },
    { min: 1600001, max: 3200000, rate: 21 },
    { min: 3200001, max: null, rate: 24 },
  ];

  // Create statutory deductions (PAYE, Pension, NHF)
  static async createStatutoryDeductions(userId) {
    try {
      console.log(
        "📝 Creating/Updating statutory deductions for user:",
        userId
      );

      // Check for existing deductions
      const existingDeductions = await Deduction.find({
        type: DeductionType.STATUTORY,
      });

      const existingNames = existingDeductions.map((d) => d.name);
      const deductions = {};

      // PAYE
      if (!existingNames.includes("PAYE Tax")) {
        deductions.paye = await Deduction.create({
          name: "PAYE Tax",
          type: DeductionType.STATUTORY,
          description: "Progressive Annual Income Tax",
          calculationMethod: CalculationMethod.PROGRESSIVE,
          value: 0,
          taxBrackets: this.DEFAULT_TAX_BRACKETS,
          createdBy: userId,
          updatedBy: userId,
          isActive: true,
          effectiveDate: new Date(),
        });
        console.log("✅ PAYE created");
        await PayrollStatisticsLogger.logDeductionAction({
          action: "CREATE",
          deductionId: deductions.paye._id,
          userId,
          details: deductions.paye.toObject(),
        });
      } else {
        console.log("ℹ️ PAYE already exists");
      }

      // Pension
      if (!existingNames.includes("Pension")) {
        deductions.pension = await Deduction.create({
          name: "Pension",
          type: DeductionType.STATUTORY,
          description: "Employee Pension Contribution",
          calculationMethod: CalculationMethod.PERCENTAGE,
          value: 8,
          createdBy: userId,
          updatedBy: userId,
          isActive: true,
          effectiveDate: new Date(),
        });
        console.log("✅ Pension created");
        await PayrollStatisticsLogger.logDeductionAction({
          action: "CREATE",
          deductionId: deductions.pension._id,
          userId,
          details: deductions.pension.toObject(),
        });
      } else {
        console.log("ℹ️ Pension already exists");
      }

      // NHF
      if (!existingNames.includes("NHF")) {
        deductions.nhf = await Deduction.create({
          name: "NHF",
          type: DeductionType.STATUTORY,
          description: "National Housing Fund",
          calculationMethod: CalculationMethod.PERCENTAGE,
          value: 2.5,
          createdBy: userId,
          updatedBy: userId,
          isActive: true,
          effectiveDate: new Date(),
        });
        console.log("✅ NHF created");
        await PayrollStatisticsLogger.logDeductionAction({
          action: "CREATE",
          deductionId: deductions.nhf._id,
          userId,
          details: deductions.nhf.toObject(),
        });
      } else {
        console.log("ℹ️ NHF already exists");
      }

      // Return all statutory deductions (both existing and newly created)
      const allStatutoryDeductions = await Deduction.find({
        type: DeductionType.STATUTORY,
      });

      return {
        message: "Statutory deductions setup completed",
        deductions: allStatutoryDeductions,
      };
    } catch (error) {
      console.error("❌ Error in createStatutoryDeductions:", error);
      throw new ApiError(
        500,
        `Failed to setup statutory deductions: ${error.message}`
      );
    }
  }

  // Calculate PAYE tax
  static calculatePAYE(grossSalary) {
    try {
      console.log("🧮 Calculating PAYE for salary:", grossSalary);

      let totalTax = 0;
      let remainingSalary = grossSalary;

      for (const bracket of this.DEFAULT_TAX_BRACKETS) {
        if (remainingSalary <= 0) break;

        const bracketSize =
          bracket.min === 0 ? bracket.max : bracket.max - bracket.min + 1;

        const amountInBracket = Math.min(remainingSalary, bracketSize);
        const tax = (amountInBracket * bracket.rate) / 100;

        console.log(
          `Bracket ${bracket.min.toLocaleString()} - ${bracket.max.toLocaleString()}:`
        );
        console.log(`  Amount taxed: ${amountInBracket.toLocaleString()}`);
        console.log(`  Rate: ${bracket.rate}%`);
        console.log(`  Tax: ${tax.toLocaleString()}`);

        totalTax += tax;
        remainingSalary -= amountInBracket;
      }

      console.log(`✅ Total PAYE: ${totalTax.toLocaleString()}`);
      return totalTax;
    } catch (error) {
      console.error("❌ Error calculating PAYE:", error);
      return 0; // Return 0 instead of NaN
    }
  }

  // Calculate pension deduction
  static calculatePension(basicSalary) {
    return (basicSalary * 8) / 100; // ₦20,000
  }

  // Calculate NHF deduction
  static calculateNHF(basicSalary) {
    return (basicSalary * 2.5) / 100;
  }

  // Calculate all statutory deductions
  static calculateStatutoryDeductions(basicSalary, grossSalary) {
    try {
      // Calculate PAYE (tax)
      const monthlyPaye = this.calculatePAYE(grossSalary);
      console.log("PAYE:", monthlyPaye);

      // Calculate Pension (8% of basic salary)
      const pension = this.calculatePension(basicSalary);
      console.log("Pension:", pension);

      // Calculate NHF (2.5% of basic salary)
      const nhf = this.calculateNHF(basicSalary);
      console.log("NHF:", nhf);

      // Calculate total deductions
      const total = monthlyPaye + pension + nhf;
      console.log("Calculated Total:", total);

      return {
        paye: monthlyPaye,
        pension: pension,
        nhf: nhf,
        total: total,
      };
    } catch (error) {
      console.error("❌ Error calculating statutory deductions:", error);
      return {
        paye: 0,
        pension: 0,
        nhf: 0,
        total: 0,
      };
    }
  }

  // Create a voluntary deduction
  static async createVoluntaryDeduction(userId, data) {
    try {
      console.log("🔄 Service: Creating voluntary deduction");
      console.log("👤 User ID:", userId);
      console.log("📝 Deduction data:", data);

      // Validate the data
      if (!data.name || !data.calculationMethod || data.value === undefined) {
        console.log("❌ Service: Validation failed - missing required fields");
        throw new ApiError(400, "Missing required fields");
      }

      // Create the deduction
      const deductionData = {
        name: data.name,
        type: DeductionType.VOLUNTARY,
        description: data.description,
        calculationMethod: data.calculationMethod,
        value: data.value,
        effectiveDate: data.effectiveDate || new Date(),
        category: data.category || "general",
        scope: data.scope || DeductionScope.COMPANY_WIDE,
        department: data.department,
        assignedEmployees: data.assignedEmployees,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      };

      console.log("📦 Service: Prepared deduction data:", deductionData);

      const deduction = await Deduction.create(deductionData);
      console.log("✅ Service: Deduction created:", deduction);

      return deduction;
    } catch (error) {
      console.error("❌ Service Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      if (error.code === 11000) {
        throw new ApiError(400, "A deduction with this name already exists");
      }

      console.error("Full error object:", error);

      throw new ApiError(
        500,
        `Failed to create voluntary deduction: ${error.message}`
      );
    }
  }

  // Calculate voluntary deduction amount
  static calculateVoluntaryDeduction(salary, deduction) {
    switch (deduction.calculationMethod) {
      case CalculationMethod.FIXED:
        return deduction.value;
      case CalculationMethod.PERCENTAGE:
        return (salary * deduction.value) / 100;
      default:
        throw new ApiError(
          400,
          "Invalid calculation method for voluntary deduction"
        );
    }
  }

  // Get all active deductions for an employee
  static async getActiveDeductions() {
    try {
      const deductions = await Deduction.find({ isActive: true });
      return {
        statutory: deductions.filter((d) => d.type === DeductionType.STATUTORY),
        voluntary: deductions.filter((d) => d.type === DeductionType.VOLUNTARY),
      };
    } catch (error) {
      throw new ApiError(500, "Failed to fetch deductions");
    }
  }

  // Add this new method to create common voluntary deductions
  static async createCommonVoluntaryDeductions(userId) {
    try {
      // Create Loan Repayment deduction
      await Deduction.create({
        name: "Loan Repayment",
        type: DeductionType.VOLUNTARY,
        description: "Monthly loan repayment deduction",
        calculationMethod: CalculationMethod.FIXED,
        value: 20000, // ₦20,000 fixed amount
        createdBy: userId,
        updatedBy: userId,
      });

      // Create Union Dues deduction
      await Deduction.create({
        name: "Union Dues",
        type: DeductionType.VOLUNTARY,
        description: "Monthly union membership dues",
        calculationMethod: CalculationMethod.PERCENTAGE,
        value: 1, // 1% of basic salary
        createdBy: userId,
        updatedBy: userId,
      });

      // Create Insurance Premium deduction
      await Deduction.create({
        name: "Insurance Premium",
        type: DeductionType.VOLUNTARY,
        description: "Monthly health insurance premium",
        calculationMethod: CalculationMethod.FIXED,
        value: 15000, // ₦15,000 fixed amount
        createdBy: userId,
        updatedBy: userId,
      });

      // Create Cooperative Contribution deduction
      await Deduction.create({
        name: "Cooperative Contribution",
        type: DeductionType.VOLUNTARY,
        description: "Monthly cooperative society contribution",
        calculationMethod: CalculationMethod.PERCENTAGE,
        value: 5, // 5% of basic salary
        createdBy: userId,
        updatedBy: userId,
      });
    } catch (error) {
      throw new ApiError(500, "Failed to create common voluntary deductions");
    }
  }

  static async toggleDeductionStatus(deductionId, userId) {
    try {
      console.log("🔄 Toggling deduction status for:", deductionId);

      // Toggle the status
      const deduction = await Deduction.findOneAndUpdate(
        { _id: deductionId },
        [
          {
            $set: {
              isActive: { $not: "$isActive" },
              updatedBy: userId,
            },
          },
        ],
        { new: true }
      );

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      console.log("✅ Toggle complete:", {
        toggledId: deduction._id,
        newStatus: deduction.isActive,
      });

      return { deduction }; // Only return the updated deduction
    } catch (error) {
      console.error("❌ Toggle status failed:", error);
      throw new ApiError(
        500,
        `Failed to toggle deduction status: ${error.message}`
      );
    }
  }

  static async getAllDeductions() {
    try {
      console.log("📥 Fetching all deductions (active and inactive)");

      const deductions = await Deduction.find();

      const result = {
        statutory: deductions.filter(
          (d) => d.type.toLowerCase() === DeductionType.STATUTORY.toLowerCase()
        ),
        voluntary: deductions.filter(
          (d) => d.type.toLowerCase() === DeductionType.VOLUNTARY.toLowerCase()
        ),
      };

      console.log("✅ Deductions fetched:", {
        statutoryCount: result.statutory.length,
        voluntaryCount: result.voluntary.length,
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to fetch deductions:", error);
      throw new ApiError(500, "Failed to fetch deductions");
    }
  }

  static async createCustomStatutoryDeduction(userId, data) {
    try {
      console.log("🔄 Service: Creating custom statutory deduction");
      console.log("👤 User ID:", userId);
      console.log("📝 Deduction data:", data);

      // Check if deduction with same name exists
      const existingDeduction = await Deduction.findOne({ name: data.name });
      if (existingDeduction) {
        throw new ApiError(400, "A deduction with this name already exists");
      }

      // Create the statutory deduction
      const deduction = await Deduction.create({
        ...data,
        type: DeductionType.STATUTORY,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      });

      console.log("✅ Service: Custom statutory deduction created:", deduction);
      return deduction;
    } catch (error) {
      console.error("❌ Service Error:", error);
      throw new ApiError(
        500,
        `Failed to create custom statutory deduction: ${error.message}`
      );
    }
  }

  /**
   * Calculate all deductions for an employee's payroll
   * @param {Object} params
   * @param {number} params.basicSalary - Employee's basic salary
   * @param {number} params.grossSalary - Employee's gross salary
   * @param {string} params.employeeId - Employee's ID
   * @param {string} params.departmentId - Employee's department ID
   * @returns {Promise<Object>} Calculated deductions
   */
  static async calculateAllDeductions({
    basicSalary,
    grossSalary,
    employeeId,
    departmentId,
  }) {
    try {
      console.log("🧮 Calculating deductions for employee:", employeeId);

      // First, get the user with their deduction preferences
      const user = await User.findById(employeeId);
      if (!user) {
        throw new ApiError(404, "Employee not found");
      }

      // Get all active deductions
      const activeDeductions = await Deduction.find({
        isActive: true,
        $or: [
          { scope: DeductionScope.COMPANY_WIDE },
          {
            scope: DeductionScope.DEPARTMENT,
            department: departmentId,
          },
          {
            scope: DeductionScope.INDIVIDUAL,
            assignedEmployees: employeeId,
          },
        ],
      });
      console.log(
        "🔍 [DeductionService] Active deductions fetched:",
        activeDeductions.map((d) => ({
          name: d.name,
          type: d.type,
          scope: d.scope,
          department: d.department,
          value: d.value,
          calculationMethod: d.calculationMethod,
        }))
      );

      // Separate deductions by type
      const statutoryDeductions = activeDeductions.filter(
        (d) => d.type === DeductionType.STATUTORY
      );
      const voluntaryDeductions = activeDeductions.filter(
        (d) => d.type === DeductionType.VOLUNTARY
      );
      console.log(
        "🔍 [DeductionService] Statutory deductions:",
        statutoryDeductions.map((d) => d.name)
      );
      console.log(
        "🔍 [DeductionService] Voluntary deductions:",
        voluntaryDeductions.map((d) => d.name)
      );

      // Calculate statutory deductions based on opt-in status and mandatory flag
      const statutory = await this.processStatutoryDeductions(
        statutoryDeductions,
        basicSalary,
        grossSalary,
        user.deductionPreferences.statutory
      );
      console.log(
        "🧾 [DeductionService] Statutory deductions breakdown:",
        statutory
      );

      // Calculate voluntary deductions based on assignments
      const voluntary = await this.processVoluntaryDeductions(
        voluntaryDeductions,
        basicSalary,
        user.deductionPreferences.voluntary
      );
      console.log(
        "🧾 [DeductionService] Voluntary deductions breakdown:",
        voluntary
      );

      // Calculate total deductions
      const totalStatutory = Object.values(statutory).reduce(
        (sum, deduction) => sum + deduction.amount,
        0
      );
      const totalVoluntary = Object.values(voluntary).reduce(
        (sum, deduction) => sum + deduction.amount,
        0
      );

      return {
        statutory,
        voluntary,
        totals: {
          statutory: totalStatutory,
          voluntary: totalVoluntary,
          total: totalStatutory + totalVoluntary,
        },
      };
    } catch (error) {
      console.error("❌ Error calculating deductions:", error);
      throw new ApiError(500, "Failed to calculate deductions");
    }
  }

  /**
   * Process statutory deductions
   * @private
   */
  static async processStatutoryDeductions(
    deductions,
    basicSalary,
    grossSalary,
    userStatutoryPreferences
  ) {
    const result = {};
    console.log(
      "🔍 [DeductionService] Processing statutory deductions:",
      deductions.map((d) => d.name)
    );
    for (const deduction of deductions) {
      if (!deduction.isActive) continue;

      // Handle mandatory statutory deductions (PAYE, Pension, NHF)
      if (deduction.isMandatory) {
        const amount = this.calculateStatutoryDeduction(
          basicSalary,
          grossSalary,
          deduction
        );
        result[deduction.name] = {
          amount,
          category: deduction.category,
          calculationMethod: deduction.calculationMethod,
          status: "active",
          type: "mandatory",
          isMandatory: true,
          isCustom: false,
        };
        continue;
      }

      // Handle custom statutory deductions
      if (deduction.isCustom) {
        // Check if user has opted into this custom statutory deduction
        const isOptedIn = userStatutoryPreferences.customStatutory.some(
          (d) => d.deduction.toString() === deduction._id.toString() && d.opted
        );

        if (!isOptedIn) {
          result[deduction.name] = {
            amount: 0,
            category: deduction.category,
            calculationMethod: deduction.calculationMethod,
            status: "opted-out",
            type: "custom",
            isMandatory: false,
            isCustom: true,
            optedOutAt: userStatutoryPreferences.customStatutory.find(
              (d) => d.deduction.toString() === deduction._id.toString()
            )?.optedAt,
            reason: userStatutoryPreferences.customStatutory.find(
              (d) => d.deduction.toString() === deduction._id.toString()
            )?.reason,
          };
          continue;
        }

        const amount = this.calculateStatutoryDeduction(
          basicSalary,
          grossSalary,
          deduction
        );
        result[deduction.name] = {
          amount,
          category: deduction.category,
          calculationMethod: deduction.calculationMethod,
          status: "active",
          type: "custom",
          isMandatory: false,
          isCustom: true,
        };
        continue;
      }

      // Handle standard non-mandatory statutory deductions
      const isOptedIn = userStatutoryPreferences.customStatutory.some(
        (d) => d.deduction.toString() === deduction._id.toString() && d.opted
      );

      if (!isOptedIn) {
        result[deduction.name] = {
          amount: 0,
          category: deduction.category,
          calculationMethod: deduction.calculationMethod,
          status: "opted-out",
          type: "standard",
          isMandatory: false,
          isCustom: false,
        };
        continue;
      }

      const amount = this.calculateStatutoryDeduction(
        basicSalary,
        grossSalary,
        deduction
      );
      result[deduction.name] = {
        amount,
        category: deduction.category,
        calculationMethod: deduction.calculationMethod,
        status: "active",
        type: "standard",
        isMandatory: false,
        isCustom: false,
      };
    }

    return result;
  }

  /**
   * Calculate statutory deduction amount
   * @private
   */
  static calculateStatutoryDeduction(basicSalary, grossSalary, deduction) {
    switch (deduction.calculationMethod) {
      case CalculationMethod.PERCENTAGE:
        return (grossSalary * deduction.value) / 100;
      case CalculationMethod.PROGRESSIVE:
        return this.calculateProgressiveTax(grossSalary, deduction.taxBrackets);
      case CalculationMethod.FIXED:
        return deduction.value;
      default:
        return 0;
    }
  }

  /**
   * Calculate progressive tax based on tax brackets
   * @private
   */
  static calculateProgressiveTax(amount, taxBrackets) {
    let totalTax = 0;
    let remainingAmount = amount;

    for (const bracket of taxBrackets) {
      if (remainingAmount <= 0) break;

      const taxableInThisBracket = bracket.max
        ? Math.min(remainingAmount, bracket.max - bracket.min)
        : remainingAmount;

      if (taxableInThisBracket > 0) {
        totalTax += (taxableInThisBracket * bracket.rate) / 100;
        remainingAmount -= taxableInThisBracket;
      }
    }

    return totalTax;
  }

  /**
   * Process voluntary deductions
   * @private
   */
  static async processVoluntaryDeductions(
    deductions,
    basicSalary,
    userVoluntaryPreferences
  ) {
    const result = {};
    console.log(
      "🔍 [DeductionService] Processing voluntary deductions:",
      deductions.map((d) => d.name)
    );
    // Process standard voluntary deductions
    for (const deduction of deductions) {
      if (!deduction.isActive) continue;

      // Check if this deduction is in user's voluntary preferences
      const isStandard = userVoluntaryPreferences.standardVoluntary.some(
        (d) => d.deduction.toString() === deduction._id.toString() && d.opted
      );

      const isCustom = userVoluntaryPreferences.customVoluntary.some(
        (d) => d.deduction.toString() === deduction._id.toString() && d.opted
      );

      if (!isStandard && !isCustom) continue;

      const amount = this.calculateVoluntaryDeduction(basicSalary, deduction);
      result[deduction.name] = {
        amount,
        category: deduction.category,
        calculationMethod: deduction.calculationMethod,
        status: "active",
        type: isStandard ? "standard" : "custom",
        isMandatory: false,
      };
    }

    return result;
  }

  /**
   * Calculate voluntary deduction amount
   * @private
   */
  static calculateVoluntaryDeduction(basicSalary, deduction) {
    switch (deduction.calculationMethod) {
      case CalculationMethod.PERCENTAGE:
        return (basicSalary * deduction.value) / 100;
      case CalculationMethod.FIXED:
        return deduction.value;
      default:
        return 0;
    }
  }

  /**
   * Assign voluntary deduction to employee
   */
  static async assignDeductionToEmployee(deductionId, employeeId, assignedBy) {
    try {
      const deduction = await Deduction.findById(deductionId);

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (deduction.type !== DeductionType.VOLUNTARY) {
        throw new ApiError(400, "Only voluntary deductions can be assigned");
      }

      if (!deduction.isActive) {
        throw new ApiError(400, "Cannot assign inactive deduction");
      }

      if (deduction.assignedEmployees.includes(employeeId)) {
        throw new ApiError(400, "Deduction already assigned to employee");
      }

      deduction.assignedEmployees.push(employeeId);

      // Add to history
      deduction.assignmentHistory.push({
        employee: employeeId,
        action: AssignmentAction.ASSIGNED,
        date: new Date(),
        by: assignedBy,
      });

      deduction.updatedBy = assignedBy;
      await deduction.save();

      return deduction;
    } catch (error) {
      throw new ApiError(500, `Failed to assign deduction: ${error.message}`);
    }
  }

  /**
   * Remove voluntary deduction from employee
   */
  static async removeDeductionFromEmployee(
    deductionId,
    employeeId,
    removedBy,
    reason = ""
  ) {
    try {
      const deduction = await Deduction.findById(deductionId);

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (deduction.type !== DeductionType.VOLUNTARY) {
        throw new ApiError(400, "Only voluntary deductions can be removed");
      }

      deduction.assignedEmployees = deduction.assignedEmployees.filter(
        (id) => id.toString() !== employeeId
      );

      // Add to history
      deduction.assignmentHistory.push({
        employee: employeeId,
        action: AssignmentAction.REMOVED,
        date: new Date(),
        by: removedBy,
        reason,
      });

      deduction.updatedBy = removedBy;
      await deduction.save();

      return deduction;
    } catch (error) {
      throw new ApiError(500, `Failed to remove deduction: ${error.message}`);
    }
  }

  /**
   * Create department-specific deduction
   * @param {string} userId - Admin/SuperAdmin ID creating the deduction
   * @param {string} departmentId - Department ID
   * @param {Object} data - Deduction data
   */
  static async createDepartmentDeduction(userId, departmentId, data) {
    try {
      console.log("🔄 Creating department-specific deduction");
      console.log("📝 Department:", departmentId);

      // Validate department exists (assuming Department model exists)
      const department = await Department.findById(departmentId);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      // Create deduction with department scope
      const deductionData = {
        ...data,
        scope: DeductionScope.DEPARTMENT,
        department: departmentId,
        type: data.type || DeductionType.STATUTORY, // Can be statutory or voluntary
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        effectiveDate: data.effectiveDate || new Date(),
      };

      const deduction = await Deduction.create(deductionData);
      console.log("✅ Department deduction created:", deduction.name);

      return deduction;
    } catch (error) {
      console.error("❌ Error creating department deduction:", error);
      throw new ApiError(
        500,
        `Failed to create department deduction: ${error.message}`
      );
    }
  }

  /**
   * Get deductions for a specific department
   * @param {string} departmentId
   * @returns {Promise<Object>} Department deductions
   */
  static async getDepartmentDeductions(departmentId) {
    try {
      // Get all deductions that are either company-wide or specific to this department
      const deductions = await Deduction.find({
        $or: [
          { scope: DeductionScope.COMPANY_WIDE },
          {
            scope: DeductionScope.DEPARTMENT,
            department: departmentId,
          },
        ],
        isActive: true,
      });

      // Group deductions by type and scope
      return {
        statutory: deductions.filter((d) => d.type === DeductionType.STATUTORY),
        voluntary: deductions.filter((d) => d.type === DeductionType.VOLUNTARY),
        departmentSpecific: deductions.filter(
          (d) => d.scope === DeductionScope.DEPARTMENT
        ),
      };
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to fetch department deductions: ${error.message}`
      );
    }
  }

  /**
   * Calculate department-specific deductions
   * @param {Object} params
   * @param {number} params.basicSalary
   * @param {number} params.grossSalary
   * @param {string} params.departmentId
   */
  static async calculateDepartmentDeductions({
    basicSalary,
    grossSalary,
    departmentId,
  }) {
    try {
      console.log(
        "🔍 [DeductionService] Calculating department-specific deductions for department:",
        departmentId
      );
      // Get active department deductions
      const departmentDeductions = await Deduction.find({
        scope: DeductionScope.DEPARTMENT,
        department: departmentId,
        isActive: true,
      });

      const result = {};

      for (const deduction of departmentDeductions) {
        let amount = 0;

        // Calculate based on method
        switch (deduction.calculationMethod) {
          case CalculationMethod.FIXED:
            amount = deduction.value;
            break;

          case CalculationMethod.PERCENTAGE:
            const base = deduction.useGrossSalary ? grossSalary : basicSalary;
            amount = (base * deduction.value) / 100;
            break;

          case CalculationMethod.PROGRESSIVE:
            amount = this.calculateProgressiveDeduction(
              grossSalary,
              deduction.taxBrackets
            );
            break;
        }

        result[deduction.name] = {
          amount,
          type: deduction.type,
          category: deduction.category,
          calculationMethod: deduction.calculationMethod,
        };
      }

      console.log(
        "🧾 [DeductionService] Department-specific deductions breakdown:",
        result
      );
      return result;
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to calculate department deductions: ${error.message}`
      );
    }
  }

  /**
   * Assign voluntary deduction to multiple employees
   * @param {string} deductionId - Deduction ID
   * @param {Array} employeeIds - Array of employee IDs
   * @param {string} assignedBy - Assigned by user ID
   * @returns {Promise<Object>} Result of the operation
   */
  static async assignDeductionToMultipleEmployees(
    deductionId,
    employeeIds,
    assignedBy
  ) {
    try {
      console.log("🔄 Assigning deduction to multiple employees:", {
        deductionId,
        employeeCount: employeeIds.length,
      });

      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (deduction.type !== DeductionType.VOLUNTARY) {
        throw new ApiError(400, "Only voluntary deductions can be assigned");
      }

      if (!deduction.isActive) {
        throw new ApiError(400, "Cannot assign inactive deduction");
      }

      // Filter out already assigned employees
      const newEmployeeIds = employeeIds.filter(
        (id) => !deduction.assignedEmployees.includes(id)
      );

      if (newEmployeeIds.length === 0) {
        return {
          message: "All employees are already assigned to this deduction",
          deduction,
        };
      }

      // Add to assigned employees
      deduction.assignedEmployees.push(...newEmployeeIds);

      // Add to assignment history
      const historyEntries = newEmployeeIds.map((employeeId) => ({
        employee: employeeId,
        action: AssignmentAction.ASSIGNED,
        date: new Date(),
        by: assignedBy,
      }));

      deduction.assignmentHistory.push(...historyEntries);
      deduction.updatedBy = assignedBy;

      await deduction.save();

      console.log("✅ Batch assignment completed:", {
        totalAssigned: newEmployeeIds.length,
        deductionName: deduction.name,
      });

      return {
        message: `Successfully assigned deduction to ${newEmployeeIds.length} employees`,
        deduction,
      };
    } catch (error) {
      console.error("❌ Batch assignment failed:", error);
      throw new ApiError(500, `Failed to assign deduction: ${error.message}`);
    }
  }

  /**
   * Remove voluntary deduction from multiple employees
   * @param {string} deductionId - Deduction ID
   * @param {Array} employeeIds - Array of employee IDs
   * @param {string} removedBy - Removed by user ID
   * @param {string} reason - Optional reason for removal
   * @returns {Promise<Object>} Result of the operation
   */
  static async removeDeductionFromMultipleEmployees(
    deductionId,
    employeeIds,
    removedBy,
    reason = ""
  ) {
    try {
      console.log("🔄 Removing deduction from multiple employees:", {
        deductionId,
        employeeCount: employeeIds.length,
      });

      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (deduction.type !== DeductionType.VOLUNTARY) {
        throw new ApiError(400, "Only voluntary deductions can be removed");
      }

      // Filter employees who actually have the deduction
      const employeesToRemove = employeeIds.filter((id) =>
        deduction.assignedEmployees.includes(id)
      );

      if (employeesToRemove.length === 0) {
        return {
          message: "None of the specified employees have this deduction",
          deduction,
        };
      }

      // Remove from assigned employees
      deduction.assignedEmployees = deduction.assignedEmployees.filter(
        (id) => !employeesToRemove.includes(id.toString())
      );

      // Add to assignment history
      const historyEntries = employeesToRemove.map((employeeId) => ({
        employee: employeeId,
        action: AssignmentAction.REMOVED,
        date: new Date(),
        by: removedBy,
        reason,
      }));

      deduction.assignmentHistory.push(...historyEntries);
      deduction.updatedBy = removedBy;

      await deduction.save();

      console.log("✅ Batch removal completed:", {
        totalRemoved: employeesToRemove.length,
        deductionName: deduction.name,
      });

      return {
        message: `Successfully removed deduction from ${employeesToRemove.length} employees`,
        deduction,
      };
    } catch (error) {
      console.error("❌ Batch removal failed:", error);
      throw new ApiError(500, `Failed to remove deduction: ${error.message}`);
    }
  }

  static async getApplicableDeductions(
    currentPeriodType,
    currentPeriodData,
    scopeFilter = {}
  ) {
    const {
      currentMonth,
      currentYear,
      currentWeek,
      currentBiweek,
      currentQuarter,
    } = currentPeriodData;

    let payrollPeriodStartDate;
    if (currentPeriodType === "monthly") {
      payrollPeriodStartDate = new Date(currentYear, currentMonth - 1, 1);
    } else if (currentPeriodType === "weekly") {
      // Calculate start of specific week
      const startOfYear = new Date(currentYear, 0, 1);
      const days = (currentWeek - 1) * 7;
      payrollPeriodStartDate = new Date(
        startOfYear.getTime() + days * 24 * 60 * 60 * 1000
      );
    } else if (currentPeriodType === "biweekly") {
      // Calculate start of specific biweek
      const startOfYear = new Date(currentYear, 0, 1);
      const days = (currentBiweek - 1) * 14;
      payrollPeriodStartDate = new Date(
        startOfYear.getTime() + days * 24 * 60 * 60 * 1000
      );
    } else if (currentPeriodType === "quarterly") {
      // Calculate start of specific quarter
      const quarterStartMonth = (currentQuarter - 1) * 3;
      payrollPeriodStartDate = new Date(currentYear, quarterStartMonth, 1);
    } else if (currentPeriodType === "annual") {
      payrollPeriodStartDate = new Date(currentYear, 0, 1); // January 1st
    }

    // Calculate payroll period end date to match allowance logic
    let payrollPeriodEndDate;
    if (currentPeriodType === "monthly") {
      payrollPeriodEndDate = new Date(currentYear, currentMonth, 0); // Last day of the month
    } else if (currentPeriodType === "weekly") {
      payrollPeriodEndDate = new Date(payrollPeriodStartDate);
      payrollPeriodEndDate.setDate(payrollPeriodStartDate.getDate() + 6);
    } else if (currentPeriodType === "biweekly") {
      payrollPeriodEndDate = new Date(payrollPeriodStartDate);
      payrollPeriodEndDate.setDate(payrollPeriodStartDate.getDate() + 13);
    } else if (currentPeriodType === "quarterly") {
      payrollPeriodEndDate = new Date(currentYear, currentQuarter * 3, 0);
    } else if (currentPeriodType === "annual") {
      payrollPeriodEndDate = new Date(currentYear, 11, 31); // December 31st
    }

    // Build period filter for one-off deductions
    const periodFilter = {
      $or: [
        { deductionDuration: { $ne: "one-off" } }, // Ongoing deductions always apply
        {
          deductionDuration: "one-off",
          "appliesToPeriod.periodType": currentPeriodType,
          ...(currentPeriodType === "monthly" && {
            "appliesToPeriod.month": currentMonth,
            "appliesToPeriod.year": currentYear,
          }),
          ...(currentPeriodType === "weekly" && {
            "appliesToPeriod.week": currentWeek,
            "appliesToPeriod.year": currentYear,
          }),
          ...(currentPeriodType === "biweekly" && {
            "appliesToPeriod.biweek": currentBiweek,
            "appliesToPeriod.year": currentYear,
          }),
          ...(currentPeriodType === "quarterly" && {
            "appliesToPeriod.quarter": currentQuarter,
            "appliesToPeriod.year": currentYear,
          }),
          ...(currentPeriodType === "annual" && {
            "appliesToPeriod.year": currentYear,
          }),
        },
      ],
    };

    // Build scope filter based on scopeFilter parameter
    const scopeFilterQuery = {
      $or: [
        { scope: DeductionScope.COMPANY_WIDE },
        ...(scopeFilter.departmentId
          ? [
              {
                scope: DeductionScope.DEPARTMENT,
                department: scopeFilter.departmentId,
              },
            ]
          : []),
        ...(scopeFilter.employeeId
          ? [
              {
                scope: DeductionScope.INDIVIDUAL,
                assignedEmployees: scopeFilter.employeeId,
              },
            ]
          : []),
      ],
    };

    console.log("🔍 getApplicableDeductions debug:", {
      currentPeriodType,
      currentPeriodData,
      scopeFilter,
      payrollPeriodStartDate: payrollPeriodStartDate.toISOString(),
      payrollPeriodEndDate: payrollPeriodEndDate.toISOString(),
      scopeFilterQuery,
    });

    // Build the complete query
    const query = {
      isActive: true,
      // Match allowance logic: deductions effective during the payroll period
      $or: [
        // Deductions with no effective date (always apply)
        { effectiveDate: { $exists: false } },
        // Deductions effective on or before the end of payroll period
        { effectiveDate: { $lte: payrollPeriodEndDate } },
      ],
      // If deduction has expiry date, it should not have expired before payroll period start
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: payrollPeriodStartDate } },
      ],
      ...periodFilter,
      ...scopeFilterQuery,
    };

    console.log("🔍 Final deduction query:", JSON.stringify(query, null, 2));

    const deductions = await Deduction.find(query);

    console.log("🔍 Found applicable deductions:", {
      total: deductions.length,
      deductions: deductions.map((d) => ({
        name: d.name,
        type: d.type,
        scope: d.scope,
        department: d.department,
        isActive: d.isActive,
        value: d.value,
        calculationMethod: d.calculationMethod,
        effectiveDate: d.effectiveDate,
        expiryDate: d.expiryDate,
        deductionDuration: d.deductionDuration,
        appliesToPeriod: d.appliesToPeriod,
      })),
    });

    return deductions;
  }
}
