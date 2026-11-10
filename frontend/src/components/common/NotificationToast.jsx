import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useNotification } from '../../contexts/NotificationContext'

const NotificationToast = () => {
  const { notifications, removeNotification } = useNotification()

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-[var(--success,#258265)]" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-[var(--danger,#C94C4C)]" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-[var(--warning,#C18120)]" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-[var(--info,#1677A8)]" />
    }
  }

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--success-light,rgba(37,130,101,0.12))] border-[var(--success,#258265)]/30'
      case 'error':
        return 'bg-[var(--danger-light,rgba(201,76,76,0.12))] border-[var(--danger,#C94C4C)]/30'
      case 'warning':
        return 'bg-[var(--warning-light,rgba(193,129,32,0.12))] border-[var(--warning,#C18120)]/30'
      case 'info':
      default:
        return 'bg-[var(--info-light,rgba(22,119,168,0.12))] border-[var(--info,#1677A8)]/30'
    }
  }

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-[var(--success,#258265)]'
      case 'error':
        return 'text-[var(--danger,#C94C4C)]'
      case 'warning':
        return 'text-[var(--warning,#C18120)]'
      case 'info':
      default:
        return 'text-[var(--info,#1677A8)]'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className={`max-w-sm w-full ${getBackgroundColor(notification.type)} border rounded-lg shadow-lg p-4`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`inline-flex ${getTextColor(notification.type)} hover:bg-opacity-20 hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationToast 