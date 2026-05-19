import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from './useAuth'
import { auditActorFromUser } from '../utils/auditLogUtils'
import { appendAuditLog, softDeleteToTrash } from '../store/slices/hrmsSlice'
import {
  resetPlatform,
  updatePlatformSettings,
  upsertOrganization,
  deleteOrganization,
  setOrganizationStatus,
  upsertPlatformUser,
  deletePlatformUser,
  setUserBlocked,
  resetUserPassword,
} from '../store/slices/platformSlice'
import { setToast, clearToast } from '../store/slices/uiSlice'

export function usePlatform() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const platform = useSelector((state) => state.platform)
  const toast = useSelector((state) => state.ui.toast)

  const logPlatform = useCallback(
    (entry) => {
      dispatch(appendAuditLog({ ...auditActorFromUser(user), scope: 'platform', ...entry }))
    },
    [dispatch, user],
  )

  const showToast = useCallback(
    (message) => {
      dispatch(setToast(message))
      setTimeout(() => dispatch(clearToast()), 3000)
    },
    [dispatch],
  )

  return {
    ...platform,
    toast,
    showToast,
    resetPlatform: () => {
      dispatch(resetPlatform())
      showToast('Platform data reloaded from JSON')
    },
    updateSettings: (payload) => {
      dispatch(updatePlatformSettings(payload))
      logPlatform({
        action: 'Updated global settings',
        category: 'platform',
        targetType: 'settings',
        targetLabel: payload.platformName || 'Platform',
        details: 'Platform configuration',
      })
      showToast('Global settings saved')
    },
    saveOrganization: (payload) => {
      dispatch(upsertOrganization(payload))
      logPlatform({
        action: payload.id ? 'Updated platform organization' : 'Created platform organization',
        category: 'platform',
        targetType: 'tenant',
        targetId: payload.id,
        targetLabel: payload.name,
        details: `Plan: ${payload.plan || '—'}`,
      })
      showToast(payload.id ? 'Organization updated' : 'Organization created')
    },
    removeOrganization: (id) => {
      const org = platform.organizations?.find((o) => o.id === id)
      if (!org) return
      dispatch(deleteOrganization(id))
      dispatch(
        softDeleteToTrash({
          entityType: 'platformOrganization',
          entityId: id,
          label: org.name,
          scope: 'platform',
          data: { organization: org },
          deletedBy: auditActorFromUser(user),
        }),
      )
      logPlatform({
        action: 'Moved organization to recycle bin',
        category: 'platform',
        targetType: 'tenant',
        targetId: id,
        targetLabel: org.name,
        details: 'Soft delete — recoverable',
      })
      showToast('Organization moved to recycle bin')
    },
    activateOrganization: (id, active) => {
      const org = platform.organizations?.find((o) => o.id === id)
      dispatch(setOrganizationStatus({ id, status: active ? 'active' : 'inactive' }))
      logPlatform({
        action: active ? 'Activated organization' : 'Deactivated organization',
        category: 'platform',
        targetType: 'tenant',
        targetId: id,
        targetLabel: org?.name || id,
        details: active ? 'Status: active' : 'Status: inactive',
      })
      showToast(active ? 'Organization activated' : 'Organization deactivated')
    },
    saveUser: (payload) => {
      dispatch(upsertPlatformUser(payload))
      logPlatform({
        action: payload.id ? 'Updated user' : 'Created user',
        category: 'user',
        targetType: 'user',
        targetId: payload.id,
        targetLabel: payload.name || payload.email,
        details: `Role: ${payload.role}`,
      })
      showToast(payload.id ? 'User updated' : 'User created')
    },
    removeUser: (id) => {
      const u = platform.users?.find((x) => x.id === id)
      if (!u || u.role === 'superadmin') return
      dispatch(deletePlatformUser(id))
      dispatch(
        softDeleteToTrash({
          entityType: 'platformUser',
          entityId: id,
          label: u.name || u.email,
          scope: 'platform',
          data: { user: u },
          deletedBy: auditActorFromUser(user),
        }),
      )
      logPlatform({
        action: 'Moved user to recycle bin',
        category: 'user',
        targetType: 'user',
        targetId: id,
        targetLabel: u?.name || id,
        details: u?.email || '',
      })
      showToast('User moved to recycle bin')
    },
    blockUser: (id, blocked) => {
      const u = platform.users?.find((x) => x.id === id)
      dispatch(setUserBlocked({ id, blocked }))
      logPlatform({
        action: blocked ? 'Blocked user' : 'Unblocked user',
        category: 'user',
        targetType: 'user',
        targetId: id,
        targetLabel: u?.name || id,
        details: u?.email || '',
      })
      showToast(blocked ? 'User blocked' : 'User unblocked')
    },
    resetPassword: (id, password) => {
      const u = platform.users?.find((x) => x.id === id)
      dispatch(resetUserPassword({ id, password }))
      logPlatform({
        action: 'Reset user password',
        category: 'security',
        targetType: 'user',
        targetId: id,
        targetLabel: u?.name || id,
        details: 'Password reset by Super Admin',
      })
      showToast('Password reset')
    },
  }
}
