// migrations/updateUserStatus.js
import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import {
  UserLifecycleState,
  OnboardingStatus,
  UserStatus,
} from "../models/User.js";

// Load environment variables
dotenv.config();

// Helper function to generate dynamic personal information based on user's name
function generatePersonalInfo(user) {
  const firstName = user.firstName;
  const lastName = user.lastName;
  const fullName = user.fullName;

  // Generate a unique street address based on the user's name
  const streetNumber = Math.floor(Math.random() * 100) + 1;
  const streetName = `${firstName} ${lastName} Street`;

  // Generate a unique bank account number
  const accountNumber = Math.floor(
    Math.random() * 9000000000 + 1000000000
  ).toString();

  // Generate a unique phone number
  const phoneNumber = `+234 ${Math.floor(Math.random() * 900) + 100} ${
    Math.floor(Math.random() * 9000) + 1000
  } ${Math.floor(Math.random() * 9000) + 1000}`;

  // Generate a unique emergency contact
  const emergencyName = `${firstName}'s Emergency Contact`;
  const emergencyPhone = `+234 ${Math.floor(Math.random() * 900) + 100} ${
    Math.floor(Math.random() * 9000) + 1000
  } ${Math.floor(Math.random() * 9000) + 1000}`;

  // Generate a unique bank name based on the user's name
  const bankNames = [
    "Access Bank",
    "Zenith Bank",
    "First Bank",
    "UBA",
    "Wema Bank",
    "GTBank",
    "Fidelity Bank",
    "Sterling Bank",
  ];
  const bankName = bankNames[Math.floor(Math.random() * bankNames.length)];

  // Generate a unique bank code
  const bankCodes = ["044", "057", "011", "033", "035", "058", "070", "232"];
  const bankCode = bankCodes[Math.floor(Math.random() * bankCodes.length)];

  // Generate a unique account name
  const accountName = `${firstName} ${lastName}`;

  // Generate a unique date of birth (between 25 and 45 years old)
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - (Math.floor(Math.random() * 20) + 25);
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const dateOfBirth = new Date(birthYear, birthMonth, birthDay);

  // Generate a unique qualification
  const institutions = [
    "University of Lagos",
    "University of Ibadan",
    "University of Benin",
    "University of Nigeria",
    "Covenant University",
    "Babcock University",
  ];
  const institution =
    institutions[Math.floor(Math.random() * institutions.length)];
  const graduationYear = birthYear + 22 + Math.floor(Math.random() * 3);

  // Generate a unique next of kin
  const nextOfKinNames = [
    `${firstName}'s Father`,
    `${firstName}'s Mother`,
    `${firstName}'s Spouse`,
    `${firstName}'s Sibling`,
    `${firstName}'s Guardian`,
  ];
  const nextOfKinName =
    nextOfKinNames[Math.floor(Math.random() * nextOfKinNames.length)];
  const nextOfKinRelationships = [
    "Father",
    "Mother",
    "Spouse",
    "Sibling",
    "Guardian",
  ];
  const nextOfKinRelationship =
    nextOfKinRelationships[
      Math.floor(Math.random() * nextOfKinRelationships.length)
    ];
  const nextOfKinPhone = `+234 ${Math.floor(Math.random() * 900) + 100} ${
    Math.floor(Math.random() * 9000) + 1000
  } ${Math.floor(Math.random() * 9000) + 1000}`;

  // Generate a unique next of kin address
  const nextOfKinStreetNumber = Math.floor(Math.random() * 100) + 1;
  const nextOfKinStreetName = `${lastName} Family Estate`;

  // Generate a unique state of origin
  const states = [
    "Lagos",
    "Abuja",
    "Rivers",
    "Oyo",
    "Kano",
    "Edo",
    "Delta",
    "Ogun",
    "Imo",
    "Anambra",
    "Enugu",
    "Abia",
    "Akwa Ibom",
    "Cross River",
    "Bayelsa",
    "Ebonyi",
    "Ekiti",
    "Osun",
    "Ondo",
    "Kwara",
    "Benue",
    "Plateau",
    "Kaduna",
    "Sokoto",
    "Katsina",
    "Borno",
    "Adamawa",
    "Taraba",
    "Gombe",
    "Bauchi",
    "Yobe",
    "Zamfara",
    "Nasarawa",
    "Niger",
    "Kogi",
    "FCT",
  ];
  const stateOfOrigin = states[Math.floor(Math.random() * states.length)];

  // Generate a unique LGA
  const lgas = [
    "Ikeja",
    "Lagos Island",
    "Apapa",
    "Surulere",
    "Mushin",
    "Ajeromi-Ifelodun",
    "Amuwo-Odofin",
    "Oshodi-Isolo",
    "Somolu",
    "Kosofe",
    "Ojo",
    "Ikorodu",
    "Eti-Osa",
    "Alimosho",
    "Ifako-Ijaiye",
    "Agege",
    "Badagry",
    "Epe",
  ];
  const lga = lgas[Math.floor(Math.random() * lgas.length)];

  // Generate a unique gender
  const gender = Math.random() > 0.5 ? "male" : "female";

  // Generate a unique marital status
  const maritalStatus = Math.random() > 0.5 ? "single" : "married";

  return {
    personalDetails: {
      middleName: "",
      dateOfBirth: dateOfBirth,
      gender: gender,
      maritalStatus: maritalStatus,
      nationality: "Nigerian",
      stateOfOrigin: stateOfOrigin,
      lga: lga,
      address: {
        street: `${streetNumber} ${streetName}`,
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
      },
      nextOfKin: {
        name: nextOfKinName,
        relationship: nextOfKinRelationship,
        phone: nextOfKinPhone,
        address: {
          street: `${nextOfKinStreetNumber} ${nextOfKinStreetName}`,
          city: "Lagos",
          state: "Lagos",
          zipCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          country: "Nigeria",
        },
      },
      qualifications: [
        {
          highestEducation: "University",
          institution: institution,
          yearGraduated: graduationYear.toString(),
        },
      ],
    },
    bankDetails: {
      bankName: bankName,
      accountNumber: accountNumber,
      accountName: accountName,
      bankCode: bankCode,
    },
    emergencyContact: {
      name: emergencyName,
      relationship: "Family",
      phone: emergencyPhone,
      address: `${streetNumber} ${streetName}, Lagos, Nigeria`,
    },
  };
}

