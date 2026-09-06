/**
 * 앱 전역 네비게이션 — 홈·로그방·피드·프로필/로그인 이동을 담당한다.
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, getErrorMessage } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';
import { logout as apiLogout } from '../../lib/authApi';

// --- Icons ---
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FeedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * 데스크톱 좌측·모바일 하단 탭바로 주요 경로 이동과 로그아웃을 처리한다.
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, openModal } = useAuthStore();

  const isHome = location.pathname === '/' || location.pathname.startsWith('/library');
  const isLogRoom = location.pathname.startsWith('/log-rooms');
  const isFeed = location.pathname.startsWith('/feed');
  const isProfile = location.pathname.startsWith('/profile') || location.pathname.startsWith('/users');

  /** 서버 로그아웃 후 로컬 인증 상태를 초기화한다. */
  const handleLogout = async () => {
    try {
      await apiLogout();
      logout();
    } catch (error) {
      console.error(getErrorMessage(error, '로그아웃에 실패했습니다.'));
    }
  };

  return (
    <nav className={cn(
      "shrink-0 bg-background-main border-base-900 z-50 transition-all duration-300",
      "md:w-16 md:h-screen md:flex md:flex-col md:items-center md:py-8 md:border-r md:gap-10 md:relative",
      "fixed bottom-0 left-0 w-full h-16 flex flex-row items-center justify-around md:justify-start px-6 border-t backdrop-blur-xl bg-background-main/80 md:backdrop-blur-none md:bg-background-main"
    )}>
      <div
        className="hidden md:block text-header-2 font-bold text-base-50 mb-4 cursor-pointer hover:text-primary transition-colors"
        onClick={() => navigate('/')}
      >
        B
      </div>

      <div className="flex flex-row md:flex-col gap-8 md:gap-8 items-center w-full justify-around md:justify-start">
        <button
          className={cn(
            "p-2 transition-colors cursor-pointer rounded-xl",
            isHome ? "text-primary md:bg-primary/10" : "text-base-500 hover:text-primary"
          )}
          onClick={() => navigate('/')}
        >
          <HomeIcon />
        </button>

        <button
          className={cn(
            "p-2 transition-colors cursor-pointer rounded-xl",
            isLogRoom ? "text-primary md:bg-primary/10" : "text-base-500 hover:text-primary"
          )}
          onClick={() => navigate('/log-rooms')}
        >
          <LogIcon />
        </button>

        <button
          className={cn(
            "p-2 transition-colors cursor-pointer rounded-xl",
            isFeed ? "text-primary md:bg-primary/10" : "text-base-500 hover:text-primary"
          )}
          onClick={() => navigate('/feed')}
        >
          <FeedIcon />
        </button>

        {isAuthenticated ? (
          <div className="relative group">
            <button
              className={cn(
                "p-2 transition-colors cursor-pointer rounded-xl",
                isProfile ? "text-primary md:bg-primary/10" : "text-base-500 hover:text-primary"
              )}
              onClick={() => navigate('/profile')}
            >
              <ProfileIcon />
            </button>
            {/* 내 정보 툴팁/팝업 */}
            <div className={cn(
              "absolute hidden group-hover:block min-w-48 shadow-2xl z-60 bg-base-900 border border-base-800 p-4 rounded-2xl",
              // Mobile: 버튼 위로 뜸
              "bottom-full left-1/2 -translate-x-1/2 mb-3",
              // Desktop: 버튼 오른쪽으로 뜸
              "md:bottom-auto md:top-0 md:left-full md:translate-x-0 md:mb-0 md:ml-4",
              // 마우스 이동 시 닫히지 않도록 하는 투명한 다리 (Bridge)
              "after:content-[''] after:absolute",
              "after:after:-bottom-3 after:left-0 after:w-full after:h-3", // Mobile bridge
              "md:after:bottom-auto md:after:-left-4 md:after:top-0 md:after:w-4 md:after:h-full" // Desktop bridge
            )}>
              <div className="text-body-2 font-bold text-base-50 mb-1 truncate">{user?.nickname || '사용자'}</div>
              <div className="text-body-3 text-base-500 mb-3 truncate">{user?.email}</div>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-base-800 hover:bg-base-700 text-base-200 text-body-3 rounded-lg transition-colors cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <button
            className="p-2 text-base-500 hover:text-primary transition-colors cursor-pointer"
            onClick={() => openModal()}
          >
            <ProfileIcon />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
