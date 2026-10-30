
import { useState, type ReactNode } from 'react'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  LoaderCircle
} from 'lucide-react'

type DatasetResponse = {
  message: string
  filename: string
  metrics: {
    total_records: number
    total_columns: number
    numeric_columns: string[]
    numeric_totals: Record<string, number>
  }
  columns: string[]
  preview: Record<string, unknown>[]
  records: Record<string, unknown>[]
}

type DataUploadProps = {
  onDataProcessed: (data: DatasetResponse | null) => void
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function DataUpload({
  onDataProcessed
}: DataUploadProps) {
  const [result, setResult] = useState<DatasetResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFile(file?: File) {
    if (!file) return

    setError('')
    setResult(null)
    onDataProcessed(null)

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      setError('Please upload a CSV or Excel file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10 MB.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed.')
      }

      if (!data.records || !data.columns || !data.metrics) {
        throw new Error(
          'Invalid response from backend. Please check your backend API.'
        )
      }

      setResult(data)
      onDataProcessed(data)

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  function clearData() {
    setResult(null)
    setError('')
    onDataProcessed(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-indigo-600">
          DATA MANAGEMENT
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          Upload Dataset
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Upload your business data for backend processing and analysis.
        </p>
      </div>

      <label className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50/30">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          {loading ? (
            <LoaderCircle size={30} className="animate-spin" />
          ) : (
            <Upload size={30} />
          )}
        </div>

        <h3 className="mt-5 font-bold">
          {loading
            ? 'Processing your dataset...'
            : 'Click to upload your business dataset'}
        </h3>

        <p className="mt-2 text-xs text-slate-400">
          Supported formats: CSV, XLSX and XLS · Maximum 10 MB
        </p>

        <span className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white">
          Choose File
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-emerald-600" />

              <div>
                <p className="text-sm font-semibold">
                  {result.filename}
                </p>

                <p className="text-xs text-slate-500">
                  {result.metrics.total_records} records ·{' '}
                  {result.metrics.total_columns} columns
                </p>
              </div>

              <CheckCircle2 className="text-emerald-600" />
            </div>

            <button
              type="button"
              onClick={clearData}
              className="flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-rose-600"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              title="Total Records"
              value={result.metrics.total_records.toLocaleString()}
              icon={<Database />}
            />

            <Stat
              title="Total Columns"
              value={result.metrics.total_columns.toString()}
              icon={<FileText />}
            />

            <Stat
              title="Processing Status"
              value="Successful"
              icon={<CheckCircle2 />}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">
              Numeric Column Analysis
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Calculated by the Python backend
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.metrics.numeric_columns.map((column) => (
                <div
                  key={column}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <p className="text-xs text-slate-500">
                    {column}
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {(
                      result.metrics.numeric_totals[column] ?? 0
                    ).toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Total
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-bold">
                Dataset Preview
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                First 10 records returned by the backend
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {result.columns.map((column) => (
                      <th
                        key={column}
                        className="px-5 py-4 font-semibold text-slate-500"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {result.preview.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t border-slate-100"
                    >
                      {result.columns.map((column) => (
                        <td
                          key={column}
                          className="px-5 py-4 text-slate-600"
                        >
                          {String(row[column] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({
  title,
  value,
  icon
}: {
  title: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-400">
          {title}
        </p>

        <p className="mt-1 font-bold">
          {value}
        </p>
      </div>
    </div>
  )
}
