// contexts/auth-context.tsx
"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getTelemetry } from "@/lib/backend-client" // Assuming you use this to validate

type AuthStatus = "missing" | "validating" | "valid" | "invalid"

type AuthContextType = {
    apiKey: string
    authStatus: AuthStatus
    setApiKey: (value: string) => void
    }

const STORAGE_KEY = "vrfb.apiKey"
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [apiKey, setApiKeyState] = useState("")
    const [authStatus, setAuthStatus] = useState<AuthStatus>("missing")

    // 1. Hydrate from localStorage safely (Fixes Next.js hydration warning)
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            setApiKeyState(stored)
            setAuthStatus("validating")
        }
    }, [])

    // 2. Validate the key whenever it changes
    useEffect(() => {
        if (!apiKey) {
            setAuthStatus("missing")
            return
        }

        let isDisposed = false
        setAuthStatus("validating")

        // We do a lightweight fetch just to prove the key works
        getTelemetry({ apiKey, deviceId: "vrfb1", limit: 1, offset: 0 })
            .then(() => {
                if (!isDisposed) setAuthStatus("valid")
            })
            .catch(() => {
                if (!isDisposed) setAuthStatus("invalid")
            })

        return () => {
            isDisposed = true
        }
    }, [apiKey])

    const setApiKey = (value: string) => {
        const trimmed = value.trim()
        setApiKeyState(trimmed)
        localStorage.setItem(STORAGE_KEY, trimmed)
    }

    const value = useMemo(
        () => ({ apiKey, authStatus, setApiKey }),
        [apiKey, authStatus]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within an AuthProvider")
    return context
}