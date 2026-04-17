import React, { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";

export function ProfileBg({ defaultImage, onFileSelected }: { defaultImage?: string, onFileSelected: (file: File | null) => void }) {
  const [hideDefault, setHideDefault] = useState(false);
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange, handleRemove } =
    useImageUpload({ 
        onUpload: (url, file) => onFileSelected(file)
    });

  const currentImage = previewUrl || (!hideDefault ? defaultImage : null);

  const handleImageRemove = () => {
    handleRemove();
    setHideDefault(true);
    onFileSelected(null);
  };

  return (
    <div className="h-32 mb-10">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted rounded-t-xl border-x border-t border-border">
        {currentImage && (
          <img
            className="h-full w-full object-cover"
            src={currentImage}
            alt="Profile background"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <button
            type="button"
            className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
            onClick={handleThumbnailClick}
          >
            <ImagePlus size={16} strokeWidth={2} />
          </button>
          {currentImage && (
            <button
              type="button"
              className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
              onClick={handleImageRemove}
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
}

export function AvatarEditor({ defaultImage, onFileSelected }: { defaultImage?: string, onFileSelected: (file: File | null) => void }) {
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange } = useImageUpload({
    onUpload: (url, file) => onFileSelected(file)
  });

  const currentImage = previewUrl || defaultImage;

  return (
    <div className="-mt-20 px-6 relative z-10">
      <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-card shadow-lg">
        {currentImage ? (
          <img
            src={currentImage}
            className="h-full w-full object-cover"
            alt="Profile avatar"
          />
        ) : (
            <div className="bg-accent/20 w-full h-full" />
        )}
        <button
          type="button"
          className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
          onClick={handleThumbnailClick}
        >
          <ImagePlus size={16} strokeWidth={2} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
}
