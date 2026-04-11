import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import FileViewer from './FileViewer'
import api from '../services/api'
import toast from 'react-hot-toast'

// Create a context to provide the asset ID
export const AssetIdContext = React.createContext()

function FileViewerWithAsset({ assetId }) {
  return (
    <AssetIdContext.Provider value={assetId}>
      <FileViewer />
    </AssetIdContext.Provider>
  )
}

function ProofReviewer() {
  const { proof_id } = useParams()
  const [assetId, setAssetId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('[ProofReviewer] proof_id changed to:', proof_id)
    console.log('[ProofReviewer] Resetting assetId to null')
    // Reset assetId when proof_id changes to prevent showing wrong content
    setAssetId(null)
    setError(null)
    fetchProjectAndAsset()
    
    return () => {
      console.log('[ProofReviewer] Cleaning up for proof_id:', proof_id)
    }
  }, [proof_id])

  const fetchProjectAndAsset = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[ProofReviewer] Fetching project with share_token:', proof_id)
      
      // Fetch project using share_token
      const response = await api.get(`/versioning/projects/?share_token=${proof_id}`)
      console.log('Project response:', response.data)
      
      const projects = response.data.results || response.data || []
      
      if (projects.length === 0) {
        throw new Error('Project not found with this proof ID')
      }

      const project = projects[0]
      console.log('[ProofReviewer] Found project:', project.id, project.name, 'share_token:', project.share_token)

      // Fetch project assets
      try {
        const assetsResponse = await api.get(`/versioning/projects/${project.id}/assets/`)
        const assets = assetsResponse.data
        console.log('[ProofReviewer] Fetched assets:', assets)
        
        if (assets && assets.length > 0) {
          const firstAsset = assets[0]
          console.log('[ProofReviewer] Setting assetId to:', firstAsset.id, 'for asset:', firstAsset.name)
          setAssetId(firstAsset.id)
        } else {
          throw new Error('No assets found for this project')
        }
      } catch (assetsError) {
        console.error('Failed to fetch assets:', assetsError)
        // Try fallback method
        try {
          const allAssetsResponse = await api.get('/versioning/assets/')
          const projectAssets = allAssetsResponse.data.results?.filter(asset => asset.project === project.id)
          
          if (projectAssets && projectAssets.length > 0) {
            const firstAsset = projectAssets[0]
            console.log('Found first asset via fallback:', firstAsset)
            setAssetId(firstAsset.id)
          } else {
            throw new Error('No assets found for this project')
          }
        } catch (fallbackError) {
          throw new Error('Failed to load project assets')
        }
      }

    } catch (error) {
      console.error('Error in fetchProjectAndAsset:', error)
      setError(error.message || 'Failed to load proof')
      toast.error(error.message || 'Failed to load proof')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#000'
      }}>
        <div style={{ color: '#fff', fontSize: '1.2rem' }}>Loading proof...</div>
      </div>
    )
  }

  if (error || !assetId) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#000',
        flexDirection: 'column',
        gap: 20,
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>Proof Not Found</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Unable to Load Proof</h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
            {error || 'The proof could not be found or you may not have permission to view it.'}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
            Proof ID: {proof_id}
          </p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.close()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: '#0A84FF',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Close Window
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <FileViewerWithAsset key={assetId} assetId={assetId} />
}

export default ProofReviewer
