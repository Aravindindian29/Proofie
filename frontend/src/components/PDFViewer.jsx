import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Worker, Viewer } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'

// Import PDF.js styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

const PDFViewer = forwardRef(({ fileUrl, fileName, onPageChange, initialPage }, ref) => {
  const pageNavigationPluginInstance = pageNavigationPlugin()
  const { jumpToPage } = pageNavigationPluginInstance

  // Create default layout plugin instance with full toolbar
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
    ],
    toolbarPlugin: {
      searchPlugin: {
        keyword: '',
      },
    },
  })

  // Expose jumpToPage method to parent
  useImperativeHandle(ref, () => ({
    jumpToPage: (pageNumber) => {
      console.log('jumpToPage called with:', pageNumber)
      console.log('Jumping to page:', pageNumber - 1)
      jumpToPage(pageNumber - 1) // Convert to 0-based index
    }
  }))

  const handlePageChange = (e) => {
    if (onPageChange) {
      // Page index is 0-based, but we want 1-based page numbers
      onPageChange(e.currentPage + 1)
    }
  }

  const handleDocumentLoad = (e) => {
    console.log('PDF loaded, viewer instance:', e)
    console.log('Document loaded successfully')
    
    // Jump to initial page if specified
    if (initialPage && initialPage > 1) {
      setTimeout(() => {
        jumpToPage(initialPage - 1)
      }, 100)
    }
  }

  return (
    <div 
      style={{ 
        height: '100%', 
        width: '100%',
        background: '#525659' // PDF.js default dark background
      }}
    >
      <Worker workerUrl="/pdf.worker.min.js">
        <Viewer
          fileUrl={fileUrl}
          plugins={[defaultLayoutPluginInstance, pageNavigationPluginInstance]}
          defaultScale={1.0}
          theme={{
            theme: 'dark',
          }}
          onPageChange={handlePageChange}
          onDocumentLoad={handleDocumentLoad}
          initialPage={initialPage ? initialPage - 1 : 0}
        />
      </Worker>
    </div>
  )
})

export default PDFViewer
