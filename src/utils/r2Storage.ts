import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "karavideo";
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ||
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_DOMAIN_ACCESS_URL =
  process.env.R2_DOMAIN_ACCESS_URL ||
  "https://pub-7d734936d4b14f42b4d57763fc2b3d12.r2.dev";

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_PUBLIC_URL,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to R2 storage from a URL
 * @param sourceUrl URL of the file to upload
 * @param destinationKey Key (path) where the file will be stored in R2
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFileFromUrl(
  sourceUrl: string,
  destinationKey: string,
  contentType = "application/octet-stream",
): Promise<string> {
  try {
    // Check if the source URL is already an R2 URL
    if (sourceUrl && sourceUrl.includes(R2_DOMAIN_ACCESS_URL)) {
      console.log(`File is already on R2, skipping upload: ${sourceUrl}`);
      return sourceUrl; // Return the existing R2 URL directly
    }

    // Fetch the file from the source URL
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from ${sourceUrl}: ${response.statusText}`,
      );
    }

    // Get the file content as an array buffer
    const fileBuffer = await response.arrayBuffer();

    // Upload to R2
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: destinationKey,
      Body: Buffer.from(fileBuffer),
      ContentType: contentType,
      CacheControl: "max-age=31536000",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the public URL with the domain access URL
    return `${R2_DOMAIN_ACCESS_URL}/${destinationKey}`;
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    throw error;
  }
}

/**
 * Generate a unique key for storing a file in R2
 * @param userId User ID
 * @param taskId Task ID
 * @param fileType Type of file (video, thumbnail, etc.)
 * @param extension File extension (mp4, jpg, etc.)
 * @returns Unique key for the file
 */
/**
 * Upload a file buffer directly to R2 storage
 * @param fileBuffer Buffer containing the file data
 * @param key Key (path) where the file will be stored in R2
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFileBuffer(
  fileBuffer: Buffer | ArrayBuffer,
  key: string,
  contentType = "application/octet-stream",
): Promise<string> {
  try {
    // Prepare the buffer for upload
    const buffer =
      fileBuffer instanceof ArrayBuffer ? Buffer.from(fileBuffer) : fileBuffer;

    // Upload to R2
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "max-age=31536000",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the public URL with the domain access URL
    return `${R2_DOMAIN_ACCESS_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading file buffer to R2:", error);
    throw error;
  }
}

/**
 * Generate a unique key for storing a file in R2
 * @param userId User ID
 * @param taskId Task ID
 * @param fileType Type of file (video, thumbnail, etc.)
 * @param extension File extension (mp4, jpg, etc.)
 * @returns Unique key for the file
 */
export function generateStorageKey(
  userId: string,
  taskId: string,
  fileType: "video" | "thumbnail" | "image",
  extension: string,
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `users/${userId}/${fileType}s/${taskId}_${timestamp}_${randomString}.${extension}`;
}
