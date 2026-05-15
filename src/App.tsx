import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LibraryPage from './components/Library/LibraryPage'
import AnalyzerPage from './components/Analyzer/AnalyzerPage'
import CapturePage from './components/Capture/CapturePage'
import SettingsPage from './components/Settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/analyzer/:id" element={<AnalyzerPage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
