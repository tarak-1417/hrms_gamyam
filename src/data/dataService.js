import hrmsData from './hrmsData.json'
import usersData from './users.json'

/** Deep clone JSON so in-app edits never mutate source files */
export function cloneJson(data) {
  return JSON.parse(JSON.stringify(data))
}

/** Initial HRMS state loaded from src/data/hrmsData.json */
export function getInitialHrmsState() {
  return cloneJson(hrmsData)
}

/** Demo login accounts from src/data/users.json */
export function getUsers() {
  return usersData.users
}

export function findUserByCredentials(email, password) {
  return usersData.users.find((u) => u.email === email && u.password === password) ?? null
}
