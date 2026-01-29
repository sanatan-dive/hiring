
"use client";
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FileUpload = ({ onUpload }: { onUpload: (data: any) => void }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);

   const parseFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
       console.log("Parsed Resume JSON:", data.resume);
       onUpload(data.resume);

      } else {
        console.error('Error parsing file:', data.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }, [onUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    parseFile(file);
  }, [parseFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });
  
 
  
  


  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input {...getInputProps()} />
      <AnimatePresence>
        {uploadedFile ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center"
          >
            <FileIcon className="w-12 h-12 text-blue-500" />
            <p className="mt-2 text-sm font-medium text-gray-700">{uploadedFile.name}</p>
            <p className="text-xs text-gray-500">{Math.round(uploadedFile.size / 1024)} KB</p>
            <motion.button
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={removeFile}
              className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full text-gray-600 hover:bg-red-200 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center"
          >
            <UploadCloud className="w-12 h-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop the files here ...' : "Drag 'n' drop your resume here, or click to select"}
            </p>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX (MAX. 5MB)</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isHovering && !uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded-full text-xs">
              <span>Upload Resume</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
