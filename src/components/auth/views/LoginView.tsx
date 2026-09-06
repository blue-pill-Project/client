/**
 * 소셜/개발용 로그인 버튼을 제공하는 인증 모달의 로그인 단계 뷰.
 */
import React from 'react';
import { SOCIAL_LOGIN_URLS, getDevToken } from '../../../lib/authApi';
import { setAccessToken } from '../../../lib/token';
import { useAuthStore } from '../../../store/useAuthStore';
import { getErrorMessage } from '../../../lib/utils';
import Button from '../../common/Button';

/** 구글 로그인 버튼용 아이콘 */
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.6 10.2271C19.6 9.51804 19.5364 8.83624 19.4182 8.18164H10V12.0498H15.3818C15.15 13.2998 14.4455 14.3589 13.3864 15.068V17.5771H16.6182C18.5091 15.8362 19.6 13.2725 19.6 10.2271Z" fill="#4285F4" />
        <path d="M9.99988 20.0004C12.6999 20.0004 14.9635 19.1049 16.618 17.5777L13.3862 15.0686C12.4908 15.6686 11.3453 16.0231 9.99988 16.0231C7.39528 16.0231 5.19078 14.264 4.40438 11.9004H1.06348V14.4913C2.70898 17.7595 6.09078 20.0004 9.99988 20.0004Z" fill="#34A853" />
        <path d="M4.4045 11.8997C4.2045 11.2997 4.0909 10.6588 4.0909 9.99969C4.0909 9.34059 4.2045 8.69969 4.4045 8.09969V5.50879H1.0636C0.3864 6.85879 0 8.38609 0 9.99969C0 11.6133 0.3864 13.1406 1.0636 14.4906L4.4045 11.8997Z" fill="#FBBC04" />
        <path d="M9.99988 3.9773C11.468 3.9773 12.7862 4.4818 13.8226 5.4727L16.6908 2.6045C14.959 0.9909 12.6953 0 9.99988 0C6.09078 0 2.70898 2.2409 1.06348 5.5091L4.40438 8.1C5.19078 5.7364 7.39528 3.9773 9.99988 3.9773Z" fill="#E94235" />
    </svg>
);

/** 디스코드 로그인 버튼용 아이콘 */
const DiscordIcon = () => (
    <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.0483 4.28422C15.7455 3.6747 14.3525 3.23171 12.8962 2.97949C12.7173 3.30284 12.5084 3.73775 12.3643 4.08374C10.8162 3.85093 9.28235 3.85093 7.76273 4.08374C7.61868 3.73775 7.40498 3.30284 7.22453 2.97949C5.76664 3.23171 4.37207 3.67632 3.06931 4.28745C0.441625 8.25822 -0.270698 12.1304 0.0854636 15.9475C1.82828 17.249 3.51728 18.0396 5.17778 18.557C5.58776 17.9928 5.95342 17.3929 6.26843 16.7608C5.66849 16.5328 5.09389 16.2515 4.55094 15.9249C4.69499 15.8182 4.83587 15.7067 4.972 15.5919C8.28351 17.1407 11.8815 17.1407 15.1535 15.5919C15.2912 15.7067 15.4321 15.8182 15.5745 15.9249C15.03 16.2531 14.4538 16.5344 13.8539 16.7624C14.1689 17.3929 14.533 17.9944 14.9445 18.5586C16.6066 18.0413 18.2972 17.2507 20.04 15.9475C20.4579 11.5225 19.3261 7.68589 17.0483 4.28422ZM6.71957 13.6C5.72548 13.6 4.91027 12.672 4.91027 11.5419C4.91027 10.4118 5.70807 9.48211 6.71957 9.48211C7.73107 9.48211 8.54628 10.4101 8.52887 11.5419C8.53045 12.672 7.73107 13.6 6.71957 13.6ZM13.4059 13.6C12.4118 13.6 11.5966 12.672 11.5966 11.5419C11.5966 10.4118 12.3944 9.48211 13.4059 9.48211C14.4174 9.48211 15.2326 10.4101 15.2152 11.5419C15.2152 12.672 14.4174 13.6 13.4059 13.6Z" fill="white" />
    </svg>
);

/**
 * 구글·디스코드 OAuth 및 개발용 User ID 로그인을 제공하는 로그인 화면.
 */
const LoginView: React.FC = () => {
    const { setAuthenticated, closeModal } = useAuthStore();

    /** 구글 OAuth 로그인 페이지로 이동한다. */
    const handleGoogleLogin = () => {
        window.location.href = SOCIAL_LOGIN_URLS.google;
    };

    /** 디스코드 OAuth 로그인 페이지로 이동한다. */
    const handleDiscordLogin = () => {
        window.location.href = SOCIAL_LOGIN_URLS.discord;
    };

    /** 개발 환경에서 User ID로 테스트 토큰을 발급받아 로그인한다. */
    const handleDevLogin = async () => {
        const userIdInput = prompt("개발자 모드: 로그인할 User ID를 입력하세요 (기본값: 1)", "1");
        if (userIdInput === null) return; // 취소

        const userId = parseInt(userIdInput, 10);
        if (isNaN(userId)) {
            alert("유효한 숫자를 입력해주세요.");
            return;
        }

        try {
            const { accessToken } = await getDevToken(userId);
            setAccessToken(accessToken);
            setAuthenticated(true);
            closeModal();
            window.location.reload(); // 프로필 재조회를 위해 새로고침
        } catch (error) {
            const message = getErrorMessage(error, '토큰 발급에 실패했습니다. 서버 상태를 확인해주세요.');
            console.error(message);
            alert(message);
        }
    };

    return (
        <div className="flex flex-col items-center max-w-sm w-full mx-auto">
            {/* 제목 */}
            <div className="text-center space-y-3 mb-10">
                <h2 className="text-[20px] font-bold text-primary tracking-widest uppercase">BLUEPILL</h2>
                <h1 className="text-[32px] font-bold text-base-50">로그인</h1>
            </div>

            {/* 버튼 영역 */}
            <div className="flex flex-col w-full gap-4">
                <Button
                    variant='Rectangleoutline'
                    onClick={handleGoogleLogin}
                    leftIcon={<GoogleIcon />}
                    size='l'
                    className='typo-body-2 font-medium'
                >
                    구글 계정으로 로그인
                </Button>
                <Button
                    variant='Darksolid'
                    onClick={handleDiscordLogin}
                    leftIcon={<DiscordIcon />}
                    size='l'
                    className="typo-body-2 font-medium bg-[#5865F2] hover:bg-[#4752C4]"
                >
                    디스코드 계정으로 로그인
                </Button>
                
                {/* 개발 환경에서만 보이는 테스트 로그인 버튼 */}
                {import.meta.env.DEV && (
                    <Button
                        variant='Outline'
                        onClick={handleDevLogin}
                        size='l'
                        className="mt-4 border-dashed border-primary text-primary hover:bg-primary/10"
                    >
                        [개발용] User ID로 로그인
                    </Button>
                )}
            </div>
        </div>
    );
};

export default LoginView;