async function updateUserStatus() {
  try {
    console.log("🔄 Starting user status update...");

    // Find all users except super admins
    const users = await User.find({
      role: { $ne: "SUPER_ADMIN" },
    });

    console.log(`Found ${users.length} users to update`);

    if (users.length === 0) {
      console.log("No users found to update");
      return;
    }

    // Update each user
    for (const user of users) {
      console.log(`Updating user: ${user.fullName} (${user.employeeId})`);
      console.log(`   Current status: ${user.status}`);
      console.log(`   Department: ${user.department}`);

      // Generate personal information based on user's name
      const personalInfo = generatePersonalInfo(user);

      // Update user status and add personal information
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            "lifecycle.currentState": UserLifecycleState.ACTIVE,
            "onboarding.status": OnboardingStatus.COMPLETED,
            "onboarding.progress": 100,
            personalDetails: personalInfo.personalDetails,
            bankDetails: personalInfo.bankDetails,
            emergencyContact: personalInfo.emergencyContact,
            // Update deduction preferences with complete structure
            "deductionPreferences.statutory.defaultStatutory": {
              "paye tax": {
                opted: true,
                optedAt: user.createdAt,
                optedBy: user.createdBy || user._id,
                reason: "other",
                notes: "Core statutory deduction - Cannot be opted out",
              },
              pension: {
                opted: true,
                optedAt: user.createdAt,
                optedBy: user.createdBy || user._id,
                reason: "other",
                notes: "Core statutory deduction - Cannot be opted out",
              },
              nhf: {
                opted: true,
                optedAt: user.createdAt,
                optedBy: user.createdBy || user._id,
                reason: "other",
                notes: "Core statutory deduction - Cannot be opted out",
              },
            },
            "deductionPreferences.statutory.customStatutory": [],
            "deductionPreferences.voluntary.standardVoluntary": [],
            "deductionPreferences.voluntary.customVoluntary": [],
          },
        },
        { new: true }
      );

      console.log(
        `✅ Updated user: ${updatedUser.fullName} (${updatedUser.employeeId})`
      );
      console.log(`   - New status: ${updatedUser.status}`);
      console.log(`   - Gender: ${personalInfo.personalDetails.gender}`);
      console.log(
        `   - Marital Status: ${personalInfo.personalDetails.maritalStatus}`
      );
      console.log(
        `   - Nationality: ${personalInfo.personalDetails.nationality}`
      );
      console.log(
        `   - State of Origin: ${personalInfo.personalDetails.stateOfOrigin}`
      );
      console.log(`   - LGA: ${personalInfo.personalDetails.lga}`);
      console.log(
        `   - Address: ${personalInfo.personalDetails.address.street}`
      );
      console.log(
        `   - Next of Kin: ${personalInfo.personalDetails.nextOfKin.name} (${personalInfo.personalDetails.nextOfKin.relationship})`
      );
      console.log(
        `   - Bank: ${personalInfo.bankDetails.bankName} (${personalInfo.bankDetails.accountNumber})`
      );
    }

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating users:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Connect to MongoDB and run the update
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("📡 Connected to MongoDB");
    return updateUserStatus();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
