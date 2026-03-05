import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3034", 10),
  qnBasicAuthUsername: process.env.QN_BASIC_AUTH_USERNAME || "",
  qnBasicAuthPassword: process.env.QN_BASIC_AUTH_PASSWORD || "",
  dbPath: process.env.DB_PATH || "./accredit-qn.db",
  transferHookProgramId:
    process.env.TRANSFER_HOOK_PROGRAM_ID ||
    "ACCReD1tKYCgateway1111111111111111111111111",
};
