import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
  },
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload
    },
    logout(state) {
      state.user = null
    },
    updateSession(state, action) {
      if (state.user) {
        Object.assign(state.user, action.payload)
      }
    },
  },
})

export const { loginSuccess, logout, updateSession } = authSlice.actions
export default authSlice.reducer
