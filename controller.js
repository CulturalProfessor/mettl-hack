import { config } from "dotenv";
import { OpenAI } from "openai";
import { User } from "./schema.js";

config();
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const openai = new OpenAI({ apiKey: OPEN_AI_API_KEY });

export const generateQuestions = async (req, res) => {
  try {
    const { job_description, job_requirements, interview_level } = req.body;

    if (!job_description || !job_requirements || !interview_level) {
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

    if (response) {
      console.log("Response from OpenAI:", response.choices[0].message.content);
      let questionsString = response.choices[0].message.content;
      console.log("Raw questions string:", questionsString);
      questionsString = questionsString.replace(/'/g, '"');
      console.log("Modified questions string:", questionsString);
      let questionsArray = JSON.parse(questionsString);
      console.log("Parsed questions array:", questionsArray);

      questionsArray.questions.forEach((question, index) => {
        if (index === 0 || index === 9) {
          question.type = "Background";
        } else {
          question.type = "Technical";
        }
        //remove any other fields than type and question
        questionsArray.questions[index] = {
          type: question.type,
          question: question.question,
        };
      });
      
      res.status(200).json({ questions: questionsArray.questions });
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
