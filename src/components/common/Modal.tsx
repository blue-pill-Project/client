/**
 * 공통 모달 셸.
 * 오버레이·고정 헤더·스크롤 본문을 가진 다이얼로그 컨테이너다.
 */
import React from 'react';
import { CloseIcon } from '../icons/CloseIcon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: 'sm' | 'lg';
}

/**
 * isOpen일 때만 렌더되는 공통 Modal.
 * 배경 클릭 또는 닫기 버튼으로 onClose를 호출한다.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, width = 'sm' }) => {
    if (!isOpen) return null;

    const widthClass = width === 'sm' ? 'max-w-[346px]' : 'max-w-[480px]';

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full ${widthClass} bg-base-950 border border-base-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]`}>
                {/* Fixed Header */}
                <div className='flex items-center justify-between px-4 py-3 shrink-0 border-b border-base-800'>
                    <h2 className="text-body-1 font-medium text-base-400">{title}</h2>
                    <button onClick={onClose} className="text-base-400 hover:text-base-50 transition-colors cursor-pointer">
                        <CloseIcon />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
