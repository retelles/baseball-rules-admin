import apiClient from './client'

export interface LoginResponse {
  access_token: string
  token_type: string
  role?: string
  user?: {
    email: string
    role: string
  }
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return response.data
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout')
}
