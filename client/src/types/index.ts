export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Qualification {
  highestEducation: string;
  institution: string;
  yearGraduated: string;
}

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
  address: Address;
}

export interface PersonalDetails {
  middleName: string;
  dateOfBirth: string;
  address: Address;
  maritalStatus: string;
  nationality: string;
  nextOfKin: NextOfKin;
  qualifications: Qualification[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string; // 3-digit CBN bank code (e.g., "011" for First Bank, "058" for GTBank)
}

export interface RegistrationFormData {
  password: string;
  confirmPassword: string;
  personalDetails: {
    middleName?: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    maritalStatus: string;
    nationality: string;
    nextOfKin: {
      name: string;
      relationship: string;
      phone: string;
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
    };
    qualifications: Array<{
      highestEducation: string;
      institution: string;
      yearGraduated: string;
    }>;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  position: string;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
}
