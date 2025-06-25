import mongoose from "mongoose";
import IntegrationSettings from "../models/IntegrationSettings.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function flushIntegrationSettings() {
  try {
    const result = await IntegrationSettings.deleteMany({});
    console.log(
      `Flushed IntegrationSettings collection. Deleted ${result.deletedCount} document(s).`
    );
  } catch (error) {
    console.error("Error flushing IntegrationSettings:", error);
  } finally {
    mongoose.disconnect();
  }
}

flushIntegrationSettings();
