import React, { useState } from 'react';
import Modal from './Modal';
import { useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';
import { BackgroundSettings, BackgroundThemeType, DEFAULT_BACKGROUND_SETTINGS, RES_OT_BG_URL } from '../types';
import { PhotoIcon, SparklesIcon, CheckIcon, ArrowPathIcon, MoonIcon, SunIcon } from './icons';

interface BackgroundCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundCustomizationModal: React.FC<BackgroundCustomizationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  const { backgroundSettings, updateBackgroundSettings } = useAppContext();

  // Local draft state for tweaking before confirming or real-time live preview
  const [draftSettings, setDraftSettings] = useState<BackgroundSettings>(backgroundSettings);
  const [customUrlInput, setCustomUrlInput] = useState(draftSettings.customUrl || '');

  // Keep draft in sync if modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftSettings(backgroundSettings);
      setCustomUrlInput(backgroundSettings.customUrl || '');
    }
  }, [isOpen, backgroundSettings]);

  const handleSelectType = (type: BackgroundThemeType) => {
    const updated = { ...draftSettings, type };
    setDraftSettings(updated);
    updateBackgroundSettings(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const updated: BackgroundSettings = {
            ...draftSettings,
            type: 'custom',
            customUrl: result,
          };
          setDraftSettings(updated);
          setCustomUrlInput(result);
          updateBackgroundSettings(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setCustomUrlInput(url);
    const updated: BackgroundSettings = {
      ...draftSettings,
      type: 'custom',
      customUrl: url,
    };
    setDraftSettings(updated);
    updateBackgroundSettings(updated);
  };

  const handleOpacityChange = (opacity: number) => {
    const updated = { ...draftSettings, opacity };
    setDraftSettings(updated);
    updateBackgroundSettings(updated);
  };

  const handleBlurChange = (blur: number) => {
    const updated = { ...draftSettings, blur };
    setDraftSettings(updated);
    updateBackgroundSettings(updated);
  };

  const handleOverlayToggle = (darkOverlay: boolean) => {
    const updated = { ...draftSettings, darkOverlay };
    setDraftSettings(updated);
    updateBackgroundSettings(updated);
  };

  const handleReset = () => {
    setDraftSettings(DEFAULT_BACKGROUND_SETTINGS);
    setCustomUrlInput('');
    updateBackgroundSettings(DEFAULT_BACKGROUND_SETTINGS);
  };

  const getPreviewBgStyle = () => {
    if (draftSettings.type === 'dark') {
      return {
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(ellipse at top, #1e293b 0%, #090d16 100%)',
      };
    }
    if (draftSettings.type === 'res_ot') {
      return {
        backgroundImage: `url(${RES_OT_BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (draftSettings.type === 'custom' && draftSettings.customUrl) {
      return {
        backgroundImage: `url(${draftSettings.customUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundColor: '#f8fafc',
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <PhotoIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('background.modalTitle')}</h2>
              <p className="text-xs text-slate-500">{t('background.themeChoice')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            title={t('background.reset')}
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>{t('background.reset')}</span>
          </button>
        </div>

        {/* Theme Options Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('background.themeChoice')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Standard Theme Card */}
            <button
              type="button"
              onClick={() => handleSelectType('default')}
              className={`relative flex flex-col p-3.5 rounded-xl text-left border-2 transition-all group ${
                draftSettings.type === 'default'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <SunIcon className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs text-slate-900">{t('background.default')}</span>
                </div>
                {draftSettings.type === 'default' && (
                  <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                    <CheckIcon className="w-2.5 h-2.5" />
                    <span>{t('background.activeBadge')}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5 line-clamp-2">{t('background.defaultDesc')}</p>
              {/* Mini Preview Box */}
              <div className="w-full h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5">
                <div className="w-full h-full rounded bg-white shadow-xs border border-slate-200 flex items-center px-2 space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <div className="h-1.5 w-12 bg-slate-200 rounded"></div>
                </div>
              </div>
            </button>

            {/* Dark Mode Theme Card */}
            <button
              type="button"
              onClick={() => handleSelectType('dark')}
              className={`relative flex flex-col p-3.5 rounded-xl text-left border-2 transition-all group ${
                draftSettings.type === 'dark'
                  ? 'border-indigo-500 bg-slate-900 text-white shadow-md ring-2 ring-indigo-400/20'
                  : 'border-slate-200 hover:border-slate-400 bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <MoonIcon className="w-4 h-4 text-indigo-400" />
                  <span className={`font-bold text-xs ${draftSettings.type === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('background.dark')}
                  </span>
                </div>
                {draftSettings.type === 'dark' && (
                  <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white">
                    <CheckIcon className="w-2.5 h-2.5" />
                    <span>{t('background.activeBadge')}</span>
                  </span>
                )}
              </div>
              <p className={`text-[11px] mb-2.5 line-clamp-2 ${draftSettings.type === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                {t('background.darkDesc')}
              </p>
              {/* Mini Preview Box */}
              <div className="w-full h-14 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5">
                <div className="w-full h-full rounded bg-slate-900 border border-slate-750 flex items-center px-2 space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <div className="h-1.5 w-12 bg-slate-700 rounded"></div>
                </div>
              </div>
            </button>

            {/* Official RES OT Team Wallpaper Card */}
            <button
              type="button"
              onClick={() => handleSelectType('res_ot')}
              className={`relative flex flex-col p-3.5 rounded-xl text-left border-2 transition-all group overflow-hidden ${
                draftSettings.type === 'res_ot'
                  ? 'border-orange-500 bg-orange-950/5 shadow-md ring-2 ring-orange-400/20'
                  : 'border-slate-200 hover:border-orange-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <SparklesIcon className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="font-bold text-xs text-slate-900">{t('background.resOt')}</span>
                </div>
                {draftSettings.type === 'res_ot' && (
                  <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-600 text-white">
                    <CheckIcon className="w-2.5 h-2.5" />
                    <span>{t('background.activeBadge')}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5 line-clamp-2">{t('background.resOtDesc')}</p>
              {/* Mini Preview with image */}
              <div className="w-full h-14 rounded-lg overflow-hidden border border-orange-200/60 relative group-hover:scale-[1.01] transition-transform">
                <img
                  src={RES_OT_BG_URL}
                  alt="RES OT Team Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                  <span className="text-[9px] font-semibold text-orange-300 tracking-wide">
                    RES OT Team
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Image Option Accordion / Card */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ${
            draftSettings.type === 'custom'
              ? 'border-blue-600 bg-blue-50/20'
              : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="type-custom"
                name="bg-type"
                checked={draftSettings.type === 'custom'}
                onChange={() => handleSelectType('custom')}
                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="type-custom" className="font-bold text-sm text-slate-900 cursor-pointer">
                {t('background.custom')}
              </label>
            </div>
            {draftSettings.type === 'custom' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {t('background.activeBadge')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3">{t('background.customDesc')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('background.uploadFile')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('background.orUrl')}
              </label>
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={t('background.urlPlaceholder')}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* Fine-Tuning Controls (When background image is active: res_ot or custom) */}
        {(draftSettings.type === 'res_ot' || draftSettings.type === 'custom') && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Réglages d'affichage & Lisibilité
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{t('background.opacity')}</span>
                  <span className="font-bold text-blue-600">{draftSettings.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={draftSettings.opacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Blur Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{t('background.blur')}</span>
                  <span className="font-bold text-blue-600">{draftSettings.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={draftSettings.blur}
                  onChange={(e) => handleBlurChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* High-Contrast / Readability Overlay Checkbox */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <label htmlFor="darkOverlayToggle" className="text-xs font-medium text-slate-800 cursor-pointer">
                {t('background.darkOverlay')}
              </label>
              <input
                id="darkOverlayToggle"
                type="checkbox"
                checked={draftSettings.darkOverlay}
                onChange={(e) => handleOverlayToggle(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Live Preview Area */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('background.preview')}
          </span>
          <div
            className="w-full h-28 rounded-xl relative overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center p-3"
            style={getPreviewBgStyle()}
          >
            {draftSettings.darkOverlay && draftSettings.type !== 'default' && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
            )}
            <div className="relative z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/40 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                RES
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Projet-Pilote Dashboard</p>
                <p className="text-[10px] text-slate-500">Aperçu avec effet de verre translucide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BackgroundCustomizationModal;
