import { Routes, Route } from 'react-router-dom';
import DesignPage from './pages/design/page';
import CharacterLibraryPage from './pages/library/page';
import ProfilePage from './pages/profile/page';
import CallbackPage from './pages/auth/CallbackPage';
import LoginRedirectPage from './pages/auth/LoginRedirectPage';
import LogRoomListPage from './pages/log-rooms/LogRoomListPage';
import { LogRoomPage } from './pages/log-rooms/LogRoomPage';
import LogRoomCreationPage from './pages/log-rooms/LogRoomCreationPage';
import LogRoomPostListPage from './pages/log-rooms/LogRoomPostListPage';
import AuthModal from './components/auth/AuthModal';
import AuthInitializer from './components/auth/AuthInitializer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CharacterCreationPage from './pages/character/create/CharacterCreationPage';
import CharacterEditPage from './pages/character/edit/CharacterEditPage';

function App() {
  return (
    <>
      <AuthInitializer />
      <Routes>
        {/* Character Library is now the home page */}
        <Route path="/" element={<CharacterLibraryPage />} />
        <Route path="/library" element={<CharacterLibraryPage />} />

        {/* Protected routes */}
        <Route
          path="/library/new"
          element={
            <ProtectedRoute>
              <CharacterCreationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library/edit/:publicId"
          element={
            <ProtectedRoute>
              <CharacterEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-rooms"
          element={
            <ProtectedRoute>
              <LogRoomListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-rooms/new"
          element={
            <ProtectedRoute>
              <LogRoomCreationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-rooms/:publicId"
          element={
            <ProtectedRoute>
              <LogRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <LogRoomPostListPage />
            </ProtectedRoute>
          }
        />

        {/* Public routes */}
        <Route path="/users/:publicId" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/login" element={<LoginRedirectPage />} />
        <Route path="/design-system" element={<DesignPage />} />
      </Routes>
      <AuthModal />
    </>
  );
}

export default App;


