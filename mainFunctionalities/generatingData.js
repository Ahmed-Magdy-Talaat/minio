import fs from "fs";
import { GridFSBucket, ObjectId } from "mongodb";
import { connectDB } from "../clients/dbConnection.js";

export const generateFilesForAllOrganizationContents = async () => {
  const db = await connectDB();
  const { size, data } = getFileSizeAndChunk("./example.txt"); // Example file path

  // Drop existing collections if necessary
  await db.collection("fs.chunks").drop();
  await db.collection("fs.files").drop();

  // Use an aggregation pipeline to group by both binaryData and name
  const distinctBinaryDataCursor = db
    .collection("organization-content")
    .aggregate([
      { $match: { binaryData: { $exists: true, $type: "string" } } },
      {
        $group: {
          _id: "$binaryData",
          name: { $first: "$name" }, // Use $first to get the first occurrence of the name
        },
      },
    ]);

  let count = 0;

  for await (const doc of distinctBinaryDataCursor) {
    const binaryData = doc._id;
    const name = doc.name;

    if (binaryData) {
      try {
        const objId = new ObjectId(binaryData);
        const fileExists = await db.collection("fs.files").findOne({
          _id: objId,
        });

        if (!fileExists) {
          console.log(`Uploading file ${name} with binaryData ${binaryData}`);
          await uploadFile(binaryData, name);
        } else {
          console.log(
            `File with binaryData ${binaryData} already exists. Skipping upload.`
          );
        }
      } catch (err) {
        console.error(
          `Error creating ObjectId or processing file with binaryData ${binaryData}: ${err.message}`
        );
      }
    } else {
      console.error(`Invalid binaryData length or type: ${binaryData}`);
    }
    count++;
  }

  console.log(`Processed ${count} distinct binaryData values.`);
};

export const uploadFile = async (binaryData, name) => {
  const db = global.db;
  const filePath = "./example.txt";
  const file = fs.readFileSync(filePath);
  const bucket = new GridFSBucket(db, { bucketName: "fsBucket" });

  try {
    console.log(name);
    const objId = new ObjectId(binaryData);
    const uploadStream = bucket.openUploadStreamWithId(objId, name, {
      contentType: "application/octet-stream",
    });

    uploadStream.end(file);

    uploadStream.on("finish", () => {
      console.log(`File ${name} uploaded successfully`);
    });

    uploadStream.on("error", (err) => {
      console.error("Error uploading file:", err);
    });
  } catch (err) {
    console.error(`Error creating upload stream for ${name}: ${err.message}`);
  } finally {
    await closeConnection();
  }
};

export const getFileSizeAndChunk = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const chunkData = fs.readFileSync(filePath);
    return { size: stats.size, data: chunkData };
  } catch (err) {
    throw new Error(`Error getting file size: ${err.message}`);
  }
};
