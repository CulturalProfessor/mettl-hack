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
    unique: true,
  },
  ResumeImage: {
    type: String,
    required: true,
  },
});

export const User = mongoose.model("User", UserSchema);

const InterviewSchema = new mongoose.Schema({
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Username: {
    type: String,
    required: true,
  },
  Questions: {
    type: [String],
    required: true,
  },
  Answers: {
    type: [String],
    required: true,
  },
  Score: {
    type: Number,
    required: true,
  },
});

export const Interview = mongoose.model("Interview", InterviewSchema);