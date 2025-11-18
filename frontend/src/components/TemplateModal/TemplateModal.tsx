import React, { useState, useEffect } from "react";
import {
  IonAlert,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonToast,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
} from "@ionic/react";
import {
  chevronForward,
  layers,
  close,
  phonePortraitOutline,
  tabletPortraitOutline,
  desktopOutline,
  filterOutline,
  timeOutline,
  folderOpenOutline,
  gridOutline,
} from "ionicons/icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useInvoice } from "../../contexts/InvoiceContext";
import { DATA } from "../../templates";
import { tempMeta, TemplateMeta } from "../../templates-meta";
import { File } from "../Storage/LocalStorage";
import { useHistory } from "react-router-dom";
import {
  addToRecentTemplates,
  getRecentTemplates,
  getOnlineInvoices,
  TemplateHistoryItem,
  OnlineInvoiceItem,
} from "../../utils/templateHistory";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileCreated?: (fileName: string, templateId: number) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onFileCreated,
}) => {
  const { isDarkMode } = useTheme();
  const { store, updateSelectedFile, updateBillType } = useInvoice();
  const history = useHistory();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showFileNamePrompt, setShowFileNamePrompt] = useState(false);
  const [selectedTemplateForFile, setSelectedTemplateForFile] = useState<
    number | null
  >(null);
  const [newFileName, setNewFileName] = useState("");

  // New tab-based state
  const [activeTab, setActiveTab] = useState<"recent" | "yours" | "default">("recent");

  // Filter state
  const [templateFilter, setTemplateFilter] = useState<"all" | "web" | "mobile" | "tablet">("all");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterPopoverEvent, setFilterPopoverEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState<"device" | "category" | "domain">("device");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // Data state
  const [recentTemplates, setRecentTemplates] = useState<TemplateHistoryItem[]>([]);
  const [onlineInvoices, setOnlineInvoices] = useState<OnlineInvoiceItem[]>([]);

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 692);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load templates from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplatesFromStorage();
      initializeFilters();
    }
  }, [isOpen]);

  const loadTemplatesFromStorage = async () => {
    try {
      const recent = await getRecentTemplates();
      setRecentTemplates(recent);

      // Load online invoices imported from Invoice Store
      const online = await getOnlineInvoices();
      setOnlineInvoices(online);
    } catch (error) {
      console.error("Error loading templates from storage:", error);
    }
  };

  // Initialize filters with all available options
  const initializeFilters = () => {
    // Get all unique device types
    const devices = Array.from(
      new Set(tempMeta.map((t) => t.deviceType))
    );
    setSelectedDevices(devices);

    // Get all unique categories
    const categories = Array.from(
      new Set(tempMeta.map((t) => t.category))
    );
    setSelectedCategories(categories);

    // Get all unique domains
    const domains = Array.from(
      new Set(tempMeta.map((t) => t.domain))
    );
    setSelectedDomains(domains);
  };

  const getTemplateMetadata = (templateId: number) => {
    return tempMeta.find((meta) => meta.template_id === templateId);
  };

  // Categorize templates based on their metadata category
  const categorizeTemplate = (template_id: number) => {
    const metadata = getTemplateMetadata(template_id);
    if (!metadata?.category) return "web";

    const category = metadata.category.toLowerCase();
    if (category === "mobile") {
      return "mobile";
    } else if (category === "tablet") {
      return "tablet";
    } else {
      return "web";
    }
  };

  // Get categorized templates
  const getCategorizedTemplates = () => {
    const templates = tempMeta;
    const categorized = {
      web: templates.filter((t) => {
        return categorizeTemplate(t.template_id) === "web";
      }),
      mobile: templates.filter((t) => {
        return categorizeTemplate(t.template_id) === "mobile";
      }),
      tablet: templates.filter((t) => {
        return categorizeTemplate(t.template_id) === "tablet";
      }),
    };
    return categorized;
  };

  // Get filtered templates based on current filter
  const getFilteredTemplates = () => {
    let templates = tempMeta;

    // Apply device filter
    if (selectedDevices.length > 0 && selectedDevices.length < 3) {
      templates = templates.filter((t) =>
        selectedDevices.includes(t.deviceType)
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      templates = templates.filter((t) =>
        selectedCategories.includes(t.category)
      );
    }

    // Apply domain filter
    if (selectedDomains.length > 0) {
      templates = templates.filter((t) =>
        selectedDomains.includes(t.domain)
      );
    }

    return templates;
  };

  const handleTemplateSelect = async (templateId: number, fileName?: string) => {
    setSelectedTemplateForFile(templateId);
    setShowFileNamePrompt(true);

    // If selecting from recent or user templates, update recent
    if (fileName) {
      await addToRecentTemplates(templateId, fileName);
      await loadTemplatesFromStorage();
    }
  };

  // Reset template filter when modal closes
  const handleModalClose = () => {
    setTemplateFilter("all");
    setActiveTab("recent"); // Reset to recent tab
    setSelectedTemplateForFile(null);
    setNewFileName("");
    setShowFileNamePrompt(false);
    // Reset filters
    initializeFilters();
    onClose();
  };

  /* Utility functions */
  const _validateName = async (filename: string) => {
    filename = filename.trim();
    if (filename === "Untitled") {
      return {
        isValid: false,
        message: "cannot update Untitled file! Use Save As Button to save.",
      };
    } else if (filename === "" || !filename) {
      return {
        isValid: false,
        message: "Filename cannot be empty",
      };
    } else if (filename.length > 30) {
      return {
        isValid: false,
        message: "Filename too long",
      };
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      return {
        isValid: false,
        message: "Special Characters cannot be used",
      };
    } else if (await store._checkKey(filename)) {
      return {
        isValid: false,
        message: "Filename already exists",
      };
    }
    return {
      isValid: true,
      message: "",
    };
  };

  // Create new file with template
  const createNewFileWithTemplate = async (
    templateId: number,
    fileName: string
  ) => {
    try {
      // Validate filename first
      const validation = await _validateName(fileName);
      if (!validation.isValid) {
        setToastMessage(validation.message);
        setShowToast(true);
        return;
      }

      const templateData = DATA[templateId];
      if (!templateData) {
        setToastMessage("Template not found");
        setShowToast(true);
        return;
      }

      const mscContent = templateData.msc;
      const jsonMsc = JSON.stringify(mscContent);
      if (!mscContent) {
        setToastMessage("Error creating template content");
        setShowToast(true);
        return;
      }

      // Find the active footer index, default to 1 if none found
      const activeFooter = templateData.footers?.find(
        (footer) => footer.isActive
      );
      const activeFooterIndex = activeFooter ? activeFooter.index : 1;

      const now = new Date().toISOString();
      const newFile = new File(
        now,
        now,
        encodeURIComponent(jsonMsc), // mscContent is already a JSON string
        fileName,
        activeFooterIndex,
        templateId,
        false
      );

      await store._saveFile(newFile);

      setToastMessage(
        `File "${fileName}" created with ${templateData.template}`
      );
      setShowToast(true);

      // Add to recent templates only (Yours tab loads from LocalStorage)
      await addToRecentTemplates(templateId, fileName);

      // Reset modal state
      setShowFileNamePrompt(false);
      setSelectedTemplateForFile(null);
      setNewFileName("");
      handleModalClose();

      updateSelectedFile(fileName);
      updateBillType(activeFooterIndex);

      // Call the callback if provided
      if (onFileCreated) {
        onFileCreated(fileName, templateId);
      }

      setTimeout(() => {
        const link = document.createElement("a");
        link.href = `/app/editor/${fileName}`;
        link.click();
      }, 200);
    } catch (error) {
      setToastMessage("Failed to create file");
      setShowToast(true);
    }
  };

  // Helper function to render individual template items
  const renderTemplateItem = (template: any, keyPrefix?: string, showFileName?: boolean) => {
    const templateId = template.templateId || template.template_id;
    const metadata = getTemplateMetadata(templateId);
    const templateName =
      metadata?.name ||
      template.template ||
      template.name ||
      "Unknown Template";
    const category = categorizeTemplate(templateId);

    // Get the template data from DATA to access footers
    const templateData = DATA[templateId];
    const footers = templateData?.footers || [];

    // For recent/user templates, show file name
    const fileName = template.fileName || null;

    return (
      <div
        key={
          keyPrefix
            ? `${keyPrefix}-${templateId}-${fileName || ''}`
            : `${templateId}-${fileName || ''}`
        }
        onClick={() =>
          handleTemplateSelect(templateId, fileName)
        }
        style={{
          border: `1px solid ${isDarkMode
            ? "var(--ion-color-step-200)"
            : "var(--ion-color-step-150)"
            }`,
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "12px",
          cursor: "pointer",
          backgroundColor: isDarkMode
            ? "var(--ion-color-step-50)"
            : "var(--ion-background-color)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode
            ? "var(--ion-color-step-100)"
            : "var(--ion-color-step-50)";
          e.currentTarget.style.borderColor = isDarkMode
            ? "var(--ion-color-step-300)"
            : "var(--ion-color-step-200)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode
            ? "var(--ion-color-step-50)"
            : "var(--ion-background-color)";
          e.currentTarget.style.borderColor = isDarkMode
            ? "var(--ion-color-step-200)"
            : "var(--ion-color-step-150)";
        }}
      >
        {/* Template Image */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: isDarkMode
              ? "var(--ion-color-step-100)"
              : "var(--ion-color-step-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1px solid ${isDarkMode
              ? "var(--ion-color-step-200)"
              : "var(--ion-color-step-150)"
              }`,
          }}
        >
          {metadata?.ImageUri ? (
            <img
              src={`data:image/png;base64,${metadata.ImageUri}`}
              alt={metadata.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <IonIcon
              icon={layers}
              style={{
                fontSize: "24px",
                color: isDarkMode
                  ? "var(--ion-color-step-400)"
                  : "var(--ion-color-step-500)",
              }}
            />
          )}
        </div>

        {/* Template Info */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "15px",
              fontWeight: "600",
              color: isDarkMode
                ? "var(--ion-color-step-750)"
                : "var(--ion-color-step-650)",
              lineHeight: "1.3",
            }}
          >
            {templateName}
          </h3>
          {showFileName && fileName && (
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: isDarkMode
                  ? "var(--ion-color-step-600)"
                  : "var(--ion-color-step-550)",
                fontWeight: "500",
              }}
            >
              {fileName}
            </p>
          )}
          <p
            style={{
              margin: "0 0 6px 0",
              fontSize: "12px",
              color: isDarkMode
                ? "var(--ion-color-step-500)"
                : "var(--ion-color-step-450)",
              fontWeight: "400",
            }}
          >
            {footers.length} footer{footers.length !== 1 ? "s" : ""}
            {showFileName && template.lastUsed && (
              <span style={{ marginLeft: "8px" }}>
                • {new Date(template.lastUsed).toLocaleDateString()}
              </span>
            )}
          </p>
          {/* Category Badge */}
          <div
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              display: "inline-block",
              fontWeight: "500",
              letterSpacing: "0.3px",
              backgroundColor: isDarkMode
                ? "var(--ion-color-step-150)"
                : "var(--ion-color-step-100)",
              color: isDarkMode
                ? "var(--ion-color-step-600)"
                : "var(--ion-color-step-500)",
              border: `1px solid ${isDarkMode
                ? "var(--ion-color-step-200)"
                : "var(--ion-color-step-150)"
                }`,
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
        </div>

        {/* Arrow Icon */}
        <IonIcon
          icon={chevronForward}
          style={{
            fontSize: "18px",
            color: isDarkMode
              ? "var(--ion-color-step-400)"
              : "var(--ion-color-step-350)",
            opacity: 0.7,
          }}
        />
      </div>
    );
  };

  const filteredTemplates = getFilteredTemplates();
  const categorized = getCategorizedTemplates();

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
        <IonContent>
          {/* Tab Segment */}
          <div
            style={{
              padding: "16px 16px 0 16px",
              background: isDarkMode
                ? "var(--ion-color-step-50)"
                : "var(--ion-background-color)",
            }}
          >
            <IonSegment
              value={activeTab}
              onIonChange={(e) =>
                setActiveTab(e.detail.value as "recent" | "yours" | "default")
              }
              style={{
                background: isDarkMode
                  ? "var(--ion-color-step-150)"
                  : "var(--ion-color-step-100)",
                borderRadius: "8px",
                padding: "3px",
                border: `1px solid ${isDarkMode
                  ? "var(--ion-color-step-250)"
                  : "var(--ion-color-step-150)"
                  }`,
                marginBottom: "12px",
              }}
            >
              <IonSegmentButton value="recent">
                <IonIcon icon={timeOutline} style={{ fontSize: "16px" }} />
                <IonText style={{ fontSize: "12px", fontWeight: "500", marginLeft: "4px" }}>
                  Recent ({recentTemplates.length})
                </IonText>
              </IonSegmentButton>
              <IonSegmentButton value="yours">
                <IonIcon icon={folderOpenOutline} style={{ fontSize: "16px" }} />
                <IonText style={{ fontSize: "12px", fontWeight: "500", marginLeft: "4px" }}>
                  Yours ({onlineInvoices.length})
                </IonText>
              </IonSegmentButton>
              <IonSegmentButton value="default">
                <IonIcon icon={gridOutline} style={{ fontSize: "16px" }} />
                <IonText style={{ fontSize: "12px", fontWeight: "500", marginLeft: "4px" }}>
                  Default ({tempMeta.length})
                </IonText>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Filter Buttons - Only show for default tab */}
          {activeTab === "default" && (
            <div
              style={{
                padding: "0 16px 16px 16px",
                background: isDarkMode
                  ? "var(--ion-color-step-50)"
                  : "var(--ion-background-color)",
                borderBottom: `1px solid ${isDarkMode
                  ? "var(--ion-color-step-200)"
                  : "var(--ion-color-step-150)"
                  }`,
                margin: "0",
                display: "flex",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              {/* Device Filter */}
              <IonButton
                fill="outline"
                size="small"
                onClick={(e) => {
                  setFilterType("device");
                  setFilterPopoverEvent(e.nativeEvent);
                  setShowFilterPopover(true);
                }}
                style={{
                  "--border-color": isDarkMode
                    ? "var(--ion-color-step-300)"
                    : "var(--ion-color-step-200)",
                }}
              >
                <IonIcon icon={phonePortraitOutline} slot="start" />
                <IonText style={{ fontSize: "12px", fontWeight: "500" }}>
                  Device ({selectedDevices.length})
                </IonText>
              </IonButton>

              {/* Category Filter */}
              <IonButton
                fill="outline"
                size="small"
                onClick={(e) => {
                  setFilterType("category");
                  setFilterPopoverEvent(e.nativeEvent);
                  setShowFilterPopover(true);
                }}
                style={{
                  "--border-color": isDarkMode
                    ? "var(--ion-color-step-300)"
                    : "var(--ion-color-step-200)",
                }}
              >
                <IonIcon icon={gridOutline} slot="start" />
                <IonText style={{ fontSize: "12px", fontWeight: "500" }}>
                  Category ({selectedCategories.length})
                </IonText>
              </IonButton>

              {/* Domain Filter */}
              <IonButton
                fill="outline"
                size="small"
                onClick={(e) => {
                  setFilterType("domain");
                  setFilterPopoverEvent(e.nativeEvent);
                  setShowFilterPopover(true);
                }}
                style={{
                  "--border-color": isDarkMode
                    ? "var(--ion-color-step-300)"
                    : "var(--ion-color-step-200)",
                }}
              >
                <IonIcon icon={folderOpenOutline} slot="start" />
                <IonText style={{ fontSize: "12px", fontWeight: "500" }}>
                  Domain ({selectedDomains.length})
                </IonText>
              </IonButton>
            </div>
          )}

          {/* Content based on active tab */}
          <div style={{ padding: "16px" }}>
            {activeTab === "recent" && (
              <>
                {recentTemplates.length === 0 ? (
                  <IonText color="medium">
                    <p style={{ textAlign: "center", padding: "32px 16px" }}>
                      No recent templates. Create a file to see it here.
                    </p>
                  </IonText>
                ) : (
                  <div>
                    {recentTemplates.map((template) =>
                      renderTemplateItem(template, "recent", true)
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "yours" && (
              <>
                {onlineInvoices.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px"
                  }}>
                    <IonText color="medium">
                      <p style={{ margin: "0 0 8px 0" }}>
                        No online invoices imported yet.
                      </p>
                      <p style={{ margin: "0", fontSize: "14px" }}>
                        Import an invoice from the Invoice Store
                      </p>
                    </IonText>
                    <IonButton
                      onClick={() => {
                        handleModalClose();
                        history.push("/app/invoice-store");
                      }}
                      fill="solid"
                      color="primary"
                      style={{
                        "--padding-start": "24px",
                        "--padding-end": "24px",
                      }}
                    >
                      <IonIcon icon={folderOpenOutline} slot="start" />
                      Go to Invoice Store
                    </IonButton>
                  </div>
                ) : (
                  <div>
                    {onlineInvoices.map((template) =>
                      renderTemplateItem(template, "yours", true)
                    )}
                  </div>
                )}
              </>
            )}            {activeTab === "default" && (
              <>
                {filteredTemplates.length === 0 ? (
                  <IonText color="medium">
                    <p style={{ textAlign: "center", padding: "32px 16px" }}>
                      No templates found in this category.
                    </p>
                  </IonText>
                ) : (
                  <div>
                    {filteredTemplates.map((template) =>
                      renderTemplateItem(template, "template-modal", false)
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* File Name Prompt Alert */}
      {showFileNamePrompt &&
        selectedTemplateForFile !== null &&
        getTemplateMetadata(selectedTemplateForFile) && (
          <IonAlert
            animated
            isOpen={true}
            onDidDismiss={() => {
              setShowFileNamePrompt(false);
              setSelectedTemplateForFile(null);
              setNewFileName("");
            }}
            header="Create New File"
            message={`Create a new ${getTemplateMetadata(selectedTemplateForFile)?.name
              } file`}
            inputs={[
              {
                name: "filename",
                type: "text",
                value: newFileName,
                placeholder: "Enter file name",
              },
            ]}
            buttons={[
              {
                text: "Cancel",
                role: "cancel",
                handler: () => {
                  setSelectedTemplateForFile(null);
                  setNewFileName("");
                },
              },
              {
                text: "Create",
                handler: async (data) => {
                  const fileName = data.filename?.trim();
                  if (!fileName) {
                    setToastMessage("Please enter a file name");
                    setShowToast(true);
                    // Clear the filename and close the alert when validation fails
                    setNewFileName("");
                    setShowFileNamePrompt(false);
                    setSelectedTemplateForFile(null);
                    return false; // Prevent alert from closing automatically
                  }

                  if (selectedTemplateForFile) {
                    // Validate the filename before creating
                    const validation = await _validateName(fileName);
                    if (!validation.isValid) {
                      setToastMessage(validation.message);
                      setShowToast(true);
                      // Clear the filename and close the alert when validation fails
                      setNewFileName("");
                      setShowFileNamePrompt(false);
                      setSelectedTemplateForFile(null);
                      return false; // Prevent alert from closing automatically
                    }

                    // If validation passes, create the file
                    await createNewFileWithTemplate(
                      selectedTemplateForFile,
                      fileName
                    );
                    return true; // Allow alert to close
                  }
                  return false;
                },
              },
            ]}
          />
        )}

      {/* Filter Popover */}
      <IonPopover
        isOpen={showFilterPopover}
        event={filterPopoverEvent}
        onDidDismiss={() => setShowFilterPopover(false)}
      >
        <IonList>
          <IonItem lines="full">
            <IonLabel>
              <h2 style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Filter by {filterType === "device" ? "Device" : filterType === "category" ? "Category" : "Domain"}
              </h2>
            </IonLabel>
          </IonItem>

          {filterType === "device" &&
            Array.from(new Set(tempMeta.map((t) => t.deviceType))).map((device) => (
              <IonItem key={device}>
                <IonLabel style={{ textTransform: "capitalize" }}>{device}</IonLabel>
                <IonCheckbox
                  slot="start"
                  checked={selectedDevices.includes(device)}
                  onIonChange={(e) => {
                    if (e.detail.checked) {
                      setSelectedDevices([...selectedDevices, device]);
                    } else {
                      setSelectedDevices(selectedDevices.filter((d) => d !== device));
                    }
                  }}
                />
              </IonItem>
            ))}

          {filterType === "category" &&
            Array.from(new Set(tempMeta.map((t) => t.category))).map((category) => (
              <IonItem key={category}>
                <IonLabel style={{ textTransform: "capitalize" }}>
                  {category.replace(/_/g, " ")}
                </IonLabel>
                <IonCheckbox
                  slot="start"
                  checked={selectedCategories.includes(category)}
                  onIonChange={(e) => {
                    if (e.detail.checked) {
                      setSelectedCategories([...selectedCategories, category]);
                    } else {
                      setSelectedCategories(selectedCategories.filter((c) => c !== category));
                    }
                  }}
                />
              </IonItem>
            ))}

          {filterType === "domain" &&
            Array.from(new Set(tempMeta.map((t) => t.domain))).map((domain) => (
              <IonItem key={domain}>
                <IonLabel style={{ textTransform: "capitalize" }}>
                  {domain.replace(/_/g, " ")}
                </IonLabel>
                <IonCheckbox
                  slot="start"
                  checked={selectedDomains.includes(domain)}
                  onIonChange={(e) => {
                    if (e.detail.checked) {
                      setSelectedDomains([...selectedDomains, domain]);
                    } else {
                      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
                    }
                  }}
                />
              </IonItem>
            ))}
        </IonList>
      </IonPopover>

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
