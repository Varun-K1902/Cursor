import { useState } from 'react'
import './App.css'
import type { ProcessModel } from './model/types'
import { createEmptyProcess, interpretStatement } from './model/interpret'
import { seedChildVaccination } from './model/seed'
import { Landing } from './components/Landing'
import { Workspace } from './components/Workspace'

type View = 'landing' | 'workspace'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [model, setModel] = useState<ProcessModel | null>(null)

  function open(m: ProcessModel) {
    setModel(m)
    setView('workspace')
  }

  function startBlank() {
    open(createEmptyProcess('Untitled process'))
  }

  function startChild() {
    open(seedChildVaccination())
  }

  function startAttendance() {
    let m = createEmptyProcess('Attendance Regularisation')
    m = interpretStatement(
      m,
      'An employee submits attendance regularisation. Final approver depends on context: BM, RM, HOD, GM or Chairman.',
      'seed',
    ).model
    open(m)
  }

  function startSite() {
    let m = createEmptyProcess('SAP → DAP Site Approval')
    m = interpretStatement(
      m,
      'The regional manager reviews site applications. The manager can recommend, reject or send it to DAP.',
      'seed',
    ).model
    open(m)
  }

  if (view === 'landing' || !model) {
    return (
      <Landing
        onBlank={startBlank}
        onChildVaccination={startChild}
        onAttendance={startAttendance}
        onSiteApproval={startSite}
      />
    )
  }

  return (
    <Workspace
      model={model}
      onChange={setModel}
      onBack={() => {
        setView('landing')
        setModel(null)
      }}
    />
  )
}
