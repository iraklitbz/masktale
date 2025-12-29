/**
 * Authentication Type Definitions
 * Types for Strapi authentication system
 */

export interface User {
  id: number
  username: string
  email: string
  provider: string
  confirmed: boolean
  blocked: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  identifier: string // email or username
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  code: string
  password: string
  passwordConfirmation: string
}

export interface AuthResponse {
  jwt: string
  user: User
}

export interface AuthError {
  message: string
  status?: number
}
