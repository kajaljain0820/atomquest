import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Simple in-memory brute-force login rate limiter
interface RateLimitData {
  attempts: number
  blockedUntil: number
}
const loginAttempts = new Map<string, RateLimitData>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 60 * 1000 // 60 seconds

function trackFailedAttempt(email: string) {
  const now = Date.now()
  const limit = loginAttempts.get(email) || { attempts: 0, blockedUntil: 0 }
  
  limit.attempts += 1
  if (limit.attempts >= MAX_ATTEMPTS) {
    limit.blockedUntil = now + BLOCK_DURATION
  }
  
  loginAttempts.set(email, limit)
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "my-super-secret-key-for-dev",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@goalforge.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password")
        }

        const email = credentials.email.toLowerCase().trim()
        const now = Date.now()
        const rateLimit = loginAttempts.get(email)

        // Check if blocked by rate limiter
        if (rateLimit && rateLimit.blockedUntil > now) {
          const waitTime = Math.ceil((rateLimit.blockedUntil - now) / 1000)
          throw new Error(`Too many login attempts. Please try again in ${waitTime} seconds.`)
        }

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          trackFailedAttempt(email)
          throw new Error("Invalid login credentials")
        }

        // Compare secure bcrypt password hash
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          trackFailedAttempt(email)
          throw new Error("Invalid login credentials")
        }

        // Clear attempts on successful login
        loginAttempts.delete(email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
