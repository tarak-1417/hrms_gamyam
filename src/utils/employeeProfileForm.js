export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']

export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed']

export function buildProfileFormFromEmployee(profile) {
  if (!profile) {
    return emptyProfileForm()
  }

  const personal = profile.personalDetails ?? {}

  return {
    name: profile.name ?? '',
    email: profile.email ?? '',
    phone: profile.phone === '—' ? '' : profile.phone || '',
    address: profile.address || '',
    profileImage: profile.profileImage || '',
    personalEmail: personal.personalEmail ?? '',
    dateOfBirth: personal.dateOfBirth ?? '',
    gender: personal.gender ?? '',
    bloodGroup: personal.bloodGroup ?? '',
    maritalStatus: personal.maritalStatus ?? '',
    nationality: personal.nationality ?? '',
    aadhaar: personal.aadhaar ?? '',
    pan: personal.pan ?? '',
    uan: personal.uan ?? '',
    emergencyContactName: personal.emergencyContactName ?? '',
    emergencyContactRelation: personal.emergencyContactRelation ?? '',
    emergencyContactPhone: personal.emergencyContactPhone ?? '',
  }
}

export function emptyProfileForm() {
  return {
    name: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
    personalEmail: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    maritalStatus: '',
    nationality: '',
    aadhaar: '',
    pan: '',
    uan: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  }
}

export function profileFormToUpdates(form, existingProfile) {
  const existingPersonal = existingProfile?.personalDetails ?? {}

  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    profileImage: form.profileImage || null,
    personalDetails: {
      ...existingPersonal,
      personalEmail: form.personalEmail.trim(),
      dateOfBirth: form.dateOfBirth || '',
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      maritalStatus: form.maritalStatus,
      nationality: form.nationality.trim(),
      aadhaar: String(form.aadhaar).replace(/\D/g, ''),
      pan: form.pan.trim().toUpperCase(),
      uan: String(form.uan).replace(/\D/g, ''),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactRelation: form.emergencyContactRelation.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
    },
  }
}
