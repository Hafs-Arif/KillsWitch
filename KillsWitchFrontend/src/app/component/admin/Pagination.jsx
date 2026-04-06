"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="mt-12 flex justify-center items-center">
      <div className="flex items-center gap-4 border border-gray-500/30 rounded-full p-2 backdrop-blur-sm" style={{backgroundColor: '#1c1816'}}>
        <motion.button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-white/10"
          }`}
          whileHover={currentPage !== 1 ? { scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" } : {}}
          whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
            // Calculate which page numbers to show
            let pageNum
            if (totalPages <= 5) {
              pageNum = index + 1
            } else if (currentPage <= 3) {
              pageNum = index + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index
            } else {
              pageNum = currentPage - 2 + index
            }

            // Only render if pageNum is valid
            if (pageNum > 0 && pageNum <= totalPages) {
              return (
                <motion.button
                  key={pageNum}
                  onClick={() => {
                    onPageChange(pageNum)
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentPage === pageNum ? "text-white" : "text-gray-300 hover:opacity-80"
                  }`}
                  style={currentPage === pageNum ? {backgroundColor: '#c70007'} : {}}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {pageNum}
                </motion.button>
              )
            }
            return null
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-gray-500">...</span>
              <motion.button
                onClick={() => {
                  onPageChange(totalPages)
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-300 hover:opacity-80"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {totalPages}
              </motion.button>
            </>
          )}
        </div>

        <motion.button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentPage === totalPages ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-white/10"
          }`}
          whileHover={currentPage !== totalPages ? { scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" } : {}}
          whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  )
}
