"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, CheckCircle, AlertCircle, FileText, X, Table } from "lucide-react";
import toast from "react-hot-toast";

const EXPECTED_COLUMNS = ["transactionId", "date", "productId", "productName", "productCat", "quantity", "unitPrice", "totalAmount"];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1); // 1: upload, 2: map, 3: result

  const parseFile = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (ext === "csv") {
      Papa.parse(f, {
        header: true, skipEmptyLines: true,
        complete: (res) => {
          const cols = Object.keys(res.data[0] || {});
          setColumns(cols);
          setPreview(res.data.slice(0, 5));
          // Auto-map columns (case-insensitive)
          const autoMap = {};
          EXPECTED_COLUMNS.forEach(ec => {
            const found = cols.find(c => c.toLowerCase().replace(/[^a-z]/g, "") === ec.toLowerCase().replace(/[^a-z]/g, ""));
            if (found) autoMap[ec] = found;
          });
          setColumnMap(autoMap);
          setStep(2);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false });
        const cols = Object.keys(data[0] || {});
        setColumns(cols);
        setPreview(data.slice(0, 5));
        const autoMap = {};
        EXPECTED_COLUMNS.forEach(ec => {
          const found = cols.find(c => c.toLowerCase().replace(/[^a-z]/g, "") === ec.toLowerCase().replace(/[^a-z]/g, ""));
          if (found) autoMap[ec] = found;
        });
        setColumnMap(autoMap);
        setStep(2);
      };
      reader.readAsBinaryString(f);
    }
  };

  const onDrop = useCallback((accepted) => {
    if (accepted.length === 0) return;
    const f = accepted[0];
    setFile(f);
    setResult(null);
    parseFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] },
    maxFiles: 1,
  });

  async function handleUpload() {
    // Re-parse with mapping
    setUploading(true);
    const parseAndSend = (rawData) => {
      const rows = rawData.map(row => {
        const mapped = {};
        EXPECTED_COLUMNS.forEach(ec => {
          const colName = columnMap[ec];
          mapped[ec] = colName ? row[colName] : undefined;
        });
        return mapped;
      });
      return fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
    };

    try {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "csv") {
        Papa.parse(file, {
          header: true, skipEmptyLines: true,
          complete: async (res) => {
            const r = await parseAndSend(res.data);
            const d = await r.json();
            if (r.ok) { setResult(d); setStep(3); toast.success(`Imported ${d.inserted} records!`); }
            else toast.error(d.error || "Upload failed");
            setUploading(false);
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const wb = XLSX.read(e.target.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          const r = await parseAndSend(data);
          const d = await r.json();
          if (r.ok) { setResult(d); setStep(3); toast.success(`Imported ${d.inserted} records!`); }
          else toast.error(d.error || "Upload failed");
          setUploading(false);
        };
        reader.readAsBinaryString(file);
      }
    } catch (err) {
      toast.error("Upload failed"); setUploading(false);
    }
  }

  const reset = () => { setFile(null); setPreview([]); setColumns([]); setColumnMap({}); setResult(null); setStep(1); };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-4xl font-display text-jollibee-red tracking-wider">UPLOAD DATA</h1>
        <p className="text-jollibee-brown/60 font-medium text-sm">Import sales data from CSV or Excel files</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3">
        {["Upload File", "Map Columns", "Results"].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-jollibee-red text-white" : "bg-gray-200 text-gray-500"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-semibold ${step === i + 1 ? "text-jollibee-red" : "text-gray-400"}`}>{s}</span>
            {i < 2 && <div className={`w-10 h-0.5 ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Drop zone */}
      {step === 1 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive ? "border-jollibee-yellow bg-jollibee-yellow/10" : "border-jollibee-yellow/40 hover:border-jollibee-yellow hover:bg-jollibee-cream"}`}
        >
          <input {...getInputProps()} />
          <Upload size={40} className="mx-auto mb-4 text-jollibee-yellow" />
          <h3 className="font-display text-2xl text-jollibee-brown tracking-wide mb-2">DROP YOUR FILE HERE</h3>
          <p className="text-gray-400 text-sm">Supports CSV, XLS, XLSX</p>
          <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-jollibee-yellow text-jollibee-brown font-bold text-sm">
            Browse Files
          </div>
        </div>
      )}

      {/* Step 2: Column mapping */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={18} className="text-jollibee-yellow" />
              <h3 className="font-bold text-jollibee-brown">{file?.name}</h3>
              <button onClick={reset} className="ml-auto text-gray-400 hover:text-red-500"><X size={16} /></button>
            </div>
            <h4 className="font-bold text-jollibee-brown/70 text-sm uppercase tracking-wider mb-3">Map Columns</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXPECTED_COLUMNS.map((ec) => (
                <div key={ec} className="flex items-center gap-2">
                  <label className="text-xs font-bold text-jollibee-brown/60 w-28 uppercase tracking-wide flex-shrink-0">{ec}</label>
                  <select
                    value={columnMap[ec] || ""}
                    onChange={(e) => setColumnMap(m => ({ ...m, [ec]: e.target.value }))}
                    className="input-field flex-1 text-sm py-1.5"
                  >
                    <option value="">— skip —</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {columnMap[ec] ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> : <AlertCircle size={14} className="text-orange-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="card overflow-hidden p-0">
            <div className="px-5 py-3 border-b border-jollibee-yellow/20 flex items-center gap-2">
              <Table size={16} className="text-jollibee-brown/60" />
              <h4 className="font-bold text-jollibee-brown text-sm">Preview (first 5 rows)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>{columns.map(c => <th key={c} className="table-header whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-jollibee-cream/50">
                      {columns.map(c => <td key={c} className="table-cell whitespace-nowrap max-w-[120px] truncate">{row[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="btn-outline">Back</button>
            <button onClick={handleUpload} disabled={uploading} className="btn-primary flex-1">
              {uploading ? "Importing..." : "Import Data"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="card border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-green-500" />
              <h3 className="font-bold text-jollibee-brown text-lg">Import Complete!</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-display text-green-600">{result.inserted}</p>
                <p className="text-xs font-bold text-green-600 uppercase">Inserted</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-2xl font-display text-orange-600">{result.skipped}</p>
                <p className="text-xs font-bold text-orange-600 uppercase">Skipped</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <p className="text-2xl font-display text-red-600">{result.errors}</p>
                <p className="text-xs font-bold text-red-600 uppercase">Errors</p>
              </div>
            </div>
          </div>

          {result.newProducts?.length > 0 && (
            <div className="card border-l-4 border-l-jollibee-yellow">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-jollibee-yellow" />
                <h4 className="font-bold text-jollibee-brown">{result.newProducts.length} new products detected in data (not in POS)</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.newProducts.map((p, i) => (
                  <span key={i} className="badge bg-jollibee-yellow/20 text-jollibee-brown">{p}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Go to Products page to add them via Suggestive Add.</p>
            </div>
          )}

          <button onClick={reset} className="btn-primary">Upload Another File</button>
        </div>
      )}

      {/* Format guide */}
      {step === 1 && (
        <div className="card bg-jollibee-cream">
          <h4 className="font-bold text-jollibee-brown mb-3 text-sm uppercase tracking-wider">Expected Format</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr>{EXPECTED_COLUMNS.map(c => <th key={c} className="table-header">{c}</th>)}</tr></thead>
              <tbody>
                <tr>
                  <td className="table-cell font-mono">TXN-001</td>
                  <td className="table-cell font-mono">2024-01-15</td>
                  <td className="table-cell font-mono">JB-001</td>
                  <td className="table-cell font-mono">Chickenjoy</td>
                  <td className="table-cell font-mono">Chicken</td>
                  <td className="table-cell font-mono">2</td>
                  <td className="table-cell font-mono">99.00</td>
                  <td className="table-cell font-mono">198.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
