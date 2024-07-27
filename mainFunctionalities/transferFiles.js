import { GridFSBucket } from "mongodb";
import * as Minio from "minio";
import dotenv from "dotenv";
import { closeConnection, connectDB } from "../clients/dbConnection.js";

dotenv.config();

export const transferFiles = async () => {
  try {
    const db = await connectDB();
    const gridFSBucket = new GridFSBucket(db, { bucketName: "fsBucket" });
    const minioClient = global.minioClient;
    const minioBucket = global.minioBucket;

    // Get all files in GridFS
    const filesCursor = db.collection("fsBucket.files").find();

    // Process each file document
    await filesCursor.forEach(async (doc) => {
      const fileId = doc._id;
      const fileName = doc.filename || fileId.toString();
      const contentType = doc.contentType || "application/octet-stream"; // Default content type

      try {
        // Download file data
        const downloadStream = gridFSBucket.openDownloadStream(fileId);
        const chunks = [];

        downloadStream.on("data", (chunk) => chunks.push(chunk));
        downloadStream.on("end", async () => {
          // Concatenate all chunks into a single buffer
          const fileBuffer = Buffer.concat(chunks);

          // Upload file to MinIO
          minioClient.putObject(
            minioBucket,
            fileName,
            fileBuffer,
            { "Content-Type": contentType },
            (err, objInfo) => {
              if (err) {
                console.error("Failed to upload file", fileName, err);
              } else {
                console.log(
                  "File uploaded successfully",
                  fileName,
                  objInfo.etag,
                  objInfo.versionId
                );
              }
            }
          );
        });

        downloadStream.on("error", (err) => {
          console.error(`Error downloading file ${fileId}: ${err.message}`);
        });
      } catch (err) {
        console.error(`Error processing file ${fileId}: ${err.message}`);
      }
    });
  } catch (err) {
    console.error(`Error transferring files: ${err.message}`);
  } finally {
    await closeConnection();
  }
};

export default transferFiles;
