import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';

// Configure multer for memory storage (we'll process with Sharp)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Maximum 5 images per listing
  },
});

// Process and save images
export async function processImages(files: Express.Multer.File[]): Promise<string[]> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Ensure upload directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const imageUrls: string[] = [];

  for (const file of files) {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `item-${timestamp}-${randomString}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Process image with Sharp
    await sharp(file.buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Return URL path (relative to server)
    imageUrls.push(`/uploads/${filename}`);
  }

  return imageUrls;
}

// Create thumbnail
export async function createThumbnail(imageBuffer: Buffer): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'uploads', 'thumbnails');
  
  // Ensure thumbnail directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const filename = `thumb-${timestamp}-${randomString}.webp`;
  const filepath = path.join(uploadDir, filename);

  await sharp(imageBuffer)
    .resize(200, 200, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toFile(filepath);

  return `/uploads/thumbnails/${filename}`;
}
