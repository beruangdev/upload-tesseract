// components/FileUploadForm.tsx
"use client"; // Make this component a client component
import axios from "axios";
import React, { useEffect, useState } from "react";
import CustomFileSelector from "./CustomFileSelector";

const FileUploadForm = () => {
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {

  }, []);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      //convert `FileList` to `File[]`
      const _files = Array.from(e.target.files);
      setImages(_files);
      const formData = new FormData();
      images.forEach(async (image, i) => {
        formData.append(image.name, image);
      });
      setUploading(true);
      let { data } = await axios.post("/api/image", formData);
      console.log(
        "🚀 ~ file: FileUploadForm.tsx:23 ~ handleFileSelected ~ data:",
        data
      );
      setUploading(false);
    }
  };

  return (
    <form className="w-full">
      <div className="flex justify-between">
        <CustomFileSelector
          accept="image/png, image/jpeg"
          onChange={handleFileSelected}
        />
      </div>
      {/* <ImagePreview images={images} /> */}
    </form>
  );
};

export default FileUploadForm;
