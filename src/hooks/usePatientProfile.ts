import { useContext } from 'react'
import { PatientProfileContext } from '../context/patientProfileContext'

export function usePatientProfile() {
  const context = useContext(PatientProfileContext)
  if (!context) {
    throw new Error('usePatientProfile must be used within PatientProfileProvider')
  }

  return context
}
