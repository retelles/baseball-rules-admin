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
  // FastAPI OAuth2 password flow expects form-encoded body
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const response = await apiClient.post<LoginResponse>('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return response.data
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout')
}
