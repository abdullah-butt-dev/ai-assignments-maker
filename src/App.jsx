import { useState, useEffect } from "react"
import Homepage from "./components/Homepage"
import AssignmentWizard from "./components/AssignmentWizard"
import { idbGet } from "./lib/db"

function App() {
  const [showWizard, setShowWizard] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if there's saved state on page load
  useEffect(() => {
    let cancelled = false
    idbGet("assignment_wizard_state").then((state) => {
      if (cancelled) return
      if (state && (state.topic || state.editableNotes)) {
        setShowWizard(true)
      }
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-paper">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest"></div>
      </div>
    )
  }

  if (!showWizard) {
    return <Homepage onStart={() => setShowWizard(true)} />
  }

  return <AssignmentWizard onBack={() => setShowWizard(false)} />
}

export default App