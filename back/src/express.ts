import express from "express";
import cors from "cors";
import { initDatabase } from "./database";
import cookieParser from "cookie-parser";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:1866",
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

app.listen(1865, () => {
  initDatabase();
});
