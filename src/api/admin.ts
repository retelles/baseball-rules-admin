import apiClient from './client'

export interface AdminStats {
  total_users: number
  active_users_30d: number
  logins_today: number
  searches_today: number
}

export interface AdminUser {
  id: string
  email: string
  role: string
  is_active: boolean
  joined_at: string
}

export interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  page_size: number
}

export async function getStats(): Promise<AdminStats> {
  const response = await apiClient.get<AdminStats>('/admin/stats/overview')
  return response.data
}

export async function getUsers(
  page = 1,
  search = '',
): Promise<UsersResponse> {
  const response = await apiClient.get<UsersResponse>('/admin/users', {
    params: { page, search: search || undefined },
  })
  return response.data
}

export async function disableUser(id: string): Promise<void> {
  await apiClient.post(`/admin/users/${id}/disable`)
}

export async function enableUser(id: string): Promise<void> {
  await apiClient.post(`/admin/users/${id}/enable`)
}
