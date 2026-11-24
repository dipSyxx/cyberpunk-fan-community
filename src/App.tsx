import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header/Header'
import { CommunityProvider } from './api/CommunityProvider'
import { useCommunity } from './api/communityContext'
import { Characters } from './pages/Characters/Characters'
import { Community } from './pages/Community/Community'
import { DistrictJournal } from './pages/DistrictJournal/DistrictJournal'
import { Home } from './pages/Home/Home'
import { NightCity } from './pages/NightCity/NightCity'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function CommunityRoutes() {
  const { site: { profile } } = useCommunity()
  return (
    <>
      <ScrollToTop />
      <div className="app-frame">
        <Header />
        <main id="main-content">
          <Routes key={profile?.username ?? 'guest'}>
            <Route path="/" element={<Home />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/night-city" element={<NightCity />} />
            <Route path="/night-city/:districtId/journal" element={<DistrictJournal />} />
            <Route path="/community" element={<Community />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

function App() {
  return <BrowserRouter><CommunityProvider><CommunityRoutes /></CommunityProvider></BrowserRouter>
}

export default App
