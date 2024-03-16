import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Age: {
    type: Number,
    required: true,
  },
  Phone: {
    type: String,
    required: true,
    unique: true,
  },
  Email: {
    type: String,
    required: true,
  },
  ResumeImage: {
    type: String,
    required: true,
  },
});

export const User = mongoose.model("User", UserSchema);

const InterviewSchema = new mongoose.Schema({
  InterviewId: {
    type: String,
    required: true,
    unique: true,
  },
  Email: {
    type: String,
    required: true,
  },
  QA: [
    {
      Question: {
        type: String,
        required: true,
      },
      Answer: {
        type: String,
      },
      Type: {
        type: String,
        required: true,
      },
      Score: {
        type: Number,
        required: true,
      },
    },
  ],
  TotalScore: {
    type: Number,
    required: true,
  },
});

export const Interview = mongoose.model("Interview", InterviewSchema);
