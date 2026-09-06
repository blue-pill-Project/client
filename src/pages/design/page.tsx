import { useState } from 'react';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import Checkbox from '../../components/common/Checkbox';
import Tabs from '../../components/common/Tabs';
import Dropdown from '../../components/common/Dropdown';
import InstagramPostCard from '../../components/character/InstagramPostCard';
import SearchBar from '../../components/common/SearchBar';
import PageLayout from '../../components/layout/PageLayout';
import { useAuthStore } from '../../store/useAuthStore';
import CharacterProfileItem from '../../components/character/CharacterProfileItem';

// --- 쇼케이스용 아이콘 (순수 SVG) ---
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_494_966)">
            <path d="M8 4.76953V11.2311" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.76929 8H11.2308" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.7692 1H4.23077C2.44647 1 1 2.44647 1 4.23077V11.7692C1 13.5536 2.44647 15 4.23077 15H11.7692C13.5536 15 15 13.5536 15 11.7692V4.23077C15 2.44647 13.5536 1 11.7692 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
            <clipPath id="clip0_494_966">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

const UserIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_778_4480)">
            <g clipPath="url(#clip1_778_4480)">
                <path d="M2.37872 7.10151C2.92515 6.37003 3.79782 5.89648 4.78109 5.89648C5.48105 5.89648 6.12496 6.13646 6.63504 6.53864" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.35295 9.10705H1.35621C1.12913 9.10705 0.911346 9.0168 0.750779 8.85626C0.590208 8.69572 0.5 8.47792 0.5 8.25084V1.40114C0.5 1.17405 0.590208 0.956276 0.750779 0.795701C0.911346 0.63513 1.12913 0.544922 1.35621 0.544922H8.20591" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.78105 4.61161C5.49037 4.61161 6.06537 4.03659 6.06537 3.32729C6.06537 2.61798 5.49037 2.04297 4.78105 2.04297C4.07175 2.04297 3.49673 2.61798 3.49673 3.32729C3.49673 4.03659 4.07175 4.61161 4.78105 4.61161Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.29072 9.05058C5.99025 8.99826 5.99025 8.56693 6.29072 8.51466C7.37928 8.32528 8.24507 7.49615 8.48134 6.41681L8.49945 6.33407C8.56446 6.03711 8.98732 6.03526 9.05488 6.33164L9.07688 6.42806C9.32193 7.50231 10.1879 8.32443 11.2735 8.51329C11.5755 8.56583 11.5755 8.99938 11.2735 9.05195C10.1879 9.24074 9.32193 10.0629 9.07688 11.1372L9.05488 11.2336C8.98732 11.5299 8.56446 11.5281 8.49945 11.2311L8.48134 11.1484C8.24507 10.069 7.37928 9.23989 6.29072 9.05058Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </g>
        <defs>
            <clipPath id="clip0_778_4480">
                <rect width="12" height="12" fill="white" />
            </clipPath>
            <clipPath id="clip1_778_4480">
                <rect width="12" height="12" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

// --- 쇼케이스용 상수 ---
const VARIANTS = ['solid', 'Graysolid', 'Outline', 'Darksolid', 'Darkoutline', 'Rectangleoutline'] as const;
const SIZES = ['l', 'm', 's', 'xs'] as const;

const DROPDOWN_OPTIONS = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
];

const TAB_ITEMS = [
    { id: 'setting', label: 'Character Setting' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'skills', label: 'Skills' },
];

