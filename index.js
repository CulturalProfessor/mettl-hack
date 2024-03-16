import Express from "express";
import { config } from "dotenv";
import router from "./router.js";
import mongoose from "mongoose";

config();
const MONGODB_STRING = process.env.MONGODB_STRING;
const PORT=process.env.PORT;

const app = Express();
app.use(Express.json());

app.use("/api", router);

app.listen(PORT || 3000, () => {
  console.log("Server is running on port 3000");
  mongoose.connect(MONGODB_STRING);

  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB");
  });
});
