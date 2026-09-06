/**
 * 공통 이미지 업로드 UI.
 * 미리보기 박스와 파일 선택(또는 추가 액션 버튼)을 제공한다.
 */
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import Button from './Button';
import { cn } from '../../lib/utils';

/** 부모에서 숨은 file input 클릭을 트리거할 때 쓰는 핸들 */
export interface ImageUploadHandle {
    triggerUpload: () => void;
}

interface ImageUploadAction {
    label: string;
    onClick: () => void;
}

interface ImageUploadProps {
    imagePreview: string | null;
    onFileChange: (file: File) => void;
    actions?: ImageUploadAction[];
    defaultLabel?: string;
    boxSize?: 's' | 'm' | 'l';
}

/**
 * 이미지 선택·미리보기 컴포넌트.
 * ref.triggerUpload()로 파일 선택을 외부에서 열 수 있다.
 */
export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(({
    imagePreview,
    onFileChange,
    actions,
    defaultLabel = "이미지 업로드하기",
    boxSize = 'm'
}, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        triggerUpload: () => fileInputRef.current?.click(),
    }));

    /** 선택된 첫 파일을 부모 onFileChange로 전달한다 */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileChange(file);
        }
    };

    return (
        <div className="flex items-center gap-6">
            <div
                className={cn(" border border-primary flex items-center justify-center cursor-pointer overflow-hidden bg-base-950 hover:bg-base-900 transition-colors",
                    boxSize === 's' && 'w-16 h-16 rounded-md',
                    boxSize === 'm' && 'w-24 h-24 rounded-2xl',
                    boxSize === 'l' && 'w-32 h-32 rounded-lg',
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="#62F6B5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <div>
                {actions ? (
                    <div>
                        <span className='text-body-3 font-medium text-base-500'>
                            {defaultLabel}
                        </span>
                        <div className="flex gap-2 mt-4">
                            {actions.map((action, index) => (
                                <Button
                                    key={index}
                                    onClick={action.onClick}
                                    size='xs'
                                    variant='Rectangleoutline'
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="typo-body-4 border border-base-800 rounded-md px-4 py-2 hover:bg-base-900 text-base-200 transition-colors"
                    >
                        {defaultLabel}
                    </Button>
                )}
            </div>
        </div>
    );
});