// --- 하위 표시 컴포넌트 ---
/** 컬러 토큰 이름·HEX를 한 줄로 보여주는 스와치 */
const ColorSwatch = ({ name, token, hex, textColor = "text-base-50", border = false }: { name: string, token: string, hex: string, textColor?: string, border?: boolean }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${token} ${textColor} ${border ? 'border border-base-800' : ''}`}>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-tighter">{name}</span>
            <span className="text-[9px] opacity-70">{token.replace('bg-', '')}</span>
        </div>
        <span className="text-[9px] font-mono font-medium">{hex}</span>
    </div>
);

/** 섹션 제목과 부가 설명 */
const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="space-y-2 mb-12">
        <div className="flex items-center gap-4">
            <h2 className="text-header-3 font-bold text-primary uppercase tracking-widest">{title}</h2>
            <div className="h-px flex-1 bg-linear-to-r from-base-800 to-transparent"></div>
        </div>
        {subtitle && <p className="text-body-2 text-base-500 font-medium">{subtitle}</p>}
    </div>
);

/**
 * 디자인 시스템 쇼케이스 페이지.
 * 타이포·컬러·원자/복합 컴포넌트 변형을 한곳에서 미리본다.
 */
function DesignSystemShowcase() {
    const [dropdownValue, setDropdownValue] = useState<string>('');
    const [searchValue, setSearchValue] = useState('Search');
    const [checkboxChecked, setCheckboxChecked] = useState(true);
    const [activeTab, setActiveTab] = useState('setting');
    const openModal = useAuthStore((state) => state.openModal);

    return (
        <PageLayout>
            {/* 1. 헤더 */}
            <header className="mb-24 border-b border-base-800 pb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-caption-1 text-primary font-bold uppercase tracking-[0.4em]">Design System v2.6.0</span>
                    </div>
                    <h1 className="text-display-2 font-bold text-base-50 mb-4 tracking-tighter">Blue Pill Project</h1>
                    <p className="text-body-1 text-base-400 max-w-3xl leading-relaxed mx-auto md:mx-0">
                        A high-fidelity React component library for the Blue Pill ecosystem.
                        Built with TypeScript and TailwindCSS, focused on interactive precision and dark-themed aesthetics.
                    </p>
                </div>
                <div className="shrink-0 flex gap-4">
                    <Button variant="Outline" size="m" onClick={() => openModal('login')}>
                        로그인 모달 열기
                    </Button>
                    <Button variant="solid" size="m" onClick={() => openModal('signup-step1')}>
                        회원가입 모달 열기
                    </Button>
                </div>
            </header>

            <div className="flex flex-col gap-40">

                {/* 2. 파운데이션 (타이포·컬러) */}
                <section>
                    <SectionTitle title="01 Foundations" subtitle="The core DNA: Typography and Color Palette." />

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                        {/* 타이포그래피 */}
                        <div className="xl:col-span-7 space-y-12 bg-base-950/40 p-4 md:p-10 rounded-3xl border border-base-900/50">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">
                                <span className="text-primary text-body-4">/</span> Typography
                            </h3>

                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-base-900"><span className="typo-body-4 text-base-600 uppercase font-bold tracking-widest">Display & Headers</span></div>
                                    <div className="space-y-4">
                                        <p className="text-display-1 truncate">Display 1 (96px)</p>
                                        <p className="text-display-2">Display 2 (68px)</p>
                                        <p className="text-display-3">Display 3 (48px)</p>
                                        <p className="text-header-1">Header 1 (40px)</p>
                                        <p className="text-header-2">Header 2 (32px)</p>
                                        <p className="text-header-3 text-primary">Header 3 (24px)</p>
                                        <p className="text-header-4">Header 4 (22px)</p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-base-900">
                                    <div className="pb-4 border-b border-base-900"><span className="typo-body-4 text-base-600 uppercase font-bold tracking-widest">Body Text</span></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Body 1 / 18px</span>
                                                <p className="text-body-1 text-base-200">The quick brown fox jumps over the lazy dog.</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Body 2 / 16px</span>
                                                <p className="text-body-2 text-base-300">The quick brown fox jumps over the lazy dog.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Body 3 / 14px</span>
                                                <p className="text-body-3 text-base-400">The quick brown fox jumps over the lazy dog.</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Body 4 / 12px</span>
                                                <p className="text-body-4 text-base-500 font-semibold">The quick brown fox jumps over the lazy dog.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 컬러 팔레트 */}
                        <div className="xl:col-span-5 space-y-12 bg-base-950/40 p-4 md:p-10 rounded-3xl border border-base-900/50">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">
                                <span className="text-primary text-body-4">/</span> Color Tokens
                            </h3>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Core & State</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <ColorSwatch name="Background" token="bg-background-main" hex="#0E0E13" border />
                                        <ColorSwatch name="Background Hovered" token="bg-background-hovered" hex="#18181B" border />
                                        <ColorSwatch name="Success" token="bg-system-success" hex="#7ED6F8" textColor="text-background-main" />
                                        <ColorSwatch name="Error" token="bg-system-error" hex="#F8834F" textColor="text-background-main" />
                                        <ColorSwatch name="Primary" token="bg-primary" hex="#62F6B5" textColor="text-background-main" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Accents</span>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-base-900">
                                        <div className="aspect-square rounded-lg flex justify-center items-center bg-accents-neon shadow-lg shadow-accents-neon/10 hover:scale-103 transition-transform cursor-pointer" title="neon">neon</div>
                                        <div className="aspect-square rounded-lg flex justify-center items-center bg-accents-orange shadow-lg shadow-accents-orange/10 hover:scale-103 transition-transform cursor-pointer" title="orange">orange</div>
                                        <div className="aspect-square rounded-lg flex justify-center items-center bg-accents-pink shadow-lg shadow-accents-pink/10 hover:scale-103 transition-transform cursor-pointer" title="pink">pink</div>
                                        <div className="aspect-square rounded-lg flex justify-center items-center bg-accents-purple shadow-lg shadow-accents-purple/10 hover:scale-103 transition-transform cursor-pointer" title="purple">purple</div>
                                        <div className="aspect-square rounded-lg flex justify-center items-center bg-accents-yellow shadow-lg shadow-accents-yellow/10 hover:scale-103 transition-transform cursor-pointer" title="yellow">yellow</div>
                                        <div className="aspect-square rounded-lg flex justify-center items-center bg-accents-blue shadow-lg shadow-accents-blue/10 hover:scale-103 transition-transform cursor-pointer" title="blue">blue</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Grayscale (Base 50-950)</span>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-50 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">50</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-100 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">100</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-200 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">200</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-300 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">300</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-400 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">400</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-500 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">500</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-600 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">600</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-700 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">700</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-800 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">800</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 rounded bg-base-950 border border-white/5"></div>
                                            <span className="text-[8px] text-base-600 font-bold text-center block">950</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. 원자 컴포넌트 */}
                <section>
                    <SectionTitle title="02 Atomic Components" subtitle="Simple elements: Chips, Dropdowns, Checkboxes, and Tabs." />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* 칩 매트릭스 */}
                        <div className="bg-base-900/30 p-4 md:p-10 rounded-3xl border border-base-800/50 space-y-10">
                            <h4 className="text-header-4 text-base-300 font-bold border-b border-base-800 pb-4">Chips</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Gray 변형 */}
                                <div className="space-y-6">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Variant: Gray</span>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <Chip variant="gray" size="s">Small</Chip>
                                            <Chip variant="gray" size="m">Medium</Chip>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Chip variant="gray" size="s" icon={<UserIcon />}>With Icon</Chip>
                                            <Chip variant="gray" size="m" icon={<UserIcon />}>With Icon</Chip>
                                        </div>
                                    </div>
                                </div>
                                {/* Black 변형 */}
                                <div className="space-y-6">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Variant: Black</span>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <Chip variant="black" size="s">Small</Chip>
                                            <Chip variant="black" size="m">Medium</Chip>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Chip variant="black" size="s" icon={<UserIcon />}>With Icon</Chip>
                                            <Chip variant="black" size="m" icon={<UserIcon />}>With Icon</Chip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 드롭다운 */}
                        <div className="bg-base-900/30 p-4 md:p-10 rounded-3xl border border-base-800/50 space-y-10">
                            <h4 className="text-header-4 text-base-300 font-bold border-b border-base-800 pb-4">Dropdowns</h4>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Default / Interactive</span>
                                    <Dropdown
                                        options={DROPDOWN_OPTIONS}
                                        value={dropdownValue}
                                        onChange={setDropdownValue}
                                        className="max-w-none"
                                    />
                                </div>
                                <div className="space-y-4 pt-4 border-t border-base-900">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Disabled State</span>
                                    <Dropdown
                                        options={DROPDOWN_OPTIONS}
                                        disabled
                                        placeholder="disabled state"
                                        className="max-w-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 체크박스 */}
                        <div className="bg-base-900/30 p-4 md:p-10 rounded-3xl border border-base-800/50 space-y-10 lg:col-span-2">
                            <h4 className="text-header-4 text-base-300 font-bold border-b border-base-800 pb-4">Checkboxes</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Interactive</span>
                                    <div className="flex items-center p-4 bg-base-950/50 rounded-xl border border-base-900/50">
                                        <Checkbox
                                            label={checkboxChecked ? "Checked State" : "Unchecked State"}
                                            checked={checkboxChecked}
                                            onChange={setCheckboxChecked}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Default Unchecked</span>
                                    <div className="flex items-center p-4 bg-base-950/50 rounded-xl border border-base-900/50">
                                        <Checkbox label="Unchecked" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Default Checked</span>
                                    <div className="flex items-center p-4 bg-base-950/50 rounded-xl border border-base-900/50">
                                        <Checkbox label="Checked" defaultChecked />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Disabled States</span>
                                    <div className="flex flex-col gap-4 p-4 bg-base-950/50 rounded-xl border border-base-900/50">
                                        <Checkbox label="Disabled Unchecked" disabled />
                                        <Checkbox label="Disabled Checked" disabled defaultChecked />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 탭 */}
                        <div className="bg-base-900/30 p-4 md:p-10 rounded-3xl border border-base-800/50 space-y-10 lg:col-span-2">
                            <h4 className="text-header-4 text-base-300 font-bold border-b border-base-800 pb-4">Tabs (Taps)</h4>
                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Interactive Tabs (Gap: 12px)</span>
                                    <div className="flex items-center p-8 bg-base-950/50 rounded-2xl border border-base-900/50">
                                        <Tabs
                                            items={TAB_ITEMS}
                                            activeId={activeTab}
                                            onTabChange={setActiveTab}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-base-900">
                                    <div className="space-y-4">
                                        <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Active State</span>
                                        <div className="flex items-center p-6 bg-base-950/30 rounded-xl border border-base-900/30">
                                            <Tabs
                                                items={[{ id: '1', label: 'Character Setting' }]}
                                                activeId="1"
                                                onTabChange={() => { }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Default State</span>
                                        <div className="flex items-center p-6 bg-base-950/30 rounded-xl border border-base-900/30">
                                            <Tabs
                                                items={[{ id: '1', label: 'Character Setting' }]}
                                                activeId="2"
                                                onTabChange={() => { }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* 4. 버튼 매트릭스 */}
                <section>
                    <SectionTitle title="03 Button Matrix" subtitle="Complete permutation of all button styles, sizes, and states." />

                    <div className="space-y-24">
                        {VARIANTS.map((variant) => (
                            <div key={variant} className="space-y-8">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                    <h4 className="text-header-4 font-bold text-base-100 uppercase tracking-tight">{variant}</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                                    {SIZES.map((size) => (
                                        <div key={`${variant}-${size}`} className="p-4 md:p-8 rounded-2xl bg-base-950/50 border border-base-900/50 hover:border-base-800 transition-colors group">
                                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-base-900">
                                                <span className="text-[10px] text-base-500 font-bold tracking-widest uppercase">SIZE: {size}</span>
                                                <span className="text-[10px] text-base-700 font-mono font-medium">H: {size === 'l' ? '48' : size === 'm' ? '40' : size === 's' ? '36' : '28'}px</span>
                                            </div>

                                            <div className="flex flex-col gap-10 items-start">
                                                <div className="space-y-3 w-full">
                                                    <span className="text-[9px] text-base-600 font-bold uppercase">Default</span>
                                                    <Button variant={variant} size={size} fullWidth>{variant}</Button>
                                                </div>

                                                <div className="space-y-3 w-full">
                                                    <span className="text-[9px] text-base-600 font-bold uppercase">With Icon</span>
                                                    <Button variant={variant} size={size} leftIcon={<PlusIcon />} fullWidth>Add New</Button>
                                                </div>

                                                <div className="space-y-3 w-full">
                                                    <span className="text-[9px] text-base-600 font-bold uppercase">Disabled</span>
                                                    <Button variant={variant} size={size} disabled fullWidth>Unavailable</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. 복합 컴포넌트 */}
                <section>
                    <SectionTitle title="04 Composite Components" subtitle="Complex UI patterns built from atomic foundations." />

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                        {/* 프로필 아이템 */}
                        <div className="xl:col-span-4 space-y-10">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">
                                <span className="text-primary text-body-4">/</span> Profile Items
                            </h3>
                            <div className="flex flex-col gap-6 bg-base-950/30 p-4 md:p-8 rounded-3xl border border-base-900/50">
                                <CharacterProfileItem
                                    imageUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    instagramId="@cyber_ninja"
                                    characterName="Aiden Pierce"
                                    tags={['Creator', '#A1B2']}
                                />
                                <div className="h-px bg-base-900 mx-2"></div>
                                <CharacterProfileItem
                                    imageUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Mia"
                                    instagramId="@neon_dreamer"
                                    characterName="Sarah Connor"
                                    tags={['Player', '#C3D4']}
                                />
                                <div className="h-px bg-base-900 mx-2"></div>
                                <CharacterProfileItem
                                    imageUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost"
                                    instagramId="@unknown_entity"
                                    characterName="Zero One"
                                    tags={['Admin', 'Verified']}
                                />
                            </div>
                        </div>

                        {/* 소셜 포스트 카드 */}
                        <div className="xl:col-span-8 space-y-10">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">
                                <span className="text-primary text-body-4">/</span> Social Post Cards
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:p-8">
                                <InstagramPostCard
                                    user={{
                                        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                                        instagramId: "@cyber_ninja",
                                        characterName: "Aiden Pierce",
                                        tags: ["#Code"]
                                    }}
                                    postImageUrl="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000"
                                    date="2025.05.25"
                                    caption={"System Update: 2.6.0. Foundations are solidified. Accessing the mainframe..."}
                                />
                                <InstagramPostCard
                                    user={{
                                        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
                                        instagramId: "@neon_dreamer",
                                        characterName: "Sarah Connor",
                                        tags: ["Player"]
                                    }}
                                    postImageUrl="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1000"
                                    date="2025.06.12"
                                    caption={"The neon lights are calling my name. First night in the city. #NeonCity #Cyber"}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. 인터랙션 플레이그라운드 */}
                <section className="p-4 md:p-12 bg-linear-to-br from-base-900/40 via-background-main to-background-main rounded-[40px] border border-primary/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
                    <SectionTitle title="05 Playground" subtitle="Simulating complex interactive states and layout behaviors." />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div className="space-y-10">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">Loading Transitions</h3>
                            <div className="flex flex-wrap gap-4 p-4 md:p-8 bg-base-950/50 rounded-2xl border border-base-900/50">
                                <Button variant="solid" size='l' loading>Processing</Button>
                                <Button variant="Graysolid" size='m' loading>Processing</Button>
                                <Button variant="Outline" size='m' loading>Waiting</Button>
                                <Button variant="Darksolid" size='s' loading>Waiting</Button>
                                <Button variant="Darkoutline" size='m' loading>Waiting</Button>
                                <Button variant="Darkoutline" size='s' loading>Waiting</Button>
                                <Button variant="Rectangleoutline" size='s' loading>Load</Button>
                                <Button variant="solid" size='xs' loading></Button>
                                <Button variant="Outline" size='xs' loading></Button>
                                <Button variant="Darksolid" size='xs' loading></Button>
                                <Button variant="Darkoutline" size='xs' loading></Button>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">Layout & Composition</h3>
                            <div className="space-y-6 p-4 md:p-8 bg-base-950/50 rounded-2xl border border-base-900/50">
                                <Button fullWidth variant="solid" size="l" rightIcon={<PlusIcon />}>Confirm Secure Transaction</Button>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button fullWidth variant="Darkoutline" size="m">Cancel</Button>
                                    <Button fullWidth variant="Rectangleoutline" size="m">Settings</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. 검색바 */}
                <section>
                    <SectionTitle title="06 Search Bars" subtitle="Search inputs with dark and light themes, matching the design spec." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Dark 변형 */}
                        <div className="space-y-8 bg-base-800/40 p-4 md:p-10 rounded-3xl border border-base-900/50">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">
                                <span className="text-primary text-body-4">/</span> Dark Variant
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Case 1: Empty / Default</span>
                                    <SearchBar variant="dark" placeholder="Search" />
                                </div>
                                <div className="space-y-4 pt-6">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Case 2: With Value / Focus</span>
                                    <SearchBar variant="dark" placeholder="Search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onClear={() => setSearchValue('')} />
                                </div>
                            </div>
                        </div>

                        {/* Light 변형 */}
                        <div className="space-y-8 bg-base-800/40 p-4 md:p-10 rounded-3xl border border-base-900/50">
                            <h3 className="text-header-4 text-base-200 font-bold flex items-center gap-3">
                                <span className="text-primary text-body-4">/</span> Light Variant
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Case 3: Empty / Default</span>
                                    <SearchBar variant="light" placeholder="Search" />
                                </div>
                                <div className="space-y-4 pt-6">
                                    <span className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Case 4 & 5: With Value / Focus</span>
                                    <SearchBar
                                        variant="light"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onClear={() => setSearchValue('')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 푸터 */}
            <footer className="mt-60 pt-16 border-t border-base-900 text-center pb-20">
                <div className="flex justify-center gap-10 mb-8">
                    <div className="w-1.5 h-1.5 bg-base-800 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-base-800 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-base-800 rounded-full"></div>
                </div>
                <p className="text-base-600 text-[10px] uppercase font-bold tracking-[0.4em] mb-4">
                    Blue Pill Project &copy; 2024. Industrial grade UI standards.
                </p>
                <p className="text-base-800 text-[9px] font-mono tracking-widest uppercase">
                    Generated via Gemini CLI | Protocol: Design System Showcase
                </p>
            </footer>
        </PageLayout>
    );
}

export default DesignSystemShowcase;
