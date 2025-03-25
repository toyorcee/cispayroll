import { randomBytes } from "crypto";

export const generateInvitationToken = () => {
  return randomBytes(32).toString("hex");
};

export const generateResetToken = () => {
  return randomBytes(32).toString("hex");
};