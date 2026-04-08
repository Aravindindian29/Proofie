import React, { createContext, useContext, useState, useEffect } from 'react'

const LoadingContext = createContext()

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [loadingMessage, setLoadingMessage] = useState('Loading...')
  const [managedBy, setManagedBy] = useState('')

  const startLoading = (stage, manager) => {
    setIsLoading(true)
    setLoadingStage(stage)
    setManagedBy(manager)
    
    // Set contextual loading message based on stage
    switch (stage) {
      case 'initializing':
        setLoadingMessage('Initializing...')
        break
      case 'fetching-proof':
        setLoadingMessage('Loading proof...')
        break
      case 'fetching-file':
        setLoadingMessage('Loading file...')
        break
      case 'preparing-viewer':
        setLoadingMessage('Preparing viewer...')
        break
      case 'loading-pdf':
        setLoadingMessage('Loading PDF...')
        break
      default:
        setLoadingMessage('Loading...')
    }
  }

  const stopLoading = () => {
    setIsLoading(false)
    setLoadingStage('')
    setLoadingMessage('Loading...')
    setManagedBy('')
  }

  const updateStage = (stage) => {
    if (isLoading) {
      setLoadingStage(stage)
      
      // Update message based on new stage
      switch (stage) {
        case 'initializing':
          setLoadingMessage('Initializing...')
          break
        case 'fetching-proof':
          setLoadingMessage('Loading proof...')
          break
        case 'fetching-file':
          setLoadingMessage('Loading file...')
          break
        case 'preparing-viewer':
          setLoadingMessage('Preparing viewer...')
          break
        case 'loading-pdf':
          setLoadingMessage('Loading PDF...')
          break
        default:
          setLoadingMessage('Loading...')
      }
    }
  }

  const isManagedBy = (manager) => {
    return managedBy === manager
  }

  const value = {
    isLoading,
    loadingStage,
    loadingMessage,
    managedBy,
    startLoading,
    stopLoading,
    updateStage,
    isManagedBy
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export default LoadingContext
