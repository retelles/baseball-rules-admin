import apiClient from './client'

export interface RuleVersion {
  id: string
  version_label: string
  uploaded_at: string
  file_size_bytes: number
  is_active: boolean
  uploaded_by_email?: string
}

export interface RulesHistoryResponse {
  versions: RuleVersion[]
  total: number
}

export async function getActiveRules(): Promise<RuleVersion> {
  const response = await apiClient.get<RuleVersion>('/rules/active')
  return response.data
}

export async function getRulesHistory(): Promise<RulesHistoryResponse> {
  const response = await apiClient.get<RulesHistoryResponse>('/rules/history')
  return response.data
}

export async function uploadRules(
  file: File,
  versionLabel: string,
  onProgress?: (percent: number) => void,
): Promise<RuleVersion> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('version_label', versionLabel)

  const response = await apiClient.post<RuleVersion>('/rules/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total)
        onProgress(percent)
      }
    },
  })
  return response.data
}
