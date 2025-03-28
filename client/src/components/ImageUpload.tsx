import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CircularProgress } from "@mui/material";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
}

export const ImageUpload = ({ onImageSelect }: ImageUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(0);

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      onImageSelect(file);

      setTimeout(() => {
        clearInterval(interval);
        setIsUploading(false);
        setUploadProgress(100);
      }, 1000);
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps} = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    multiple: false,
  });

  return (
    <div {...getRootProps()} className="cursor-pointer group">
      <input {...getInputProps()} />
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-green-100 border-dashed rounded-lg hover:border-green-300 transition-colors">
        <div className="space-y-1 text-center">
          {isUploading ? (
            <div className="flex justify-center">
              <CircularProgress
                variant="determinate"
                value={uploadProgress}
                size={48}
                sx={{
                  color: "#16a34a", // green-600
                }}
              />
            </div>
          ) : previewUrl ? (
            <div className="relative w-24 h-24 mx-auto">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <span className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                  Upload a file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
