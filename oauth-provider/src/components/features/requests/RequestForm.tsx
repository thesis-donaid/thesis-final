"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Paperclip } from "lucide-react";

interface RequestFormProps {
    beneficiaryId: number;
    onSuccess: () => void;
}

export default function RequestForm({ beneficiaryId, onSuccess }: RequestFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        purpose: "",
        amount: "",
        date_needed: "",
        email: "",
        additional_notes: "",
        urgency_level: "LOW",
    });
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Step 1: Create the request
            const res = await fetch("/api/beneficiary/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    beneficiaryId,
                    amount: parseFloat(formData.amount),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create request");
            }

            const requestId = data.id;

            // Step 2: Upload files if any
            if (files.length > 0) {
                setUploadProgress(`Uploading ${files.length} file(s)...`);

                const formDataFiles = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formDataFiles.append("files", files[i]);
                }

                const uploadRes = await fetch(
                    `/api/beneficiary/requests/${requestId}/documents`,
                    {
                        method: "POST",
                        body: formDataFiles,
                    }
                );

                if (!uploadRes.ok) {
                    const uploadError = await uploadRes.json();
                    console.error("File upload error:", uploadError);
                    setError(`Request created but file upload failed: ${uploadError.error}`);
                }
            }

            setUploadProgress("");
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}

            {uploadProgress && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-2xl text-sm font-medium">
                    {uploadProgress}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purpose */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Purpose *
                    </label>
                    <input
                        type="text"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-gray-900"
                        placeholder="e.g., Tuition fee assistance"
                    />
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Amount (PHP) *
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            min="50"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-gray-900"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Date Needed */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Date Needed *
                    </label>
                    <input
                        type="date"
                        name="date_needed"
                        value={formData.date_needed}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-gray-900"
                    />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Contact Email *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-gray-900"
                        placeholder="your@email.com"
                    />
                </div>

                {/* Additional Notes */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        name="additional_notes"
                        value={formData.additional_notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-gray-900 resize-none"
                        placeholder="Any additional information..."
                    />
                </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Supporting Documents
                </label>
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-3xl p-8 hover:border-red-300 hover:bg-red-50/30 transition-all cursor-pointer group text-center"
                >
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-gray-900 font-bold">Click to upload files</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG, PDF up to 10MB each</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                        {files.map((file, index) => (
                            <div 
                                key={`${file.name}-${index}`}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow group"
                            >
                                <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                    {file.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-bold transition-all shadow-lg shadow-red-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Submit Support Request"
                )}
            </button>
        </form>
    );
}
