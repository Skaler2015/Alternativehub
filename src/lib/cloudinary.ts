import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
}

/** Upload a remote image (logo/screenshot) into the media CDN. */
export async function uploadRemoteImage(
  url: string,
  folder: "logos" | "screenshots" | "covers",
  publicId?: string,
): Promise<{ url: string; publicId: string; width: number; height: number } | null> {
  if (!ensureConfigured()) return null;
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: `alternativehub/${folder}`,
      public_id: publicId,
      overwrite: true,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch {
    return null;
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!ensureConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best-effort
  }
}
