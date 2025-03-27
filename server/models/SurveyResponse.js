import mongoose from "mongoose";

// Individual response to a question
const responseSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
    required: true,
  },
});

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    responses: [responseSchema],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookup
surveyResponseSchema.index({ survey: 1, respondent: 1 }, { unique: true });

// Increment response count in the survey when a new response is created
surveyResponseSchema.post('save', async function(doc) {
  try {
    const Survey = mongoose.model('Survey');
    await Survey.findByIdAndUpdate(
      doc.survey,
      { $inc: { responseCount: 1 } }
    );
  } catch (error) {
    console.error("Error updating survey response count:", error);
  }
});

const SurveyResponse = mongoose.model("SurveyResponse", surveyResponseSchema);

export default SurveyResponse; 