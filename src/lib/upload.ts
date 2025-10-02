import { supabaseAdmin } from './supabase'
import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const THUMBNAIL_SIZE = 400

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export class UploadService {
  // Upload image to Supabase Storage
  static async uploadImage(file: File, userId: string): Promise<UploadResult> {
    try {
      // Validate file
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
      }

      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: 'File too large. Maximum size is 5MB.' }
      }

      // Convert to buffer
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)

      // Process image with Sharp
      const processedImage = await sharp(uint8Array)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toBuffer()

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2)
      const fileName = `${userId}/${timestamp}-${randomString}.webp`

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('item-images')
        .upload(fileName, processedImage, {
          contentType: 'image/webp',
          cacheControl: '3600',
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: 'Failed to upload image' }
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('item-images')
        .getPublicUrl(fileName)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Image processing error:', error)
      return { success: false, error: 'Failed to process image' }
    }
  }

  // Upload multiple images
  static async uploadImages(files: File[], userId: string): Promise<{
    success: boolean
    urls: string[]
    errors: string[]
  }> {
    const urls: string[] = []
    const errors: string[] = []

    if (files.length > 10) {
      return { success: false, urls: [], errors: ['Maximum 10 images allowed'] }
    }

    for (const file of files) {
      const result = await this.uploadImage(file, userId)
      if (result.success && result.url) {
        urls.push(result.url)
      } else {
        errors.push(result.error || 'Upload failed')
      }
    }

    return {
      success: urls.length > 0,
      urls,
      errors,
    }
  }

  // Delete image from storage
  static async deleteImage(url: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/')
      const fileName = urlParts.slice(-2).join('/') // userId/filename

      const { error } = await supabaseAdmin.storage
        .from('item-images')
        .remove([fileName])

      if (error) {
        console.error('Delete image error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete image error:', error)
      return false
    }
  }

  // Generate thumbnail (for future use)
  static async generateThumbnail(imageUrl: string): Promise<string | null> {
    try {
      // This would be used to generate thumbnails from existing images
      // For now, we process images on upload
      return imageUrl
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      return null
    }
  }
}