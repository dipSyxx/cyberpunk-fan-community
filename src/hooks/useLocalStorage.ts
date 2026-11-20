import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue === null ? fallback : (JSON.parse(storedValue) as T)
  } catch (error) {
    console.warn(`Could not read localStorage key "${key}".`, error)
    return fallback
  }
}

export function writeStoredValue<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`Could not write localStorage key "${key}".`, error)
    return false
  }
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, fallback))

  useEffect(() => {
    writeStoredValue(key, value)
  }, [key, value])

  return [value, setValue]
}
