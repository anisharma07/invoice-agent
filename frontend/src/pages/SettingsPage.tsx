import React, { useState, useRef, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonToast,
  IonModal,
  IonButton,
} from "@ionic/react";
import SignatureCanvas from "react-signature-canvas";
import { useTheme } from "../contexts/ThemeContext";
import { getDefaultCurrency, setDefaultCurrency } from "../utils/settings";
import "./SettingsPage.css";

// Custom SVG Icons
const InvoiceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
    <line x1="8" y1="9" x2="10" y2="9" />
  </svg>
);

const AutoNumberIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const FormatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const NumberIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const ResetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const CurrencyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="6" x2="12" y2="18" />
    <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h2a2 2 0 0 0 2-2" />
  </svg>
);

const SettingsGearIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const PreviewIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SignatureIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17c3-3 5 2 8 0s5-5 8-2" />
    <line x1="3" y1="21" x2="21" y2="21" />
  </svg>
);

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// Toggle Switch Component
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
  <button
    className={`settings-toggle ${checked ? 'active' : ''}`}
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
  >
    <span className="settings-toggle-track">
      <span className="settings-toggle-thumb" />
    </span>
  </button>
);

// Select Component
const Select = ({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[]
}) => (
  <select
    className="settings-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

interface SavedItem {
  id: string;
  data: string;
  name: string;
}

const SettingsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Invoice settings state
  const [autoAddInvoiceNumber, setAutoAddInvoiceNumber] = useState(true);
  const [invoiceFormat, setInvoiceFormat] = useState("invoice-date-timestamp");
  const [startingNumber, setStartingNumber] = useState("1");
  const [resetFrequency, setResetFrequency] = useState("never");
  const [currency, setCurrency] = useState(getDefaultCurrency());

  // Signature state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedItem[]>([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [penColor, setPenColor] = useState("#000000");

  // Logo state
  const [savedLogos, setSavedLogos] = useState<SavedItem[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load saved signatures and logos from localStorage
  useEffect(() => {
    const loadedSignatures = localStorage.getItem("userSignatures");
    if (loadedSignatures) {
      try {
        setSavedSignatures(JSON.parse(loadedSignatures));
      } catch (e) { }
    }
    const selectedSig = localStorage.getItem("selectedSignatureId");
    if (selectedSig) setSelectedSignatureId(selectedSig);

    const loadedLogos = localStorage.getItem("userLogos");
    if (loadedLogos) {
      try {
        setSavedLogos(JSON.parse(loadedLogos));
      } catch (e) { }
    }
    const selectedLg = localStorage.getItem("selectedLogoId");
    if (selectedLg) setSelectedLogoId(selectedLg);
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setDefaultCurrency(newCurrency);
    setToastMessage("Currency updated");
    setShowToast(true);
  };

  const getPreviewText = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Math.floor(date.getTime() / 1000);

    switch (invoiceFormat) {
      case "invoice-date-timestamp":
        return `INV-${dateStr}-${timestamp}`;
      case "unique-id":
        return `INV-${crypto.randomUUID?.()?.slice(0, 8) || 'a1b2c3d4'}`;
      case "sequential":
        return `INV-${String(parseInt(startingNumber) || 1).padStart(5, '0')}`;
      default:
        return `INV-${dateStr}-${timestamp}`;
    }
  };

  // Signature handlers
  const handleSaveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const newSignature: SavedItem = {
        id: Date.now().toString(),
        data: signatureRef.current.toDataURL(),
        name: `Signature ${savedSignatures.length + 1}`,
      };
      const updated = [...savedSignatures, newSignature];
      setSavedSignatures(updated);
      localStorage.setItem("userSignatures", JSON.stringify(updated));
      if (updated.length === 1) {
        setSelectedSignatureId(newSignature.id);
        localStorage.setItem("selectedSignatureId", newSignature.id);
      }
      setShowSignatureModal(false);
      setToastMessage("Signature saved");
      setShowToast(true);
    }
  };

  const handleSelectSignature = (id: string | null) => {
    setSelectedSignatureId(id);
    if (id) {
      localStorage.setItem("selectedSignatureId", id);
    } else {
      localStorage.removeItem("selectedSignatureId");
    }
  };

  const handleDeleteSignature = (id: string) => {
    const updated = savedSignatures.filter(s => s.id !== id);
    setSavedSignatures(updated);
    localStorage.setItem("userSignatures", JSON.stringify(updated));
    if (selectedSignatureId === id) {
      const newId = updated.length > 0 ? updated[0].id : null;
      setSelectedSignatureId(newId);
      if (newId) localStorage.setItem("selectedSignatureId", newId);
      else localStorage.removeItem("selectedSignatureId");
    }
    setToastMessage("Signature deleted");
    setShowToast(true);
  };

  // Logo handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      setToastMessage("Logo must be under 100KB");
      setShowToast(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newLogo: SavedItem = {
        id: Date.now().toString(),
        data: event.target?.result as string,
        name: file.name.split('.')[0] || `Logo ${savedLogos.length + 1}`,
      };
      const updated = [...savedLogos, newLogo];
      setSavedLogos(updated);
      localStorage.setItem("userLogos", JSON.stringify(updated));
      if (updated.length === 1) {
        setSelectedLogoId(newLogo.id);
        localStorage.setItem("selectedLogoId", newLogo.id);
      }
      setToastMessage("Logo uploaded");
      setShowToast(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectLogo = (id: string | null) => {
    setSelectedLogoId(id);
    if (id) {
      localStorage.setItem("selectedLogoId", id);
    } else {
      localStorage.removeItem("selectedLogoId");
    }
  };

  const handleDeleteLogo = (id: string) => {
    const updated = savedLogos.filter(l => l.id !== id);
    setSavedLogos(updated);
    localStorage.setItem("userLogos", JSON.stringify(updated));
    if (selectedLogoId === id) {
      const newId = updated.length > 0 ? updated[0].id : null;
      setSelectedLogoId(newId);
      if (newId) localStorage.setItem("selectedLogoId", newId);
      else localStorage.removeItem("selectedLogoId");
    }
    setToastMessage("Logo deleted");
    setShowToast(true);
  };

  return (
    <IonPage className={isDarkMode ? "dark-theme" : ""}>
      <IonContent fullscreen className="ion-padding">
        <div className={`settings-container ${isDarkMode ? 'dark' : 'light'}`}>
          {/* Invoice Number Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <InvoiceIcon />
              <h2>Invoice Number</h2>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-row-left">
                  <div className="settings-icon"><AutoNumberIcon /></div>
                  <div className="settings-row-content">
                    <span className="settings-label">Auto Add Invoice Number</span>
                    <span className="settings-sublabel">Automatically assign numbers to new invoices</span>
                  </div>
                </div>
                <Toggle checked={autoAddInvoiceNumber} onChange={setAutoAddInvoiceNumber} />
              </div>

              <div className="settings-row">
                <div className="settings-row-left">
                  <div className="settings-icon"><FormatIcon /></div>
                  <div className="settings-row-content">
                    <span className="settings-label">Format</span>
                  </div>
                </div>
                <Select
                  value={invoiceFormat}
                  onChange={setInvoiceFormat}
                  options={[
                    { value: "invoice-date-timestamp", label: "INV-DATE-TIMESTAMP" },
                    { value: "unique-id", label: "Unique Identifier" },
                    { value: "sequential", label: "Sequential Number" },
                  ]}
                />
              </div>

              {invoiceFormat === "sequential" && (
                <>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div className="settings-icon"><NumberIcon /></div>
                      <div className="settings-row-content">
                        <span className="settings-label">Starting Number</span>
                        <span className="settings-sublabel">First number for sequential format</span>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={startingNumber}
                      onChange={(e) => setStartingNumber(e.target.value)}
                      className="settings-number-input"
                    />
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div className="settings-icon"><ResetIcon /></div>
                      <div className="settings-row-content">
                        <span className="settings-label">Number Reset</span>
                      </div>
                    </div>
                    <Select
                      value={resetFrequency}
                      onChange={setResetFrequency}
                      options={[
                        { value: "never", label: "Never" },
                        { value: "daily", label: "Daily" },
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Yearly" },
                      ]}
                    />
                  </div>
                </>
              )}

              <div className="settings-preview">
                <div className="settings-preview-icon"><PreviewIcon /></div>
                <div className="settings-preview-content">
                  <span className="settings-preview-label">Preview</span>
                  <span className="settings-preview-value">{getPreviewText()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Signature Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <SignatureIcon />
              <h2>Signatures</h2>
            </div>

            <div className="settings-card">
              <div className="settings-media-grid">
                {/* None option */}
                <div
                  className={`settings-media-item ${selectedSignatureId === null ? 'selected' : ''}`}
                  onClick={() => handleSelectSignature(null)}
                >
                  <span className="settings-media-none">None</span>
                  {selectedSignatureId === null && (
                    <div className="settings-media-check"><CheckIcon /></div>
                  )}
                </div>

                {savedSignatures.map(sig => (
                  <div
                    key={sig.id}
                    className={`settings-media-item ${selectedSignatureId === sig.id ? 'selected' : ''}`}
                    onClick={() => handleSelectSignature(sig.id)}
                  >
                    <img src={sig.data} alt="Signature" />
                    {selectedSignatureId === sig.id && (
                      <div className="settings-media-check"><CheckIcon /></div>
                    )}
                    <button
                      className="settings-media-delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSignature(sig.id); }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}

                {savedSignatures.length < 3 && (
                  <button
                    className="settings-media-add"
                    onClick={() => setShowSignatureModal(true)}
                  >
                    <PlusIcon />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Logo Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <LogoIcon />
              <h2>Logos</h2>
            </div>

            <div className="settings-card">
              <div className="settings-media-grid">
                {/* None option */}
                <div
                  className={`settings-media-item ${selectedLogoId === null ? 'selected' : ''}`}
                  onClick={() => handleSelectLogo(null)}
                >
                  <span className="settings-media-none">None</span>
                  {selectedLogoId === null && (
                    <div className="settings-media-check"><CheckIcon /></div>
                  )}
                </div>

                {savedLogos.map(logo => (
                  <div
                    key={logo.id}
                    className={`settings-media-item ${selectedLogoId === logo.id ? 'selected' : ''}`}
                    onClick={() => handleSelectLogo(logo.id)}
                  >
                    <img src={logo.data} alt="Logo" />
                    {selectedLogoId === logo.id && (
                      <div className="settings-media-check"><CheckIcon /></div>
                    )}
                    <button
                      className="settings-media-delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteLogo(logo.id); }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}

                {savedLogos.length < 3 && (
                  <button
                    className="settings-media-add"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <UploadIcon />
                    <span>Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </div>
          </section>

          {/* General Settings Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <SettingsGearIcon />
              <h2>General Settings</h2>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-row-left">
                  <div className="settings-icon"><CurrencyIcon /></div>
                  <div className="settings-row-content">
                    <span className="settings-label">Default Currency</span>
                  </div>
                </div>
                <Select
                  value={currency}
                  onChange={handleCurrencyChange}
                  options={[
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                    { value: "INR", label: "INR (₹)" },
                    { value: "AUD", label: "AUD (A$)" },
                    { value: "CAD", label: "CAD (C$)" },
                    { value: "JPY", label: "JPY (¥)" },
                  ]}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Signature Modal */}
        <IonModal isOpen={showSignatureModal} onDidDismiss={() => setShowSignatureModal(false)}>
          <div className={`signature-modal ${isDarkMode ? 'dark' : 'light'}`}>
            <div className="signature-modal-header">
              <h3>Draw Signature</h3>
              <button onClick={() => setShowSignatureModal(false)}>×</button>
            </div>
            <div className="signature-modal-content">
              <div className="signature-canvas-wrapper">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor={penColor}
                  canvasProps={{
                    width: 400,
                    height: 180,
                    className: 'signature-canvas'
                  }}
                />
              </div>
              <div className="signature-colors">
                {['#000000', '#0066CC', '#CC0000', '#00AA00'].map(color => (
                  <button
                    key={color}
                    className={`signature-color ${penColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPenColor(color)}
                  />
                ))}
              </div>
              <div className="signature-actions">
                <IonButton fill="outline" onClick={() => signatureRef.current?.clear()}>
                  Clear
                </IonButton>
                <IonButton onClick={handleSaveSignature}>
                  Save Signature
                </IonButton>
              </div>
            </div>
          </div>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;

