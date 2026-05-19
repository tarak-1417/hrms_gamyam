import { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  resetHrms,
  addActivity,
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
} from '../store/slices/hrmsSlice'
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
  const hrms = useSelector((state) => state.hrms)
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
      dispatch(updateLeaveStatusAction({ id, status, actorName }))
      showToast(`Leave request ${status}`)
    },
    [dispatch, showToast],
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
      dispatch(addEmployeeAction(form))
      showToast(`${form.name} added successfully`)
    },
    [dispatch, showToast],
  )

  const bulkImportEmployees = useCallback(
    (rows) => {
      dispatch(bulkImportEmployeesAction(rows))
      showToast(`Imported ${rows.length} employee(s) with payroll`)
    },
    [dispatch, showToast],
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
      dispatch(patchEmployee({ employeeId, updates }))
      if (payrollInput !== undefined) {
        dispatch(updateEmployeePayrollAction({ employeeId, payrollInput }))
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
    [dispatch, showToast],
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
      dispatch(recordCheckInAction({ employeeId, geo }))
      if (!geo) {
        showToast('Checked in successfully')
      }
    },
    [dispatch, showToast],
  )

  const recordCheckOut = useCallback(
    (employeeId, options) => {
      dispatch(recordCheckOutAction({ employeeId, ...options }))
      showToast('Checked out — day summary saved')
    },
    [dispatch, showToast],
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
      dispatch(addJobPostingAction(form))
      showToast('Job posted successfully')
    },
    [dispatch, showToast],
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
      dispatch(updateJobStatusAction({ id, status }))
      showToast(`Job marked as ${status}`)
    },
    [dispatch, showToast],
  )

  const recordGeneratedDocument = useCallback(
    (payload) => {
      dispatch(recordGeneratedDocumentAction(payload))
      showToast(`${payload.templateTitle} saved for ${payload.employeeName}`)
    },
    [dispatch, showToast],
  )

  const addDocumentTemplate = useCallback(
    (form) => {
      dispatch(addDocumentTemplateAction(form))
      showToast(`Template "${form.title}" created`)
    },
    [dispatch, showToast],
  )

  const updateDocumentTemplate = useCallback(
    (payload) => {
      dispatch(updateDocumentTemplateAction(payload))
      showToast('Template updated')
    },
    [dispatch, showToast],
  )

  const deleteDocumentTemplate = useCallback(
    (id) => {
      dispatch(deleteDocumentTemplateAction(id))
      showToast('Template removed')
    },
    [dispatch, showToast],
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
    showToast,
  }
}
