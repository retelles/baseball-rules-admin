import { useEffect, useRef, useState, DragEvent, ChangeEvent } from 'react'
import {
  getActiveRules,
  getRulesHistory,
  uploadRules,
  RuleVersion,
} from '../api/rules'
import axios from 'axios'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Rules() {
  const [activeRule, setActiveRule] = useState<RuleVersion | null>(null)
  const [history, setHistory] = useState<RuleVersion[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Upload state
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [versionLabel, setVersionLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadData() {
    setLoadingData(true)
    setLoadError(null)
    try {
      const [active, hist] = await Promise.all([
        getActiveRules().catch(() => null),
        getRulesHistory().catch(() => []),
      ])
      setActiveRule(active)
      setHistory(hist)
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setLoadError('Cannot reach the server. Check your network connection.')
      } else {
        setLoadError('Failed to load rulebook data. Please refresh the page.')
      }
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  function validateAndSetFile(file: File) {
    setUploadError(null)
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadError('Only PDF files are accepted.')
      return
    }
    setSelectedFile(file)
    setUploadSuccess(null)
  }

  async function handleUpload() {
    if (!selectedFile || !versionLabel.trim()) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(0)

    try {
      const newVersion = await uploadRules(selectedFile, versionLabel.trim(), setUploadProgress)
      setUploadSuccess(`Version "${newVersion.version_label}" uploaded successfully.`)
      setSelectedFile(null)
      setVersionLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadData()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail
        if (typeof detail === 'string') {
          setUploadError(detail)
        } else if (!err.response) {
          setUploadError('Cannot reach the server. Check your network connection.')
        } else {
          setUploadError('Upload failed. Please try again.')
        }
      } else {
        setUploadError('Upload failed. Please try again.')
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rulebook</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the active PDF rulebook served to app users.
        </p>
      </div>

      {loadError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <ErrorIcon />
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Active rulebook */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Active Rulebook</h2>

        {loadingData ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ) : activeRule ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Version</p>
              <p className="text-sm font-semibold text-gray-900">{activeRule.version_label}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uploaded</p>
              <p className="text-sm text-gray-900">{formatDate(activeRule.uploaded_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">File Size</p>
              <p className="text-sm text-gray-900">{formatBytes(activeRule.file_size_bytes)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active rulebook. Upload one below.</p>
        )}
      </div>

      {/* Upload section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Upload New Rulebook</h2>

        {/* Success banner */}
        {uploadSuccess && (
          <div className="mb-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-green-700">{uploadSuccess}</p>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <ErrorIcon />
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}

        {/* Drag-and-drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragOver
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
              <p className="text-xs text-brand-600">Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">PDF files only</p>
            </div>
          )}
        </div>

        {/* Version label + upload button */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            placeholder="Version label (e.g. 2024 Official Rules)"
            className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                       placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !versionLabel.trim() || uploading}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300
                       text-white text-sm font-semibold rounded-lg transition-colors
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                       disabled:cursor-not-allowed whitespace-nowrap"
          >
            {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
          </button>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-200 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Upload history table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Upload History</h2>

        {loadingData ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">No uploads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">
                    Version
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">
                    Uploaded
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">
                    Size
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((v) => (
                  <tr key={v.id} className="py-3">
                    <td className="py-3 pr-4 font-medium text-gray-900">{v.version_label}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatDate(v.uploaded_at)}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatBytes(v.file_size_bytes)}</td>
                    <td className="py-3">
                      {v.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          Archived
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorIcon() {
  return (
    <svg
      className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  )
}
