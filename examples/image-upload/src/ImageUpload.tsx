import { createImage } from "jazz-browser-media-images";
import { ProgressiveImg, useAccount } from "jazz-react";
import { ImageDefinition } from "jazz-tools";
import { ChangeEvent, useEffect, useRef, useState } from "react";

function Image({ image }: { image: ImageDefinition }) {
  return (
    <ProgressiveImg image={image}>
      {({ src }) => <img alt="" src={src} className="w-full h-auto" />}
    </ProgressiveImg>
  );
}

export default function ImageUpload() {
  const { me } = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        return "Upload in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup preview URL when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isUploading, previewUrl]);

  const onImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!me?.profile) return;

    const file = event.currentTarget.files?.[0];

    if (file) {
      // Cleanup any existing preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        setIsUploading(true);
        me.profile.image = await createImage(file, {
          owner: me.profile._owner,
        });
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploading(false);
        // Only cleanup preview URL and reset state after successful upload
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      }
    }
  };

  const deleteImage = () => {
    if (!me?.profile) return;
    me.profile.image = null;
  };

  // states
  // 1. empty - show image upload form form
  // 2. uploading - opacity-50, show spinner
  // 3. uploaded - show delete

  if (me?.profile?.image) {
    return (
      <>
        <Image image={me.profile.image} />

        <button type="button" onClick={deleteImage} className="mt-5">
          Delete image
        </button>
      </>
    );
  }

  if (previewUrl) {
    return (
      <div className="relative">
        <p className="z-10 absolute font-semibold text-gray-900 inset-0 flex items-center justify-center">
          Uploading image...
        </p>
        <img
          src={previewUrl}
          alt="Preview"
          className="opacity-50 w-full h-auto"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="image">Image</label>
      <input
        id="image"
        name="image"
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif, image/bmp"
        onChange={onImageChange}
      />
    </div>
  );
}
