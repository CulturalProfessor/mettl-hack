import { config } from "dotenv";
import { OpenAI } from "openai";
import { User } from "./schema.js";

config();
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const openai = new OpenAI({ apiKey: OPEN_AI_API_KEY });


export const generateQuestions = async (req, res) => {
  try {
    const { questions_topic } = req.body;

    const response = await openai.chat.completions
      .create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
          Generate 10 interview questions related to the topic of ${questions_topic} to prepare a candidate for an interview in the field of Computer Science. JSON format is preferred.
          `,
          },
          {
            role: "user",
            content: `What are questions related to the topic of  ${questions_topic}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      })
      .then((response) => {
        console.log(response.choices[0].message);
        return response;
      });

    if (response) {
      console.log("Response from OpenAI:", response);
      res.status(200).json(response);
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
      return res.status(400).json({ error: "Phone number must be a 10-digit string" });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
}
