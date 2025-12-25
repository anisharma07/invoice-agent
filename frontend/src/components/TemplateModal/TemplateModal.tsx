import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonText,
  IonToast,
  IonSpinner,
  IonCard,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  close,
  documentTextOutline,
  briefcaseOutline,
  createOutline,
  layersOutline,
} from "ionicons/icons";
import { useTheme } from "../../contexts/ThemeContext";
import { storageApi, Template } from "../../services/storage-api";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile?: (templateId: string, templateName: string) => void;
  onCreateJob?: (templateId: string, templateName: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  onCreateJob,
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const history = useHistory();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserTemplates();
    }
  }, [isOpen]);

  const loadUserTemplates = async () => {
    setIsLoading(true);
    try {
      const userId = user?.sub || 'default_user';
      const result = await storageApi.fetchTemplates(1, 100, userId);
      setUserTemplates(result.items);
    } catch (error) {
      console.error("Error loading templates:", error);
      setToastMessage("Failed to load templates");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    onClose();
  };

  const handleCreateFile = (template: Template) => {
    // Navigate to InvoicePage with template mode
    // Using ?template=<id> loads a FRESH template without any saved filename
    // The user will provide a name when they save the invoice
    handleModalClose();
    history.push(`/app/editor/invoice?template=${template.id}`);
  };

  const handleCreateJob = (template: Template) => {
    if (onCreateJob) {
      onCreateJob(String(template.id), template.name);
    }
    handleModalClose();
  };

  const navigateToTemplates = () => {
    handleModalClose();
    history.push('/app/templates');
  };

  // Get image src with fallback for base64
  const getImageSrc = (image: string | undefined) => {
    if (!image) return null;
    if (image.startsWith('data:') || image.startsWith('http')) {
      return image;
    }
    return `data:image/png;base64,${image}`;
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleModalClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Choose Template</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={handleModalClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <IonSpinner name="crescent" style={{ width: '48px', height: '48px' }} />
              <p style={{ marginTop: '16px', color: 'var(--ion-color-medium)' }}>Loading templates...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && userTemplates.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <IonIcon
                icon={layersOutline}
                style={{
                  fontSize: '64px',
                  color: 'var(--ion-color-medium)',
                  opacity: 0.5
                }}
              />
              <div>
                <h2 style={{
                  margin: '0 0 8px 0',
                  fontSize: '20px',
                  color: isDarkMode ? 'var(--ion-color-step-750)' : 'var(--ion-color-step-700)'
                }}>
                  No Saved Templates
                </h2>
                <p style={{
                  margin: '0 0 24px 0',
                  color: 'var(--ion-color-medium)',
                  fontSize: '14px',
                  maxWidth: '300px'
                }}>
                  You haven't saved any templates yet. Browse the template store to import templates.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <IonButton fill="solid" onClick={navigateToTemplates}>
                  <IonIcon icon={layersOutline} slot="start" />
                  Browse Templates
                </IonButton>
              </div>
            </div>
          )}

          {/* Templates List */}
          {!isLoading && userTemplates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userTemplates.map((template, index) => (
                <div
                  key={`template-${template.id}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: isDarkMode
                      ? 'var(--ion-color-step-50)'
                      : 'var(--ion-background-color)',
                    border: `1px solid ${isDarkMode ? 'var(--ion-color-step-200)' : 'var(--ion-color-step-150)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Template Thumbnail */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: isDarkMode
                      ? 'var(--ion-color-step-100)'
                      : 'var(--ion-color-step-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${isDarkMode ? 'var(--ion-color-step-200)' : 'var(--ion-color-step-100)'}`
                  }}>
                    {template.image ? (
                      <img
                        src={getImageSrc(template.image)}
                        alt={template.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <IonIcon
                        icon={documentTextOutline}
                        style={{ fontSize: '28px', color: 'var(--ion-color-medium)', opacity: 0.5 }}
                      />
                    )}
                  </div>

                  {/* Template Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: isDarkMode ? 'var(--ion-color-step-800)' : 'var(--ion-color-step-700)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {template.name}
                    </h3>
                    <p style={{
                      margin: '0',
                      fontSize: '13px',
                      color: 'var(--ion-color-medium)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {template.description || 'Invoice Template'}
                    </p>
                    {template.type && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isDarkMode ? 'var(--ion-color-step-150)' : 'var(--ion-color-step-100)',
                        color: 'var(--ion-color-medium)',
                        textTransform: 'capitalize'
                      }}>
                        {template.type}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <IonButton
                      fill="solid"
                      size="small"
                      onClick={() => handleCreateFile(template)}
                    >
                      <IonIcon icon={createOutline} slot="start" />
                      Create File
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => handleCreateJob(template)}
                    >
                      <IonIcon icon={briefcaseOutline} slot="start" />
                      Create Job
                    </IonButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastMessage.includes("successfully") ? "success" : "warning"}
        position="top"
      />
    </>
  );
};

export default TemplateModal;
