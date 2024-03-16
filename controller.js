import { config } from "dotenv";
import { OpenAI } from "openai";
import { Interview, User } from "./schema.js";
import fs from "fs";
import { logger } from "./index.js";

config();
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const openai = new OpenAI({ apiKey: OPEN_AI_API_KEY });

export const generateQuestions = async (req, res) => {
  try {
    const { job_description, job_requirements, interview_level, email } =
      req.body;

    if (!job_description || !job_requirements || !interview_level || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          Generate 10 interview questions related to the job description which is ${job_description} 
          and job requirement are ${job_requirements} of ${interview_level} difficulty to prepare a 
          candidate for an interview in the field of Computer Science.Keep the questions at 0 and 9 
          index about personal background to judge candidate personality and at other indices keep 
          technical knowledge questions.
          .JSON format is preferred.
          `,
        },
        {
          role: "user",
          content: `What are questions related to the job description and job requirements`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    if (response.choices[0].message.content) {
      const questionsObject = JSON.parse(response.choices[0].message.content);
      if (!questionsObject) {
        return res
          .status(500)
          .json({ error: "Failed to parse response from OpenAI" });
      }
      let qa = [];
      questionsObject.questions.forEach((question, index) => {
        qa.push({
          Question: question.question,
          Answer: "",
          Type: index === 0 || index === 9 ? "Background" : "Technical",
          Score: 0,
        });
      });
      const interview_id = Math.random().toString(36).substr(2, 9);

      await Interview.create({
        InterviewId: interview_id,
        Email: email,
        QA: qa,
        TotalScore: 0,
      });

      res.status(200).json({ questions: qa, interview_id: interview_id });
    } else {
      console.error("OpenAI response data is undefined");
      res
        .status(500)
        .json({ error: "Failed to retrieve response from OpenAI" });
    }
  } catch (error) {
    console.error("Error generating questions:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createUser = async (req, res) => {
  try {
    let { Name, Age, Phone, Email, ResumeImage } = req.body;

    Name = Name.trim();
    Email = Email.trim();

    if (!Name || !Age || !Phone || !Email || !ResumeImage) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (typeof Age !== "number" || Age <= 0) {
      return res.status(400).json({ error: "Age must be a positive number" });
    }

    if (typeof Phone !== "string" || !/^\d{10}$/.test(Phone)) {
      return res
        .status(400)
        .json({ error: "Phone number must be a 10-digit string" });
    }

    const existingEmailUser = await User.findOne({ Email });
    if (existingEmailUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const existingPhoneUser = await User.findOne({ Phone });
    if (existingPhoneUser) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const user = new User({
      Name,
      Age,
      Phone,
      Email,
      ResumeImage,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error.message);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const interviews = await Interview.find({ Email: email });
    res.status(200).json({ interviews });
  } catch (error) {
    console.error("Error getting interviews:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interview_id, email, question_index, answer, difficulty_level } =
      req.body;
    const interview = await Interview.findOne({ InterviewId: interview_id });
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    if (interview.Email !== email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let question = interview.QA[question_index];

    const scorePrompt = ` Evaluate the candidate's answer "${answer}" to the following question: "${question.Question}".
    On a scale of 1 to 10, rate the quality of the answer provided by considering factors such as:
    - Clarity
    - Depth of understanding
    - Relevance to the question
    - Problem-solving approach
    
    Please provide a cumulative score only that reflects the overall effectiveness of the response.
    Remember that this is a ${difficulty_level} level interview, and you are simulating a real interviewer.
    The score should accurately reflect the candidate's performance and contribute to a fair assessment of their abilities.
    JSON format is preferred.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: scorePrompt,
        },
        {
          role: "user",
          content: `Score for the answer ${answer}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    if (response.choices[0].message.content) {
      const scoreObject = JSON.parse(response.choices[0].message.content);
      const score = scoreObject.score;
      if (isNaN(score) || score < 1 || score > 10) {
        return res.status(400).json({ error: "Invalid score" });
      }
      question.Answer = answer;
      question.Score = score;
      await interview.save();
      res
        .status(200)
        .json({ message: "Answer submitted successfully", score: score });
    } else {
      console.error("OpenAI response data is undefined");
      res
        .status(500)
        .json({ error: "Failed to retrieve response from OpenAI" });
    }
  } catch (error) {
    console.error("Error submitting answer:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const totalScore = async (req, res) => {
  try {
    const { interview_id, email } = req.body;
    const interview = await Interview.findOne({ InterviewId: interview_id });
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    if (interview.Email !== email) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    let totalScore = 0;
    interview.QA.forEach((question) => {
      totalScore += question.Score;
    });
    totalScore = totalScore / 10;
    interview.TotalScore = totalScore;
    await interview.save();
    res
      .status(200)
      .json({ message: "Total score calculated successfully", totalScore });
  } catch (error) {
    console.error("Error calculating total score:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
