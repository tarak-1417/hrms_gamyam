import { createSlice } from '@reduxjs/toolkit'
import { getInitialPlatformState } from '../../data/dataService'
import { todayDate } from '../hrmsHelpers'

const platformSlice = createSlice({
  name: 'platform',
  initialState: getInitialPlatformState(),
  reducers: {
    resetPlatform() {
      return getInitialPlatformState()
    },
    updatePlatformSettings(state, action) {
      state.settings = { ...state.settings, ...action.payload }
    },
    upsertOrganization(state, action) {
      const payload = action.payload
      if (!state.organizations) state.organizations = []
      if (payload.id && state.organizations.some((o) => o.id === payload.id)) {
        state.organizations = state.organizations.map((o) =>
          o.id === payload.id ? { ...o, ...payload } : o,
        )
      } else {
        const id = payload.id || `org-${state.nextId}`
        if (!payload.id) state.nextId += 1
        state.organizations.push({
          status: 'active',
          employeeCount: 0,
          createdAt: todayDate(),
          ...payload,
          id,
        })
      }
    },
    deleteOrganization(state, action) {
      const id = action.payload
      state.organizations = (state.organizations || []).filter((o) => o.id !== id)
    },
    restoreOrganizationFromTrash(state, action) {
      const org = action.payload
      if (!org) return
      if (state.organizations.some((o) => o.id === org.id)) return
      state.organizations.push(org)
    },
    setOrganizationStatus(state, action) {
      const { id, status } = action.payload
      const org = state.organizations?.find((o) => o.id === id)
      if (org) org.status = status
    },
    upsertPlatformUser(state, action) {
      const payload = action.payload
      if (!state.users) state.users = []
      if (payload.id && state.users.some((u) => u.id === payload.id)) {
        state.users = state.users.map((u) => {
          if (u.id !== payload.id) return u
          const next = { ...u, ...payload }
          if (!payload.password) delete next.password
          return next
        })
      } else {
        const id = payload.id || `u-${state.nextId}`
        if (!payload.id) state.nextId += 1
        state.users.push({
          blocked: false,
          organizationId: null,
          ...payload,
          id,
        })
      }
    },
    deletePlatformUser(state, action) {
      const id = action.payload
      state.users = (state.users || []).filter((u) => u.id !== id || u.role === 'superadmin')
    },
    restorePlatformUserFromTrash(state, action) {
      const user = action.payload
      if (!user || user.role === 'superadmin') return
      if (state.users.some((u) => u.id === user.id)) return
      state.users.push(user)
    },
    setUserBlocked(state, action) {
      const { id, blocked } = action.payload
      const user = state.users?.find((u) => u.id === id)
      if (user && user.role !== 'superadmin') user.blocked = blocked
    },
    resetUserPassword(state, action) {
      const { id, password } = action.payload
      const user = state.users?.find((u) => u.id === id)
      if (user) user.password = password
    },
  },
})

export const {
  resetPlatform,
  updatePlatformSettings,
  upsertOrganization,
  deleteOrganization,
  restoreOrganizationFromTrash,
  setOrganizationStatus,
  upsertPlatformUser,
  deletePlatformUser,
  restorePlatformUserFromTrash,
  setUserBlocked,
  resetUserPassword,
} = platformSlice.actions

export default platformSlice.reducer
