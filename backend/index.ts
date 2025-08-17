import express from "express";
import { dbConnect } from "./config/db";
import WebhookRouter from "./routes/webhook";

const app = express();
const port = 3000;

app.use("/", WebhookRouter);

app.get("/test", (req, res) => {
  res.send("Welcome backend is running fine.");
});

app.listen(port, async () => {
  try {
    await dbConnect();
    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.log("Error while connecting", error);
    process.exit(1);
  }
});
