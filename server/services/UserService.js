import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import User, {
  UserRole,
  UserLifecycleState,
  OnboardingStatus,
} from "../models/User.js";
import { EmailService } from "./emailService.js";

class UserService {
  constructor() {
    this.emailService = new EmailService();
  }

  // Create methods for different user types
  async createSuperAdmin(userData) {
    const user = new User({
      ...userData,
      role: UserRole.SUPER_ADMIN,
      lifecycleState: {
        current: UserLifecycleState.ACTIVE,
        history: [
          {
            state: UserLifecycleState.ACTIVE,
            timestamp: new Date(),
            notes: "Super Admin created",
          },
        ],
      },
      status: "active",
      isEmailVerified: true,
    });

    await user.save();
    return user;
  }

  async createAdmin(adminData, createdBy) {
    const invitationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const admin = new User({
      ...adminData,
      role: UserRole.ADMIN,
      createdBy: createdBy._id,
      invitation: {
        token: invitationToken,
        expiresAt,
        sentAt: new Date(),
      },
      lifecycleState: {
        current: UserLifecycleState.INVITED,
        history: [
          {
            state: UserLifecycleState.INVITED,
            timestamp: new Date(),
            updatedBy: createdBy._id,
            notes: "Admin invited by Super Admin",
          },
        ],
      },
    });

    await admin.save();
    await this.emailService.sendInvitation(admin, invitationToken);
    return admin;
  }

  async createEmployee(employeeData, createdBy) {
    // Validate department access if creator is an admin
    if (createdBy.role === UserRole.ADMIN) {
      if (
        employeeData.department.toString() !== createdBy.department.toString()
      ) {
        throw new Error("Admins can only create employees in their department");
      }
    }

    const invitationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const employee = new User({
      ...employeeData,
      role: UserRole.USER,
      createdBy: createdBy._id,
      invitation: {
        token: invitationToken,
        expiresAt,
        sentAt: new Date(),
      },
      lifecycleState: {
        current: UserLifecycleState.INVITED,
        history: [
          {
            state: UserLifecycleState.INVITED,
            timestamp: new Date(),
            updatedBy: createdBy._id,
            notes: `Employee invited by ${createdBy.role}`,
          },
        ],
      },
    });

    await employee.save();
    await this.emailService.sendInvitation(employee, invitationToken);
    return employee;
  }

  // Lifecycle state management methods
  async completeRegistration(invitationToken, userData) {
    const user = await User.findOne({ "invitation.token": invitationToken });
    if (!user) throw new Error("Invalid invitation token");
    if (user.invitation.expiresAt < new Date())
      throw new Error("Invitation expired");

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    user.password = hashedPassword;
    user.isEmailVerified = true;
    await user.updateLifecycleState(
      UserLifecycleState.REGISTERED,
      user._id,
      "User completed registration"
    );

    return user;
  }

  async startOnboarding(userId, supervisorId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    if (!user.canTransitionTo(UserLifecycleState.ONBOARDING)) {
      throw new Error("Cannot start onboarding from current state");
    }

    user.onboarding.supervisor = supervisorId;
    user.onboarding.expectedCompletionDate = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ); // 14 days
    await user.updateLifecycleState(
      UserLifecycleState.ONBOARDING,
      supervisorId,
      "Onboarding process started"
    );

    return user;
  }

  // Query methods
  async findByDepartment(departmentId) {
    return User.find({ department: departmentId });
  }

  async findByLifecycleState(state) {
    return User.find({ "lifecycleState.current": state });
  }

  async getOnboardingStatus(userId) {
    const user = await User.findById(userId)
      .select("onboarding lifecycleState")
      .populate("onboarding.supervisor", "firstName lastName email");

    if (!user) throw new Error("User not found");
    return user;
  }

  // Utility methods
  async resendInvitation(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.lifecycleState.current !== UserLifecycleState.INVITED) {
      throw new Error("User has already accepted invitation");
    }

    const newToken = uuidv4();
    user.invitation = {
      token: newToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sentAt: new Date(),
      lastResendAt: new Date(),
      resendCount: (user.invitation.resendCount || 0) + 1,
    };

    await user.save();
    await this.emailService.sendInvitation(user, newToken);
    return user;
  }
}

export default new UserService();
