import { useState, useRef } from 'react';
import { IoClose, IoCloudUpload, IoDocument, IoImage, IoVideocam } from 'react-icons/io5';
import api from '../api';

const FileUploadModal = ({ onFileUpload, onClose }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // show different icon based on file type
    const getFileIcon = (type) => {
        if (type?.startsWith('image/')) return <IoImage className="w-8 h-8 text-purple-500" />;
        if (type?.startsWith('video/')) return <IoVideocam className="w-8 h-8 text-purple-500" />;
        return <IoDocument className="w-8 h-8 text-purple-500" />;
    };

    // turn bytes into human readable format (KB, MB, etc)
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // keep file size reasonable (5mb max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum size is 5MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);

        // fake progress bar to make it feel smoother
        const interval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const response = await api.post('/upload/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            clearInterval(interval);
            setUploadProgress(100);

            if (response.data.success) {
                setTimeout(() => {
                    onFileUpload(response.data.file);
                }, 500);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
            clearInterval(interval);
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Upload File</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={uploading}
                    >
                        <IoClose className="w-5 h-5" />
                    </button>
                </div>

                {!uploading ? (
                    <>
                        {!selectedFile ? (
                            // file selection screen
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                            >
                                <IoCloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">Click to select a file</p>
                                <p className="text-xs text-gray-400 mt-2">Max size: 5MB</p>
                                <p className="text-xs text-gray-400">Images, Videos, Documents</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                                />
                            </div>
                        ) : (
                            // file preview before upload
                            <div className="text-center">
                                <div className="flex justify-center mb-3">
                                    {getFileIcon(selectedFile.type)}
                                </div>
                                <p className="font-medium text-gray-800 break-all">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Change
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // uploading progress screen
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 mb-2">Uploading...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{uploadProgress}%</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadModal;