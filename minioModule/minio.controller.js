// minio.controller.js
import { minioClient } from "../clients/minio.js";
import dotenv from "dotenv";
dotenv.config();

// Get the bucket name from environment variables
const bucketName = process.env.MINIO_BUCKET;

export const uploadFile = (req, res, next) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  minioClient.putObject(
    bucketName,
    file.originalname,
    file.buffer,
    file.size,
    (err, etag) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "File uploaded successfully", etag });
    }
  );
};

export const downloadFile = (req, res, next) => {
  const { fileName } = req.params;
  console.log("hery");
  minioClient.getObject(bucketName, fileName, (err, dataStream) => {
    if (err) {
      console.error("Error fetching file:", err.message);
      return res
        .status(500)
        .json({ error: `Failed to retrieve file ${err.message}` });
    }

    // Setting proper content type for PDFs
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    dataStream.pipe(res);
  });
};

export const deleteFile = (req, res, next) => {
  const { fileName } = req.params;

  minioClient.removeObject(bucketName, fileName, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "File deleted successfully" });
  });
};
