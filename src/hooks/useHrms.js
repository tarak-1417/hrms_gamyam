import { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from './useAuth'
import { auditActorFromUser } from '../utils/auditLogUtils'
import {
  resetHrms,
  addActivity,
  appendAuditLog as appendAuditLogAction,
  updateLeaveStatus as updateLeaveStatusAction,
  submitLeave as submitLeaveAction,
  addEmployee as addEmployeeAction,
  bulkImportEmployees as bulkImportEmployeesAction,
  patchEmployee,
  updateEmployeePayroll as updateEmployeePayrollAction,
  toggleEmployeeTask as toggleEmployeeTaskAction,
  recordPortalLogin as recordPortalLoginAction,
  recordPortalLogout as recordPortalLogoutAction,
  recordCheckIn as recordCheckInAction,
  recordCheckOut as recordCheckOutAction,
  addJobPosting as addJobPostingAction,
  bulkImportJobPostings as bulkImportJobPostingsAction,
  updateJobStatus as updateJobStatusAction,
  recordGeneratedDocument as recordGeneratedDocumentAction,
  addDocumentTemplate as addDocumentTemplateAction,
  updateDocumentTemplate as updateDocumentTemplateAction,
  deleteDocumentTemplate as deleteDocumentTemplateAction,
  updateOrganization as updateOrganizationAction,
  upsertDepartment as upsertDepartmentAction,
  deleteDepartment as deleteDepartmentAction,
  upsertDesignation as upsertDesignationAction,
  deleteDesignation as deleteDesignationAction,
  upsertBranch as upsertBranchAction,
  deleteBranch as deleteBranchAction,
  setReportingStructure as setReportingStructureAction,
  softDeleteEmployee as softDeleteEmployeeAction,
  softDeleteLeaveRequest as softDeleteLeaveRequestAction,
  softDeletePayrollRecord as softDeletePayrollRecordAction,
  softDeleteJobPosting as softDeleteJobPostingAction,
  restoreFromTrash as restoreFromTrashAction,
  purgeFromTrash as purgeFromTrashAction,
  removeTrashEntry as removeTrashEntryAction,
} from '../store/slices/hrmsSlice'
import {
  restoreOrganizationFromTrash,
  restorePlatformUserFromTrash,
} from '../store/slices/platformSlice'
import { setSearchQuery, setToast, clearToast } from '../store/slices/uiSlice'
import {
  selectAdminStats,
  selectManagerKpis,
  selectDepartmentChartData,
  selectLeaveChartData,
  filterEmployeesList,
} from '../store/selectors/hrmsSelectors'
import { todayDate, estimatePayroll } from '../store/hrmsHelpers'

export function useHrms() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const hrms = useSelector((state) => state.hrms)

  const audit = useCallback(() => auditActorFromUser(user), [user])
  const searchQuery = useSelector((state) => state.ui.searchQuery)
  const toast = useSelector((state) => state.ui.toast)
  const adminStats = useSelector(selectAdminStats)
  const managerKpis = useSelector(selectManagerKpis)
  const departmentChartData = useSelector(selectDepartmentChartData)
  const leaveChartData = useSelector(selectLeaveChartData)
  const toastTimerRef = useRef(null)

  const showToast = useCallback(
    (message) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      dispatch(setToast(message))
      toastTimerRef.current = setTimeout(() => {
        dispatch(clearToast())
        toastTimerRef.current = null
      }, 3000)
    },
    [dispatch],
  )

  const resetToJsonData = useCallback(() => {
    dispatch(resetHrms())
    dispatch(setSearchQuery(''))
    showToast('Data reloaded from JSON files')
  }, [dispatch, showToast])

  const updateLeaveStatus = useCallback(
    (id, status, actorName) => {
      dispatch(
        updateLeaveStatusAction({
          id,
          status,
          actorName,
          audit: auditActorFromUser(user),
        }),
      )
      showToast(`Leave request ${status}`)
    },
    [dispatch, showToast, user],
  )

  const submitLeave = useCallback(
    (payload) => {
      dispatch(submitLeaveAction(payload))
      showToast('Leave request submitted')
      return true
    },
    [dispatch, showToast],
  )

  const addEmployee = useCallback(
    (form) => {
      dispatch(addEmployeeAction({ ...form, audit: audit() }))
      showToast(`${form.name} added successfully`)
    },
    [dispatch, showToast, audit],
  )

  const bulkImportEmployees = useCallback(
    (rows) => {
      dispatch(bulkImportEmployeesAction(rows))
      dispatch(
        appendAuditLogAction({
          ...audit(),
          action: 'Bulk imported employees',
          category: 'employee',
          scope: 'hr',
          targetType: 'employee',
          targetId: '',
          targetLabel: `${rows.length} employees`,
          details: rows
            .map((r) => r.name)
            .filter(Boolean)
            .slice(0, 5)
            .join(', '),
        }),
      )
      showToast(`Imported ${rows.length} employee(s) with payroll`)
    },
    [dispatch, showToast, audit],
  )

  const updateEmployeeProfile = useCallback(
    (employeeId, updates) => {
      dispatch(patchEmployee({ employeeId, updates }))
      dispatch(
        addActivity({
          type: 'announcement',
          user: updates.name ?? employeeId,
          action: 'updated personal profile',
        }),
      )
      showToast('Profile saved successfully')
    },
    [dispatch, showToast],
  )

  const updateEmployee = useCallback(
    (employeeId, payload) => {
      const { payrollInput, ...updates } = payload
      const auditCtx = audit()
      dispatch(patchEmployee({ employeeId, updates, audit: auditCtx }))
      if (payrollInput !== undefined) {
        dispatch(updateEmployeePayrollAction({ employeeId, payrollInput, audit: auditCtx }))
      }
      dispatch(
        addActivity({
          type: 'hire',
          user: updates.name ?? employeeId,
          action: 'employee record updated',
        }),
      )
      showToast('Employee updated successfully')
    },
    [dispatch, showToast, audit],
  )

  const getEmployeeById = useCallback(
    (id) => hrms.employees.find((e) => e.id === id),
    [hrms.employees],
  )

  const toggleEmployeeTask = useCallback(
    (id) => {
      dispatch(toggleEmployeeTaskAction(id))
    },
    [dispatch],
  )

  const filterEmployees = useCallback(
    (query, department, role) =>
      filterEmployeesList(hrms.employees, query ?? searchQuery, department, role),
    [hrms.employees, searchQuery],
  )

  const recordPortalLogin = useCallback(
    (employeeId) => {
      dispatch(recordPortalLoginAction(employeeId))
    },
    [dispatch],
  )

  const recordPortalLogout = useCallback(
    (employeeId) => {
      dispatch(recordPortalLogoutAction(employeeId))
    },
    [dispatch],
  )

  const recordCheckIn = useCallback(
    (employeeId, geo = null) => {
      dispatch(recordCheckInAction({ employeeId, geo, audit: audit() }))
      if (!geo) {
        showToast('Checked in successfully')
      }
    },
    [dispatch, showToast, audit],
  )

  const recordCheckOut = useCallback(
    (employeeId, options) => {
      dispatch(recordCheckOutAction({ employeeId, ...options, audit: audit() }))
      showToast('Checked out — day summary saved')
    },
    [dispatch, showToast, audit],
  )

  const getEmployeeDetails = useCallback(
    (employeeId) => {
      const employee = hrms.employees.find((e) => e.id === employeeId)
      if (!employee) return null
      const date = todayDate()
      const payroll =
        hrms.payrollRecords.find((p) => p.employeeId === employeeId) ||
        estimatePayroll(employee)
      return {
        employee,
        payroll,
        leaves: hrms.leaveRequests.filter((l) => l.employeeId === employeeId),
        timeLogs: (hrms.timeLogs || [])
          .filter((t) => t.employeeId === employeeId)
          .sort((a, b) => b.date.localeCompare(a.date)),
        todayAttendance: hrms.attendanceRecords.find(
          (a) => a.employeeId === employeeId && a.date === date,
        ),
        todayLog: (hrms.timeLogs || []).find(
          (t) => t.employeeId === employeeId && t.date === date,
        ),
      }
    },
    [hrms],
  )

  const getTimeLogsForEmployee = useCallback(
    (employeeId) =>
      (hrms.timeLogs || [])
        .filter((t) => t.employeeId === employeeId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [hrms.timeLogs],
  )

  const getTodayTimeLog = useCallback(
    (employeeId) => {
      const date = todayDate()
      return (hrms.timeLogs || []).find(
        (t) => t.employeeId === employeeId && t.date === date,
      )
    },
    [hrms.timeLogs],
  )

  const addJobPosting = useCallback(
    (form) => {
      dispatch(addJobPostingAction({ ...form, audit: audit() }))
      showToast('Job posted successfully')
    },
    [dispatch, showToast, audit],
  )

  const bulkImportJobPostings = useCallback(
    (jobs) => {
      dispatch(bulkImportJobPostingsAction(jobs))
      showToast(`Imported ${jobs.length} job posting(s)`)
    },
    [dispatch, showToast],
  )

  const updateJobStatus = useCallback(
    (id, status) => {
      dispatch(updateJobStatusAction({ id, status, audit: audit() }))
      showToast(`Job marked as ${status}`)
    },
    [dispatch, showToast, audit],
  )

  const recordGeneratedDocument = useCallback(
    (payload) => {
      dispatch(recordGeneratedDocumentAction({ ...payload, audit: audit() }))
      showToast(`${payload.templateTitle} saved for ${payload.employeeName}`)
    },
    [dispatch, showToast, audit],
  )

  const addDocumentTemplate = useCallback(
    (form) => {
      dispatch(addDocumentTemplateAction({ ...form, audit: audit() }))
      showToast(`Template "${form.title}" created`)
    },
    [dispatch, showToast, audit],
  )

  const updateDocumentTemplate = useCallback(
    (payload) => {
      dispatch(updateDocumentTemplateAction({ ...payload, audit: audit() }))
      showToast('Template updated')
    },
    [dispatch, showToast, audit],
  )

  const deleteDocumentTemplate = useCallback(
    (id) => {
      dispatch(deleteDocumentTemplateAction({ id, audit: audit() }))
      showToast('Template moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const updateOrganization = useCallback(
    (payload) => {
      const scope = user?.role === 'superadmin' ? 'platform' : 'hr'
      dispatch(
        updateOrganizationAction({
          ...payload,
          audit: { ...audit(), scope },
        }),
      )
      showToast('Company profile saved')
    },
    [dispatch, showToast, audit, user?.role],
  )

  const upsertDepartment = useCallback(
    (payload) => {
      dispatch(
        upsertDepartmentAction({
          ...payload,
          audit: { ...audit(), scope: 'platform' },
        }),
      )
      showToast(payload.id ? 'Department updated' : 'Department added')
    },
    [dispatch, showToast, audit],
  )

  const deleteDepartment = useCallback(
    (id) => {
      dispatch(deleteDepartmentAction({ id, audit: audit() }))
      showToast('Department moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const upsertDesignation = useCallback(
    (payload) => {
      dispatch(upsertDesignationAction(payload))
      showToast(payload.id ? 'Designation updated' : 'Designation added')
    },
    [dispatch, showToast],
  )

  const deleteDesignation = useCallback(
    (id) => {
      dispatch(deleteDesignationAction({ id, audit: audit() }))
      showToast('Designation moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const upsertBranch = useCallback(
    (payload) => {
      dispatch(upsertBranchAction(payload))
      showToast(payload.id ? 'Branch updated' : 'Branch added')
    },
    [dispatch, showToast],
  )

  const deleteBranch = useCallback(
    (id) => {
      dispatch(deleteBranchAction({ id, audit: audit() }))
      showToast('Branch moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const softDeleteEmployee = useCallback(
    (employeeId) => {
      dispatch(softDeleteEmployeeAction({ employeeId, audit: audit() }))
      showToast('Employee moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const softDeleteLeaveRequest = useCallback(
    (id) => {
      dispatch(softDeleteLeaveRequestAction({ id, audit: audit() }))
      showToast('Leave request moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const softDeletePayrollRecord = useCallback(
    (id) => {
      dispatch(softDeletePayrollRecordAction({ id, audit: audit() }))
      showToast('Payroll record moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const softDeleteJobPosting = useCallback(
    (id) => {
      dispatch(softDeleteJobPostingAction({ id, audit: audit() }))
      showToast('Job posting moved to recycle bin')
    },
    [dispatch, showToast, audit],
  )

  const restoreTrashItem = useCallback(
    (trashId) => {
      const item = hrms.trash?.find((t) => t.id === trashId)
      if (!item) return false
      const auditCtx = audit()
      if (item.entityType === 'platformOrganization') {
        dispatch(restoreOrganizationFromTrash(item.data.organization))
        dispatch(removeTrashEntryAction(trashId))
        dispatch(
          appendAuditLogAction({
            ...auditCtx,
            action: 'Restored platform organization',
            category: 'platform',
            scope: 'platform',
            targetType: 'tenant',
            targetId: item.entityId,
            targetLabel: item.label,
            details: 'From recycle bin',
          }),
        )
        return true
      }
      if (item.entityType === 'platformUser') {
        dispatch(restorePlatformUserFromTrash(item.data.user))
        dispatch(removeTrashEntryAction(trashId))
        dispatch(
          appendAuditLogAction({
            ...auditCtx,
            action: 'Restored platform user',
            category: 'user',
            scope: 'platform',
            targetType: 'user',
            targetId: item.entityId,
            targetLabel: item.label,
            details: 'From recycle bin',
          }),
        )
        return true
      }
      dispatch(restoreFromTrashAction({ trashId, audit: auditCtx }))
      return true
    },
    [dispatch, hrms.trash, audit],
  )

  const purgeTrashItem = useCallback(
    (trashId) => {
      dispatch(purgeFromTrashAction({ trashId, audit: audit() }))
    },
    [dispatch, audit],
  )

  const setReportingStructure = useCallback(
    (assignments) => {
      dispatch(setReportingStructureAction(assignments))
      showToast('Reporting structure saved')
    },
    [dispatch, showToast],
  )

  const orgContext = useMemo(
    () => ({
      organization: hrms.organization,
      employees: hrms.employees,
      branches: hrms.branches,
    }),
    [hrms.organization, hrms.employees, hrms.branches],
  )

  return {
    ...hrms,
    searchQuery,
    setSearchQuery: (q) => dispatch(setSearchQuery(q)),
    toast,
    adminStats,
    managerKpis,
    departmentChartData,
    leaveChartData,
    updateLeaveStatus,
    submitLeave,
    addEmployee,
    bulkImportEmployees,
    updateEmployeeProfile,
    updateEmployee,
    getEmployeeById,
    toggleEmployeeTask,
    filterEmployees,
    resetToJsonData,
    recordPortalLogin,
    recordPortalLogout,
    recordCheckIn,
    recordCheckOut,
    getTimeLogsForEmployee,
    getTodayTimeLog,
    getEmployeeDetails,
    addJobPosting,
    bulkImportJobPostings,
    updateJobStatus,
    recordGeneratedDocument,
    addDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
    updateOrganization,
    upsertDepartment,
    deleteDepartment,
    upsertDesignation,
    deleteDesignation,
    upsertBranch,
    deleteBranch,
    setReportingStructure,
    softDeleteEmployee,
    softDeleteLeaveRequest,
    softDeletePayrollRecord,
    softDeleteJobPosting,
    restoreTrashItem,
    purgeTrashItem,
    orgContext,
    showToast,
  }
}
