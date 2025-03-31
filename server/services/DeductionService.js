import { Types } from "mongoose";
import Deduction, {
  DeductionType,
  CalculationMethod,
} from "../models/Deduction.js";
import { ApiError } from "../utils/errorHandler.js";

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

      // Fetch all deductions after toggle
      const allDeductions = await Deduction.find();

      const result = {
        deduction,
        allDeductions: {
          statutory: allDeductions.filter(
            (d) => d.type === DeductionType.STATUTORY
          ),
          voluntary: allDeductions.filter(
            (d) => d.type === DeductionType.VOLUNTARY
          ),
        },
      };

      console.log("✅ Toggle complete with all deductions:", {
        toggledId: deduction._id,
        newStatus: deduction.isActive,
        totalDeductions: allDeductions.length,
      });

      return result;
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
        statutory: deductions.filter((d) => d.type === DeductionType.STATUTORY),
        voluntary: deductions.filter((d) => d.type === DeductionType.VOLUNTARY),
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
}
