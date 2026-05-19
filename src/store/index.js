import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import hrmsReducer from './slices/hrmsSlice'
import platformReducer from './slices/platformSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    hrms: hrmsReducer,
    platform: platformReducer,
  },
})
