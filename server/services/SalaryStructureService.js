import { Types } from "mongoose";
import SalaryGrade from "../models/SalaryStructure.js";
import { ApiError } from "../utils/errorHandler.js";
import { AllowanceService } from "./AllowanceService.js";
import { DeductionService } from "./DeductionService.js";
import { BonusService } from "./BonusService.js";

export class SalaryStructureService {
  // Create a new salary grade
  static async createSalaryGrade(data) {
    try {
      console.log("📝 Creating new salary grade:", data.level);

      const existingGrade = await SalaryGrade.findOne({ level: data.level });
      if (existingGrade) {
        throw new ApiError(400, "Salary grade level already exists");
      }

      const salaryGrade = await SalaryGrade.create({
        ...data,
        updatedBy: data.createdBy,
      });

      console.log("✅ Salary grade created successfully");
      return await salaryGrade.populate([
        { path: "department", select: "name code" },
        { path: "createdBy", select: "firstName lastName" },
      ]);
    } catch (error) {
      console.error("❌ Error creating salary grade:", error);
      throw new ApiError(
        500,
        `Failed to create salary grade: ${error.message}`
      );
    }
  }

  // Update a salary grade
  static async updateSalaryGrade(gradeId, data, updatedBy) {
    try {
      console.log("📝 Updating salary grade:", gradeId);

      const salaryGrade = await SalaryGrade.findById(gradeId);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      Object.assign(salaryGrade, {
        ...data,
        updatedBy,
      });

      await salaryGrade.save();
      console.log("✅ Salary grade updated successfully");

      return await salaryGrade.populate([
        { path: "department", select: "name code" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);
    } catch (error) {
      console.error("❌ Error updating salary grade:", error);
      throw new ApiError(
        500,
        `Failed to update salary grade: ${error.message}`
      );
    }
  }

  // Get all salary grades with department filter
  static async getAllSalaryGrades(filters = {}) {
    try {
      console.log("🔍 Getting all salary grades with filters:", filters);
      const query = { ...filters };

      if (filters.department === null) {
        query.department = { $exists: false };
      } else if (filters.department) {
        query.department = filters.department;
      }

      const grades = await SalaryGrade.find(query)
        .sort({ level: 1 })
        .populate([
          { path: "createdBy", select: "firstName lastName" },
          { path: "updatedBy", select: "firstName lastName" },
          { path: "department", select: "name code" },
        ]);

      console.log(`✅ Found ${grades.length} salary grades`);
      return grades;
    } catch (error) {
      console.error("❌ Error fetching salary grades:", error);
      throw new ApiError(500, "Failed to fetch salary grades");
    }
  }

  // Get salary grades by department
  static async getSalaryGradesByDepartment(departmentId) {
    try {
      console.log("🔍 Getting salary grades for department:", departmentId);

      const query = departmentId
        ? { department: departmentId }
        : { department: { $exists: false } };

      const grades = await SalaryGrade.find(query)
        .sort({ level: 1 })
        .populate([
          { path: "department", select: "name code" },
          { path: "createdBy", select: "firstName lastName" },
          { path: "updatedBy", select: "firstName lastName" },
        ]);

      console.log(`✅ Found ${grades.length} salary grades for department`);
      return grades;
    } catch (error) {
      console.error("❌ Error fetching department salary grades:", error);
      throw new ApiError(500, "Failed to fetch department salary grades");
    }
  }

  // Get salary grade by ID
  static async getSalaryGradeById(id) {
    try {
      console.log("\n🔍 Getting salary grade by ID:", id);

      const salaryGrade = await SalaryGrade.findById(id).populate([
        { path: "createdBy", select: "firstName lastName" },
        { path: "updatedBy", select: "firstName lastName" },
        { path: "department", select: "name code" },
      ]);

      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      console.log("📋 Salary Grade Details:", {
        id: salaryGrade._id,
        level: salaryGrade.level,
        basicSalary: salaryGrade.basicSalary,
        components:
          salaryGrade.components?.map((c) => ({
            name: c.name,
            type: c.type,
            calculationMethod: c.calculationMethod,
            value: c.value,
            isActive: c.isActive,
          })) || [],
        componentsCount: salaryGrade.components?.length || 0,
      });

      console.log("✅ Salary grade found");
      return salaryGrade;
    } catch (error) {
      console.error("❌ Error fetching salary grade:", error);
      throw new ApiError(500, "Failed to fetch salary grade");
    }
  }

  // Add component to salary grade
  static async addComponent(gradeId, component, updatedBy) {
    try {
      console.log("📝 Adding component to salary grade:", gradeId);

      const salaryGrade = await SalaryGrade.findById(gradeId);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      const newComponent = {
        ...component,
        _id: new Types.ObjectId(),
        createdBy: updatedBy,
        updatedBy,
      };

      salaryGrade.components.push(newComponent);
      salaryGrade.updatedBy = updatedBy;

      await salaryGrade.save();
      console.log("✅ Component added successfully");
      return salaryGrade;
    } catch (error) {
      console.error("❌ Error adding component:", error);
      throw new ApiError(500, `Failed to add component: ${error.message}`);
    }
  }

  // Update component in salary grade
  static async updateComponent(gradeId, componentId, updates, updatedBy) {
    try {
      console.log("📝 Updating component in salary grade:", gradeId);

      const salaryGrade = await SalaryGrade.findById(gradeId);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      const componentIndex = salaryGrade.components.findIndex(
        (c) => c._id.toString() === componentId
      );

      if (componentIndex === -1) {
        throw new ApiError(404, "Component not found in salary grade");
      }

      const existingComponent = salaryGrade.components[componentIndex];
      const updatedComponent = {
        ...existingComponent,
        ...updates,
        _id: existingComponent._id,
        updatedBy,
        createdBy: existingComponent.createdBy,
      };

      salaryGrade.components[componentIndex] = updatedComponent;
      salaryGrade.updatedBy = updatedBy;
      await salaryGrade.save();

      console.log("✅ Component updated successfully");
      return salaryGrade;
    } catch (error) {
      console.error("❌ Error updating component:", error);
      throw new ApiError(500, `Failed to update component: ${error.message}`);
    }
  }

  // Calculate total salary for a grade
  static async calculateTotalSalary(salaryGrade) {
    try {
      console.log(
        "\n🧮 Calculating total salary for grade:",
        salaryGrade.level
      );

      if (!salaryGrade || !salaryGrade.components) {
        console.log("⚠️ Invalid salary grade data");
        return {
          basicSalary: 0,
          totalAllowances: 0,
          totalDeductions: 0,
          totalBonuses: 0,
          grossSalary: 0,
          netSalary: 0,
          components: [],
          allowances: {
            gradeAllowances: [],
            additionalAllowances: [],
            totalAllowances: 0,
          },
        };
      }

      const basicSalary = Number(salaryGrade.basicSalary);
      let totalAllowances = 0;
      const gradeAllowances = [];

      console.log("\n📋 Salary Grade Data:", {
        level: salaryGrade.level,
        basicSalary: basicSalary,
        componentsCount: salaryGrade.components.length,
        components: salaryGrade.components.map((c) => ({
          name: c.name,
          type: c.type,
          calculationMethod: c.calculationMethod,
          value: c.value,
          isActive: c.isActive,
        })),
      });

      // Process grade components
      console.log("\n📋 Processing Components:");
      salaryGrade.components.forEach((component) => {
        if (!component.isActive) {
          console.log(`⏸️ Skipping inactive component: ${component.name}`);
          return;
        }

        let amount = 0;
        console.log(`\n🔍 Processing: ${component.name}`);
        console.log(`📊 Details:`, {
          type: component.type,
          calculationMethod: component.calculationMethod,
          value: component.value,
          isActive: component.isActive,
        });

        if (component.type === "allowance") {
          if (component.calculationMethod === "fixed") {
            amount = Number(component.value);
            console.log(`💰 Fixed Amount: ₦${amount.toLocaleString()}`);
          } else if (component.calculationMethod === "percentage") {
            // For percentage, value is the percentage (e.g., 30 for 30%)
            amount = Math.round((basicSalary * Number(component.value)) / 100);
            console.log(`📊 Percentage Calculation:`);
            console.log(`   Base: ₦${basicSalary.toLocaleString()}`);
            console.log(`   Rate: ${component.value}%`);
            console.log(`   Result: ₦${amount.toLocaleString()}`);
          }

          totalAllowances += amount;
          gradeAllowances.push({
            name: component.name,
            type: component.type,
            value: component.value,
            amount: amount,
          });
          console.log(`📈 Running total: ₦${totalAllowances.toLocaleString()}`);
        }
      });

      const grossSalary = basicSalary + totalAllowances;

      console.log("\n🎯 FINAL RESULTS ----------------");
      console.log(`Basic Salary: ₦${basicSalary.toLocaleString()}`);
      console.log(`Total Allowances: ₦${totalAllowances.toLocaleString()}`);
      console.log(`Gross Salary: ₦${grossSalary.toLocaleString()}`);
      console.log("--------------------------------\n");

      return {
        basicSalary,
        totalAllowances,
        totalDeductions: 0,
        totalBonuses: 0,
        grossSalary,
        netSalary: grossSalary,
        components: salaryGrade.components.map((component) => ({
          ...component.toObject(),
          amount:
            component.type === "allowance"
              ? component.calculationMethod === "fixed"
                ? Number(component.value)
                : Math.round((basicSalary * Number(component.value)) / 100)
              : 0,
        })),
        allowances: {
          gradeAllowances,
          additionalAllowances: [],
          totalAllowances,
        },
      };
    } catch (error) {
      console.error("❌ Error calculating total salary:", error);
      throw new ApiError(
        500,
        `Failed to calculate total salary: ${error.message}`
      );
    }
  }

  // Add this method to get calculated salary grade
  static async getCalculatedSalaryGrade(id) {
    try {
      const salaryGrade = await this.getSalaryGradeById(id);
      const calculations = await this.calculateTotalSalary(salaryGrade);
      return {
        ...salaryGrade.toObject(),
        calculations,
      };
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to get calculated salary grade: ${error.message}`
      );
    }
  }
}
