"use client";

import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  disabled?: boolean;
  aspectRatio?: "square" | "16/9" | "4/3";
}

export function ImageUpload({
  value,
  onChange,
  className = "",
  disabled = false,
  aspectRatio = "16/9",
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Image upload hook
  const { uploadImage, isUploading, uploadProgress } = useImageUpload({
    onSuccess: (data) => {
      onChange(data.url);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
    },
  });

  // Resize image if needed
  const resizeImageIfNeeded = useCallback(async (file: File): Promise<File> => {
    const MAX_SIZE = 1024 * 1024; // 1MB
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    if (file.size <= MAX_SIZE) {
      return file; // No resize needed
    }

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file); // Fallback to original if resize fails
            }
          },
          file.type,
          0.8 // 80% quality for compression
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file selection and preview
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      setIsProcessing(true);
      try {
        // Resize if needed
        const processedFile = await resizeImageIfNeeded(file);

        setSelectedFile(processedFile);
        const reader = new FileReader();
        reader.onload = async () => {
          setPreviewUrl(reader.result as string);
          setIsProcessing(false);
          // Automatically start upload after processing
          await uploadImage(processedFile);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error("Error processing image:", error);
        // Fallback to original file
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = async () => {
          setPreviewUrl(reader.result as string);
          setIsProcessing(false);
          // Automatically start upload even for fallback
          await uploadImage(file);
        };
        reader.readAsDataURL(file);
      }
    },
    [disabled, uploadImage, resizeImageIfNeeded]
  );

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      await handleFileSelect(imageFile);
    }
  };

  // Handle file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    if (disabled) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove uploaded image
  const removeUploadedImage = () => {
    if (disabled) return;
    onChange(null);
  };

  // Check if a URL is likely an image
  const isImageUrl = useCallback((url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname.toLowerCase();
      return (
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(pathname) ||
        /^(https?:\/\/).*\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)
      );
    } catch {
      return false;
    }
  }, []);

  // Handle URL upload
  const handleUrlUpload = useCallback(
    async (url: string) => {
      if (disabled) return;

      setIsProcessing(true);
      try {
        // Try to fetch the image with no-cors mode for external URLs
        const response = await fetch(url, {
          mode: "cors",
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
          throw new Error("URL does not point to a valid image");
        }

        const blob = await response.blob();
        const filename = url.split("/").pop()?.split("?")[0] || "pasted-image";
        const file = new File([blob], filename, { type: contentType });

        await handleFileSelect(file);
      } catch (error) {
        console.error("Error uploading from URL:", error);
        setIsProcessing(false);

        // Fallback: Try to set the URL directly if it's a valid image URL
        // This works for URLs that support CORS or are from the same origin
        if (isImageUrl(url)) {
          try {
            // Test if the image can be loaded
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              onChange(url);
              setIsProcessing(false);
            };
            img.onerror = () => {
              setIsProcessing(false);
              console.error("Image could not be loaded from URL");
            };
            img.src = url;
          } catch {
            setIsProcessing(false);
          }
        }
      }
    },
    [disabled, handleFileSelect, isImageUrl, onChange]
  );

  // Handle clipboard paste
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (disabled || isProcessing || isUploading) return;

      e.preventDefault();
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check for image files in clipboard
      const files = Array.from(clipboardData.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        await handleFileSelect(imageFile);
        return;
      }

      // Check for text that might be an image URL
      const text = clipboardData.getData("text/plain").trim();
      if (text && isImageUrl(text)) {
        await handleUrlUpload(text);
      }
    },
    [disabled, isProcessing, isUploading, handleFileSelect, isImageUrl, handleUrlUpload]
  );

  // Set up clipboard event listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (isFocused) {
        handlePaste(e);
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => {
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [isFocused, handlePaste]);

  const aspectRatioClass = {
    square: "aspect-square",
    "16/9": "aspect-16/9",
    "4/3": "aspect-4/3",
  }[aspectRatio];

  return (
    <div
      ref={containerRef}
      className={`space-y-2 ${className} outline-none}`}
      tabIndex={disabled ? -1 : 0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled && !isProcessing && !isUploading) {
            fileInputRef.current?.click();
          }
        }
      }}
    >
      {/* Existing uploaded image */}
      {value && !selectedFile && (
        <div className="relative group">
          <div
            className={cn(
              `relative w-full ${aspectRatioClass} border border-border rounded-lg overflow-hidden bg-muted`,
              isFocused && "ring-4 ring-ring ring-offset-0 border-primary"
            )}
          >
            <img src={value} alt="Item preview" className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={removeUploadedImage}
                className="absolute top-2 right-2 bg-background/80 text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* File selection preview */}
      {selectedFile && previewUrl && (
        <div className="space-y-2">
          <div
            className={`relative w-full ${aspectRatioClass} border border-border rounded-lg overflow-hidden bg-muted`}
          >
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />

            {/* Upload progress overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                </div>
              </div>
            )}

            {!disabled && !isUploading && (
              <button
                type="button"
                onClick={clearSelectedFile}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div
          className={`relative w-full ${aspectRatioClass} border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center`}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Processing image...</p>
          </div>
        </div>
      )}

      {/* Upload zone - only show if no image selected/uploaded */}
      {!value && !selectedFile && !isProcessing && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: TODO
        <div
          className={`relative w-full ${aspectRatioClass} border-2 border-dashed rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => e.currentTarget.focus()}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium">Drop an image here</p>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                  disabled={disabled || isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
                >
                  Browse files
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/75">
              PNG, JPEG, WebP, GIF - any size (auto-resized)
            </p>
            <p className="text-xs text-muted-foreground/50">
              Focus and paste image or URL (Ctrl+V)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
