import { Types } from "mongoose";
import Deduction, {
  DeductionType,
  CalculationMethod,
  TaxBracket,
} from "../models/Deduction.js";
import { ApiError } from "../utils/errorHandler.js";

export class DeductionService {
  // Standard PAYE tax brackets for Nigeria
  private static readonly DEFAULT_TAX_BRACKETS: TaxBracket[] = [
    { min: 0, max: 300000, rate: 7 },
    { min: 300001, max: 600000, rate: 11 },
    { min: 600001, max: 1100000, rate: 15 },
    { min: 1100001, max: 1600000, rate: 19 },
    { min: 1600001, max: 3200000, rate: 21 },
    { min: 3200001, max: null, rate: 24 },
  ];

  // Create statutory deductions (PAYE, Pension, NHF)
  static async createStatutoryDeductions(userId: Types.ObjectId) {
    try {
      // Create PAYE
      await Deduction.create({
        name: "PAYE Tax",
        type: DeductionType.STATUTORY,
        description: "Progressive Annual Income Tax",
        calculationMethod: CalculationMethod.PROGRESSIVE,
        value: 0, // Not used for PAYE since it uses brackets
        taxBrackets: this.DEFAULT_TAX_BRACKETS,
        createdBy: userId,
        updatedBy: userId,
      });

      // Create Pension
      await Deduction.create({
        name: "Pension",
        type: DeductionType.STATUTORY,
        description: "Employee Pension Contribution",
        calculationMethod: CalculationMethod.PERCENTAGE,
        value: 8, // 8% of basic salary
        createdBy: userId,
        updatedBy: userId,
      });

      // Create NHF
      await Deduction.create({
        name: "NHF",
        type: DeductionType.STATUTORY,
        description: "National Housing Fund",
        calculationMethod: CalculationMethod.PERCENTAGE,
        value: 2.5, // 2.5% of basic salary
        createdBy: userId,
        updatedBy: userId,
      });
    } catch (error) {
      throw new ApiError(500, "Failed to create statutory deductions");
    }
  }

  // Calculate PAYE tax
  static calculatePAYE(annualGross: number, taxBrackets: TaxBracket[]): number {
    let tax = 0;
    let remainingIncome = annualGross;

    for (const bracket of taxBrackets) {
      const { min, max, rate } = bracket;
      if (remainingIncome <= 0) break;

      const taxableInThisBracket = max
        ? Math.min(remainingIncome, max - min)
        : remainingIncome;

      tax += (taxableInThisBracket * rate) / 100;
      remainingIncome -= taxableInThisBracket;
    }

    return tax;
  }

  // Calculate pension deduction
  static calculatePension(basicSalary: number): number {
    return (basicSalary * 8) / 100; // 8% of basic salary
  }

  // Calculate NHF deduction
  static calculateNHF(basicSalary: number): number {
    return (basicSalary * 2.5) / 100; // 2.5% of basic salary
  }

  // Calculate all statutory deductions
  static calculateStatutoryDeductions(
    basicSalary: number,
    grossSalary: number
  ) {
    const annualGross = grossSalary * 12;
    const paye =
      this.calculatePAYE(annualGross, this.DEFAULT_TAX_BRACKETS) / 12; // Monthly PAYE
    const pension = this.calculatePension(basicSalary);
    const nhf = this.calculateNHF(basicSalary);

    return {
      paye,
      pension,
      nhf,
      total: paye + pension + nhf,
    };
  }

  // Create a voluntary deduction
  static async createVoluntaryDeduction(
    userId: Types.ObjectId,
    deductionData: {
      name: string;
      description: string;
      calculationMethod: CalculationMethod;
      value: number;
      effectiveDate?: Date;
    }
  ) {
    try {
      const voluntaryDeduction = await Deduction.create({
        ...deductionData,
        type: DeductionType.VOLUNTARY,
        createdBy: userId,
        updatedBy: userId,
      });
      return voluntaryDeduction;
    } catch (error) {
      throw new ApiError(500, "Failed to create voluntary deduction");
    }
  }

  // Calculate voluntary deduction amount
  static calculateVoluntaryDeduction(
    salary: number,
    deduction: {
      calculationMethod: CalculationMethod;
      value: number;
    }
  ): number {
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
  static async createCommonVoluntaryDeductions(userId: Types.ObjectId) {
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
}
