import express from "express";
import dotenv from "dotenv";
import minioRouter from "./minioModule/minio.router.js";
import multer from "multer";

dotenv.config();



const app = express();
app.use(express.json());

app.use("/minio/", minioRouter);

const port = process.env.PORT || 3001;
console.log("starting server");
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
