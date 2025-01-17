import path from "node:path";
import express from "express";
import logger from "morgan";
import cors from "cors";
import { contactRouter } from "./routes/api/contacts.js";
import { ERROR_TYPE } from "./constant.js";
import { authRouter } from "./routes/api/auth.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use("/api/users", authRouter);
app.use("/api/contacts", contactRouter);
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  if (err.message === ERROR_TYPE.CONTACT_TAKEN) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === ERROR_TYPE.UNAUTHORIZED)
    return res.status(401).json({ message: "Not authorized" });
  res.status(500).json({ message: err.message });
});

export { app };
