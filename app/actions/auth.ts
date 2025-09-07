'use server'

import { z } from 'zod'
import {
  verifyPassword,
  createSession,
  createUser,
  deleteSession,
} from '@/lib/auth'
import { getUserByEmail } from '@/lib/dal'
import { mockDelay } from '@/lib/utils'
import { redirect } from 'next/navigation'

// Define Zod schema for signin validation
const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Define Zod schema for signup validation
const SignUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}

export async function signIn(formData: FormData): Promise<ActionResponse> {
  try {
    await mockDelay(700)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const validationResult = SignInSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    const user = await getUserByEmail(data.email)
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          email: ['Invalid email or password'],
        },
      }
    }

    const isPasswordValid = await verifyPassword(data.password, user.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          password: ['Invalid email or password'],
        },
      }
    }

    await createSession(user.id)

    return {
      success: true,
      message: 'Signed in Successfully',
    }
  } catch (error) {
    console.error('Sign in error', error)
    return {
      success: false,
      message: 'An error occured while signing in',
      error: 'Failed to sign in',
    }
  }
}


export async function signUp(formData: FormData): Promise<ActionResponse> {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string
    }
    
    const validationResult = SignUpSchema.safeParse(data)
    if(!validationResult.success) { 
      return { 
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      }
    } 

    const existingUser = await getUserByEmail(data.email)
    if(existingUser) {
      return {
        success: false, 
        message: 'User with this email already exists',
        errors: {
          email: ['User with this email already exists'],
        }
      }
    }

    const user = await createUser(data.email, data.password)
    if(!user) {
      return {
        success: false, 
        message: 'Failed to create user',
        error: 'Failed to create user',
      }
    }

    await createSession(user.id) 
    return {
      success: true,
      message: 'Account created successfully',
    }
  } catch(error) {
    console.error('Sign up error', error)
    return {
      success: false,
      message: 'An error occured while creating your account',
      error: 'Failed to create account',
    }
  }
}

export async function signOut(): Promise<ActionResponse> {
    try {
      await deleteSession()
    } catch (error) {
      console.error('Sing out error', error)
      throw new Error('Failed to sign out')
    } finally {
      redirect('/signin')
    }
  }