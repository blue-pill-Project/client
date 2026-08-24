import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useR2Upload } from '../../../hooks/useR2Upload';
import { getCharacterCardDetail, updateCharacterCard } from '../../../lib/characterApi';
import PageLayout from '../../../components/layout/PageLayout';
import Tabs from '../../../components/common/Tabs';
import Button from '../../../components/common/Button';
import TextInput from '../../../components/common/TextInput';
import { cn, getErrorMessage } from '../../../lib/utils';
import { EditIcon } from '../../../components/icons/EditIcon';
import { TrashIcon } from '../../../components/icons/TrashIcon';
import { R2_DOMAIN } from '../../../lib/config';

type Step = 'setting' | 'prompt' | 'example';

const CharacterEditPage = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('setting');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    prompt: '',
    exampleDialogues: [] as string[],
    isPublic: true,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadToR2 } = useR2Upload();

  const [exampleInput, setExampleInput] = useState('');

  useEffect(() => {
    if (!publicId) return;

    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const data = await getCharacterCardDetail(publicId);
        setFormData({
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          prompt: data.prompt || '',
          exampleDialogues: data.exampleDialogues || [],
          isPublic: data.isPublic,
        });
        setImagePreview(data.imageUrl.startsWith('http') ? data.imageUrl : `${R2_DOMAIN}/${data.imageUrl}`);
      } catch (err) {
        const message = getErrorMessage(err, '캐릭터 정보를 불러오는데 실패했습니다.');
        console.error(message);
        alert(message);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacter();
  }, [publicId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExample = () => {
    if (exampleInput.trim() && formData.exampleDialogues.length < 5) {
      setFormData(prev => ({
        ...prev,
        exampleDialogues: [...prev.exampleDialogues, exampleInput.trim()]
      }));
      setExampleInput('');
    }
  };

  const handleEditExample = (index: number) => {
    const dialogueToEdit = formData.exampleDialogues[index];
    setExampleInput(dialogueToEdit);
    setFormData(prev => ({
      ...prev,
      exampleDialogues: prev.exampleDialogues.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exampleDialogues: prev.exampleDialogues.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!publicId || !formData.name || !formData.description || !formData.prompt) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // 새 이미지가 선택된 경우 R2 업로드
      if (selectedFile) {
        finalImageUrl = await uploadToR2(selectedFile, 'CHARACTER');
      }

      await updateCharacterCard(publicId, {
        ...formData,
        imageUrl: finalImageUrl
      });
      alert('캐릭터 카드가 수정되었습니다!');
      navigate('/library');
    } catch (err) {
      alert(`수정 실패: ${getErrorMessage(err, '알 수 없는 오류')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout containerClassName="mx-auto flex justify-between md:py-0 md:px-6 md:h-screen">
      {/* Left Content Area */}
      <div className="flex flex-col justify-between [@media(width>=1200px)]:max-w-2xl w-full">
        <div className='mt-13 flex flex-col justify-between h-full mb-10'>
          <header className="mb-8 space-y-2">
            <span className="text-body-4 text-base-500 font-bold uppercase tracking-widest">캐릭터 수정</span>
            <h1 className="text-header-1 font-bold text-base-300">캐릭터 수정</h1>
          </header>

          <Tabs
            items={[
              { id: 'setting', label: '캐릭터 기본 설정' },
              { id: 'prompt', label: '캐릭터 프롬프트' },
              { id: 'example', label: '대화체 설정' }
            ]}
            activeId={currentStep}
            className='mb-9'
            onTabChange={(id) => setCurrentStep(id as Step)}
          />

          <div className='flex flex-col justify-between flex-1 pl-3'>
            {/* Step: Setting */}
            {currentStep === 'setting' && (
              <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className='flex-1'>
                  <div className='mb-7'>
                    <p className="text-body-3 text-base-400 mb-12">캐릭터가 어떻게 보일지 결정하는 단계입니다. 자유롭게 표현해 주세요!</p>

                    <div>
                      <label className="text-body-2 font-bold text-base-50">캐릭터 이미지</label>
                      <p className="text-body-3 text-base-500 mb-4 mt-2">이미지를 변경하세요. 부적절한 이미지는 제한될 수 있어요.</p>
                      <div className="flex items-center gap-6">
                        <div
                          className="min-w-27.5 h-27.5 border-primary rounded-xl flex items-center justify-center cursor-pointer overflow-hidden border"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {imagePreview ? (
                            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 1V14.9995" stroke="#62F6B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                              <path d="M1 7.99805H15" stroke="#62F6B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        <div className="space-y-4 w-full">
                          <Button variant="Outline" size='s' className='px-4' onClick={() => fileInputRef.current?.click()}>이미지 변경하기</Button>
                          <p className="text-body-3 text-base-600">PNG, JPG, WebP 형식의 이미지 파일만 업로드할 수 있어요. 1:1 비율의 이미지를 권장해요.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 pt-7 border-t border-base-700">
                    <div>
                      <label className="text-body-2 font-bold text-base-50">캐릭터 이름</label>
                      <p className="text-body-4 text-base-500 my-2.5">2~30자 이내로 입력해 주세요 (특수문자, 이모지 제외)</p>
                      <div className="relative">
                        <TextInput
                          name="name" value={formData.name} onChange={handleChange} maxLength={30}
                          placeholder="캐릭터가 불리게 될 이름입니다."
                        />
                      </div>
                    </div>
                    <div className='border-b border-base-700 my-7' />
                    <div>
                      <label className="text-body-2 font-bold text-base-50">한 줄 소개</label>
                      <p className="text-body-4 text-base-500 my-2.5">30자 이내로 입력해 주세요</p>
                      <div className="relative">
                        <TextInput
                          name="description" value={formData.description} onChange={handleChange} maxLength={30}
                          placeholder="어떤 캐릭터인지 설명할 수 있는 간단한 소개를 입력해주세요."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'prompt' && (
              <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className='flex-1'>
                  <p className="text-body-3 text-base-400 mb-12">캐릭터의 상세 설명을 작성하는 단계입니다.</p>
                  <div>
                    <label className="text-body-2 font-bold text-base-50">캐릭터 프롬프트</label>
                    <p className="text-body-3 text-base-500 mt-1.5 mb-2">캐릭터 외모, 성격, 말투 등 대화에 반영되어야하는 지시 사항을 알려주세요.</p>
                    <textarea
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleChange}
                      className="w-full h-102 bg-background-main border border-base-700 rounded-xl p-3 text-[14px] text-base-200 focus:border-primary outline-none transition-colors"
                      placeholder="캐릭터의 성격, 말투, 배경 등을 자세히 입력해주세요."
                    />
                    <div className='w-full text-right'><Button variant='Darkoutline' className='mt-4' >자동 완성</Button></div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Example */}
            {currentStep === 'example' && (
              <div className="flex flex-col flex-1 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex-1">
                  <p className="text-body-3 text-base-400 mb-12">
                    캐릭터의 대화체를 설정하는 단계입니다.<br />
                    최대 5개까지 설정이 가능합니다.
                  </p>

                  <ul className="space-y-6 h-64 overflow-y-auto pr-2">
                    {formData.exampleDialogues.map((dialogue, index) => (
                      <li key={index} className="flex gap-3 items-start group">
                        <img
                          src={imagePreview || '/default-profile.svg'}
                          alt="profile"
                          className="w-10 h-10 rounded-lg object-cover bg-base-700"
                        />

                        <div className='flex gap-5'>
                          <div className="flex flex-col">
                            <div className="mb-1 text-body-3 font-medium text-base-400">{formData.name}</div>
                            <span className="bg-base-800 px-4 py-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-body-4 font-medium w-fit text-base-400">
                              {dialogue}
                            </span>
                          </div>

                          <div className="flex items-end gap-4">
                            <button onClick={() => handleEditExample(index)}><EditIcon /></button>
                            <button
                              className="text-base-600 cursor-pointer"
                              onClick={() => handleRemoveExample(index)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto mb-14">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-body-3 text-base-500">100자 이내로 입력해 주세요</p>
                    <p className="text-body-3 text-base-500">
                      {formData.exampleDialogues.length}/5
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      value={exampleInput}
                      onChange={(e) => setExampleInput(e.target.value)}
                      placeholder="안녕하세요"
                      maxLength={100}
                      rows={3}
                      className="w-full h-20 bg-base-900 border-3 rounded-xl px-3 py-2 border-base-700 text-sm text-base-100 resize-none outline-none"
                    />
                    <div className="absolute bottom-4 right-3 text-body-4 text-base-600">
                      {exampleInput.length}/100
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-3 mt-3">
                    <button
                      className="text-base-600 cursor-pointer"
                      onClick={() => setExampleInput('')}
                    >
                      <TrashIcon />
                    </button>
                    <Button
                      variant="Darkoutline"
                      onClick={handleAddExample}
                      size='s'
                      className='h-7'
                    >
                      전송
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className={cn("flex", currentStep === 'setting' ? 'justify-end' : 'justify-between')}>
              {currentStep === 'setting' && <Button variant="solid" onClick={() => setCurrentStep('prompt')} className="px-13.25 font-medium">다음 ›</Button>}
              {currentStep === 'prompt' && (
                <>
                  <Button variant="Outline" onClick={() => setCurrentStep('setting')} className="px-13.25 font-medium">‹ 이전</Button>
                  <Button variant="solid" onClick={() => setCurrentStep('example')} className="px-13.25 font-medium">다음 ›</Button>
                </>
              )}
              {currentStep === 'example' && (
                <>
                  <Button variant="Outline" onClick={() => setCurrentStep('prompt')} className="px-13.25 font-medium">‹ 이전</Button>
                  <Button variant="solid" onClick={handleSubmit} className="px-13.25 font-medium" disabled={loading}>
                    {loading ? '수정 중...' : '수정 완료'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden [@media(width>=1200px)]:block border-l border-base-700" />
      {/* Right Preview Area */}
      <div className="hidden w-86.5 shrink-0 [@media(width>=1200px)]:flex flex-col justify-center">
        <div>
          <h3 className="text-header-4 text-base-300">캐릭터 미리보기</h3>
          <p className="text-body-3 text-base-500 border-b border-base-700 pt-2.5 pb-3 mb-6">아래에 생성된 캐릭터를 미리 확인해 보세요!</p>
          <div className="rounded-3xl shadow-2xl">
            <div className="aspect-square w-full rounded-xl bg-background-hovered border border-base-600 box-border mb-4 overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base-700">No Image</div>
              )}
            </div>
            <h4 className="text-body-1 font-bold text-base-100 mb-2">{formData.name || '캐릭터 이름'}</h4>
            <p className="text-[14px] text-base-500 leading-relaxed">{formData.description || '유저들에게 어떤 캐릭터인지 설명할 수 있는 간단한 소개를 입력해 주세요.'}</p>
          </div>
        </div>
      </div>
    </PageLayout >
  );
};

export default CharacterEditPage;
