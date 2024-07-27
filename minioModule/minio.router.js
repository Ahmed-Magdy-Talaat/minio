import express from "express";
import { deleteFile, downloadFile, uploadFile } from "./minio.controller.js";
import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

const router = express.Router();

console.log("heye");
router.get("/download/:fileName", downloadFile);
router.post("/upload", upload.single("file"), uploadFile);
router.delete("/delete/:fileName", deleteFile);

export default router;
