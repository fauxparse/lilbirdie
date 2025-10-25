import { useState } from "react";
import { toast } from "sonner";

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface UseImageUploadOptions {
  onSuccess?: (data: UploadResponse) => void;
  onError?: (error: string) => void;
}

export function useImageUpload(options?: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File): Promise<UploadResponse | null> => {
    if (!file) {
      const error = "No file provided";
      options?.onError?.(error);
      toast.error(error);
      return null;
    }

    // Validate file type on client side
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      const error = "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.";
      options?.onError?.(error);
      toast.error(error);
      return null;
    }

    // Note: File size validation removed since ImageUpload component now auto-resizes images

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Upload failed");
      }

      const data: UploadResponse = await response.json();

      options?.onSuccess?.(data);
      toast.success("Image uploaded successfully!");

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      options?.onError?.(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload/image?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Delete failed");
      }

      toast.success("Image deleted successfully!");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Delete failed";
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    uploadProgress,
  };
}
