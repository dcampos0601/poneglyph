"use client";

import React, { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        const count = data.rows ?? data.count ?? 0;
        setStatus(`Success! Processed ${count} records.`);
      } else {
        setStatus(`Error: ${data.error ?? "Upload failed"}`);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setStatus("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const isSuccess = status.startsWith("Success");
  const isError = status && !isSuccess;

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h1 className="text-xl font-semibold mb-4">Import Leads/Accounts</h1>
        <p className="text-sm text-slate-500 mb-6">
          Upload a CSV or Excel (.xlsx) file to process data on the server.
        </p>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-100 file:text-slate-700
              hover:file:bg-slate-200"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>

        {status && (
          <div
            className={`mt-4 rounded p-2 text-sm ${
              isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
