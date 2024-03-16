import { config } from "dotenv";
import { OpenAI } from "openai";
import { Interview, User } from "./schema.js";

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
          technical knowledge questions. JSON format is preferred.
          `,
        },
        {
          role: "user",
          content: `What are questions related to the job description and job requirements`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    if (
      response &&
      response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      console.log("Response from OpenAI:", response.choices[0].message.content);
      const questionsObject = JSON.parse(response.choices[0].message.content);
      const questionsArray = Object.values(questionsObject);

      let qa = [];
      questionsArray.forEach((question, index) => {
        const type = index === 0 || index === 9 ? "Background" : "Technical";
        qa.push({ Question: question, Answer: "", Score: 0, Type: type });
      });

      await Interview.create({
        Email: email,
        QA: qa,
        TotalScore: 0,
      });

      res.status(200).json({ questions: qa });
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
