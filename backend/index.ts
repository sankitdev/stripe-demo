import express from "express";
import { dbConnect } from "./config/db";

const app = express();
const port = 3000;

app.listen(port, () => {
  try {
    dbConnect();
    console.log(`Listening on port, ${port}`);
  } catch (error) {
    console.log("Error while connecting", error);
    process.exit(1);
  }
});
