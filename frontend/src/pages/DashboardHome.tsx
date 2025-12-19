import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonToast,
    IonAlert
} from '@ionic/react';
import {
    layers,
    chevronForward,
    add,
    close,
    phonePortraitOutline,
    tabletPortraitOutline,
    desktopOutline
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useInvoice } from '../contexts/InvoiceContext';
import { useHistory } from 'react-router-dom';
import { DATA } from '../templates';
import { tempMeta } from '../templates-meta';
import { File } from '../components/Storage/LocalStorage';
import TemplateModal from '../components/TemplateModal/TemplateModal';

const DashboardHome: React.FC = () => {
    const { isDarkMode } = useTheme();
    const { store, updateSelectedFile, updateBillType } = useInvoice();
    const history = useHistory();

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showSharedTemplateModal, setShowSharedTemplateModal] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

    const [templateFilter, setTemplateFilter] = useState<"all" | "web" | "mobile" | "tablet">("all");
    const [selectedTemplateForFile, setSelectedTemplateForFile] = useState<number | null>(null);
    const [showFileNamePrompt, setShowFileNamePrompt] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 692);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Load recent invoices
    useEffect(() => {
        loadRecentInvoices();
    }, []);

    const loadRecentInvoices = async () => {
        try {
            const recent = await store._getRecentInvoices(3);
            setRecentInvoices(recent);
        } catch (error) {
            console.error("Error loading recent invoices:", error);
        }
    };

    const getTemplateMetadata = (templateId: number) => {
        return tempMeta.find((meta) => meta.template_id === templateId);
    };

    const categorizeTemplate = (templateId: number) => {
        const metadata = getTemplateMetadata(templateId);
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

    const getAvailableTemplates = () => {
        return tempMeta.map((template) => {
            const extra = DATA[template.template_id];
            return {
                templateId: template.template_id,
                template: template.name,
                ImageUri: template.ImageUri,
                footers: extra?.footers || [],
                ...extra,
            };
        });
    };

    const getCategorizedTemplates = () => {
        const templates = tempMeta;
        const categorized = {
            web: templates.filter((t) => categorizeTemplate(t.template_id) === "web"),
            mobile: templates.filter((t) => categorizeTemplate(t.template_id) === "mobile"),
            tablet: templates.filter((t) => categorizeTemplate(t.template_id) === "tablet"),
        };
        return categorized;
    };

    const getFilteredTemplates = () => {
        const categorized = getCategorizedTemplates();
        if (templateFilter === "all") {
            return [...categorized.web, ...categorized.mobile, ...categorized.tablet];
        } else {
            return categorized[templateFilter] || [];
        }
    };

    const handleTemplateSelect = (templateId: number) => {
        setSelectedTemplateForFile(templateId);
        setShowFileNamePrompt(true);
        if (isSmallScreen) {
            setShowTemplateModal(false);
        }
    };

    const handleModalClose = () => {
        setShowTemplateModal(false);
        setTemplateFilter("all");
    };

    const _validateName = async (filename: string) => {
        filename = filename.trim();
        if (filename === "Untitled") {
            return { isValid: false, message: "cannot update Untitled file! Use Save As Button to save." };
        } else if (filename === "" || !filename) {
            return { isValid: false, message: "Filename cannot be empty" };
        } else if (filename.length > 30) {
            return { isValid: false, message: "Filename too long" };
        } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
            return { isValid: false, message: "Special Characters cannot be used" };
        } else if (await store._checkKey(filename)) {
            return { isValid: false, message: "Filename already exists" };
        }
        return { isValid: true, message: "" };
    };

    const createNewFileWithTemplate = async (templateId: number, fileName: string) => {
        try {
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

            const activeFooter = templateData.footers?.find((footer) => footer.isActive);
            const activeFooterIndex = activeFooter ? activeFooter.index : 1;

            const now = new Date().toISOString();
            const newFile = new File(
                now,
                now,
                encodeURIComponent(jsonMsc),
                fileName,
                activeFooterIndex,
                templateId,
                false
            );

            await store._saveFile(newFile);

            setToastMessage(`File "${fileName}" created with ${templateData.template}`);
            setShowToast(true);

            setShowFileNamePrompt(false);
            setSelectedTemplateForFile(null);
            setNewFileName("");
            setShowTemplateModal(false);

            updateSelectedFile(fileName);
            updateBillType(activeFooterIndex);

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

    const renderTemplateModal = () => {
        const filteredTemplates = getFilteredTemplates();

        return (
            <IonModal isOpen={showTemplateModal} onDidDismiss={handleModalClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Choose Template</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleModalClose}>
                                <IonIcon icon={close} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{
                        padding: "16px",
                        background: isDarkMode ? "var(--ion-color-step-50)" : "var(--ion-color-step-50)",
                        borderBottom: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                        margin: "0",
                    }}>
                        <IonSegment
                            value={templateFilter}
                            onIonChange={e => setTemplateFilter(e.detail.value as any)}
                            mode="ios"
                            style={{ width: "100%" }}
                        >
                            <IonSegmentButton value="all">
                                <IonLabel>All</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="web">
                                <IonIcon icon={desktopOutline} />
                            </IonSegmentButton>
                            <IonSegmentButton value="mobile">
                                <IonIcon icon={phonePortraitOutline} />
                            </IonSegmentButton>
                            <IonSegmentButton value="tablet">
                                <IonIcon icon={tabletPortraitOutline} />
                            </IonSegmentButton>
                        </IonSegment>
                    </div>

                    <div style={{ padding: "16px" }}>
                        {filteredTemplates.map((template) => renderTemplateItem(template))}
                    </div>
                </IonContent>
            </IonModal>
        );
    };

    const renderTemplateItem = (template: any, keyPrefix?: string) => {
        const metadata = getTemplateMetadata(template.templateId || template.template_id);

        return (
            <div
                key={keyPrefix ? `${keyPrefix}-${template.templateId || template.template_id}` : template.templateId || template.template_id}
                onClick={() => handleTemplateSelect(template.templateId || template.template_id)}
                style={{
                    border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "12px",
                    cursor: "pointer",
                    backgroundColor: isDarkMode ? "var(--ion-color-step-50)" : "var(--ion-background-color)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.2s ease",
                }}
            >
                <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    backgroundColor: isDarkMode ? "var(--ion-color-step-100)" : "var(--ion-color-step-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                }}>
                    {metadata?.ImageUri ? (
                        <img
                            src={`data:image/png;base64,${metadata.ImageUri}`}
                            alt={metadata.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                    ) : (
                        <IonIcon
                            icon={layers}
                            style={{
                                fontSize: "24px",
                                color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-500)",
                            }}
                        />
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{
                        margin: "0 0 4px 0",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: isDarkMode ? "var(--ion-color-step-750)" : "var(--ion-color-step-650)",
                        lineHeight: "1.3",
                    }}>
                        {metadata?.name || template.template || "Unknown Template"}
                    </h3>
                    <div style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        display: "inline-block",
                        fontWeight: "500",
                        letterSpacing: "0.3px",
                        backgroundColor: isDarkMode ? "var(--ion-color-step-150)" : "var(--ion-color-step-100)",
                        color: isDarkMode ? "var(--ion-color-step-600)" : "var(--ion-color-step-500)",
                        border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                        textTransform: "uppercase",
                    }}>
                        {categorizeTemplate(template.templateId || template.template_id)}
                    </div>
                </div>

                <IonIcon
                    icon={chevronForward}
                    style={{
                        fontSize: "18px",
                        color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-350)",
                        opacity: 0.7,
                    }}
                />
            </div>
        );
    };

    return (
        <IonPage className={isDarkMode ? 'dark-theme' : ''}>
            <IonContent fullscreen className="ion-padding">
                <div style={{
                    padding: isSmallScreen ? "16px 16px 0 16px" : "16px",
                    background: isDarkMode ? "var(--ion-color-step-50)" : "var(--ion-color-step-25)",
                    borderBottom: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                    marginBottom: "8px",
                    borderRadius: "8px"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: isSmallScreen ? "16px" : "20px",
                    }}>
                        <h2 style={{
                            margin: "0",
                            fontSize: "20px",
                            fontWeight: "700",
                            color: isDarkMode ? "var(--ion-color-step-800)" : "var(--ion-color-step-700)",
                        }}>
                            Create New File
                        </h2>
                        {isSmallScreen && (
                            <IonButton
                                fill="clear"
                                size="small"
                                onClick={() => setShowTemplateModal(true)}
                                style={{ fontSize: "14px", fontWeight: "600" }}
                            >
                                View All <IonIcon icon={chevronForward} slot="end" style={{ fontSize: "14px" }} />
                            </IonButton>
                        )}
                    </div>

                    {!isSmallScreen && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "16px",
                            margin: "0 auto 16px auto",
                        }}>
                            {getAvailableTemplates().slice(0, 3).map((template) => {
                                const metadata = getTemplateMetadata(template.templateId);
                                return (
                                    <div
                                        key={template.templateId}
                                        onClick={() => handleTemplateSelect(template.templateId)}
                                        style={{
                                            border: "2px solid var(--ion-color-light)",
                                            borderRadius: "12px",
                                            padding: "20px",
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                            backgroundColor: "var(--ion-color-light-tint)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = "var(--ion-color-primary)";
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = "var(--ion-color-light)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                                        }}
                                    >
                                        <div style={{
                                            width: "80px",
                                            height: "80px",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            backgroundColor: "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            border: "1px solid var(--ion-color-medium-tint)",
                                        }}>
                                            {metadata?.ImageUri ? (
                                                <img
                                                    src={`data:image/png;base64,${metadata.ImageUri}`}
                                                    alt={metadata.name}
                                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                />
                                            ) : (
                                                <IonIcon icon={layers} style={{ fontSize: "32px", color: "var(--ion-color-medium)" }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                margin: "0 0 8px 0",
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                color: "var(--ion-color-dark)",
                                            }}>
                                                {metadata?.name || template.template}
                                            </h3>
                                            <p style={{ margin: "0", fontSize: "14px", color: "var(--ion-color-medium)" }}>
                                                {template.footers.length} footer(s)
                                            </p>
                                        </div>
                                        <IonIcon icon={chevronForward} style={{ fontSize: "20px", color: "var(--ion-color-medium)", opacity: 0.7 }} />
                                    </div>
                                );
                            })}

                            <div
                                onClick={() => setShowSharedTemplateModal(true)}
                                style={{
                                    border: "2px dashed var(--ion-color-light)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    backgroundColor: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "16px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = "var(--ion-color-primary)";
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = "var(--ion-color-light)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                                }}
                            >
                                <div style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "8px",
                                    backgroundColor: "var(--ion-color-light)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    border: "1px solid var(--ion-color-medium-tint)",
                                }}>
                                    <IonIcon icon={add} style={{ fontSize: "40px", color: "var(--ion-color-medium)" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: "var(--ion-color-dark)",
                                    }}>
                                        More Templates
                                    </h3>
                                    <p style={{ margin: "0", fontSize: "14px", color: "var(--ion-color-medium)" }}>
                                        View all available templates
                                    </p>
                                </div>
                                <IonIcon icon={chevronForward} style={{ fontSize: "20px", color: "var(--ion-color-medium)", opacity: 0.7 }} />
                            </div>
                        </div>
                    )}

                    {isSmallScreen && (
                        <div className="template-preview-scroll" style={{
                            display: "flex",
                            gap: "12px",
                            overflowX: "auto",
                            paddingBottom: "16px",
                            paddingRight: "4px",
                        }}>
                            {getAvailableTemplates().slice(0, 3).map((template) => {
                                const metadata = getTemplateMetadata(template.templateId);
                                return (
                                    <div
                                        key={template.templateId}
                                        onClick={() => handleTemplateSelect(template.templateId)}
                                        style={{
                                            minWidth: "110px",
                                            width: "110px",
                                            border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                                            borderRadius: "8px",
                                            padding: "12px",
                                            cursor: "pointer",
                                            backgroundColor: isDarkMode ? "var(--ion-color-step-50)" : "var(--ion-background-color)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "8px",
                                            transition: "all 0.2s ease",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "6px",
                                            overflow: "hidden",
                                            backgroundColor: isDarkMode ? "var(--ion-color-step-100)" : "var(--ion-color-step-50)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                                        }}>
                                            {metadata?.ImageUri ? (
                                                <img
                                                    src={`data:image/png;base64,${metadata.ImageUri}`}
                                                    alt={metadata.name}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <IonIcon icon={layers} style={{ fontSize: "22px", color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-500)" }} />
                                            )}
                                        </div>
                                        <div style={{ textAlign: "center", width: "100%" }}>
                                            <h4 style={{
                                                margin: "0",
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                color: isDarkMode ? "var(--ion-color-step-700)" : "var(--ion-color-step-600)",
                                                lineHeight: "1.2",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {metadata?.name || template.template}
                                            </h4>
                                        </div>
                                    </div>
                                );
                            })}
                            <div
                                onClick={() => setShowSharedTemplateModal(true)}
                                style={{
                                    minWidth: "110px",
                                    width: "110px",
                                    border: `2px dashed ${isDarkMode ? "var(--ion-color-step-300)" : "var(--ion-color-step-200)"}`,
                                    borderRadius: "8px",
                                    padding: "12px",
                                    cursor: "pointer",
                                    backgroundColor: "transparent",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    transition: "all 0.2s ease",
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isDarkMode ? "var(--ion-color-step-100)" : "var(--ion-color-step-50)",
                                }}>
                                    <IonIcon icon={add} style={{ fontSize: "28px", color: isDarkMode ? "var(--ion-color-step-500)" : "var(--ion-color-step-400)" }} />
                                </div>
                                <div style={{ textAlign: "center", width: "100%" }}>
                                    <h4 style={{
                                        margin: "0",
                                        fontSize: "11px",
                                        fontWeight: "600",
                                        color: isDarkMode ? "var(--ion-color-step-600)" : "var(--ion-color-step-500)",
                                        lineHeight: "1.2",
                                    }}>
                                        More
                                    </h4>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {recentInvoices.length > 0 && (
                    <div style={{ padding: "16px", marginTop: "8px" }}>
                        <h3 style={{
                            margin: "0 0 12px 0",
                            fontSize: "18px",
                            fontWeight: "600",
                            color: isDarkMode ? "var(--ion-color-step-750)" : "var(--ion-color-step-650)",
                        }}>
                            Recently Opened
                        </h3>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: isSmallScreen ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "12px",
                        }}>
                            {recentInvoices.map((invoice) => {
                                const templateData = getTemplateMetadata(invoice.templateId);
                                return (
                                    <div
                                        key={invoice.fileName}
                                        onClick={() => {
                                            updateSelectedFile(invoice.fileName);
                                            history.push(`/app/editor/${invoice.fileName}`);
                                        }}
                                        style={{
                                            border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                                            borderRadius: "8px",
                                            padding: "12px",
                                            cursor: "pointer",
                                            backgroundColor: isDarkMode ? "var(--ion-color-step-50)" : "var(--ion-background-color)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "6px",
                                            backgroundColor: isDarkMode ? "var(--ion-color-step-100)" : "var(--ion-color-step-50)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <IonIcon icon={layers} style={{ fontSize: "24px", color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-500)" }} />
                                        </div>
                                        <div style={{ flex: 1, overflow: "hidden" }}>
                                            <h4 style={{
                                                margin: "0 0 4px 0",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: isDarkMode ? "var(--ion-color-step-800)" : "var(--ion-color-step-700)",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}>
                                                {invoice.fileName}
                                            </h4>
                                            <p style={{
                                                margin: "0",
                                                fontSize: "12px",
                                                color: isDarkMode ? "var(--ion-color-step-500)" : "var(--ion-color-step-450)",
                                            }}>
                                                {templateData?.name || "Unknown Template"}
                                            </p>
                                        </div>
                                        <IonIcon icon={chevronForward} style={{ fontSize: "16px", color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-350)" }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {renderTemplateModal()}

                <TemplateModal
                    isOpen={showSharedTemplateModal}
                    onClose={() => setShowSharedTemplateModal(false)}
                    onFileCreated={(fileName, templateId) => {
                        setToastMessage(`File "${fileName}" created successfully!`);
                        setShowToast(true);
                    }}
                />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    color={toastMessage.includes("successfully") ? "success" : "warning"}
                    position="top"
                />

                <IonAlert
                    isOpen={showFileNamePrompt}
                    onDidDismiss={() => {
                        setShowFileNamePrompt(false);
                        setSelectedTemplateForFile(null);
                        setNewFileName("");
                    }}
                    header="Create New File"
                    message="Enter a name for your new file:"
                    inputs={[
                        {
                            name: "fileName",
                            type: "text",
                            placeholder: "File name",
                            value: newFileName,
                        },
                    ]}
                    buttons={[
                        {
                            text: "Cancel",
                            role: "cancel",
                            handler: () => {
                                setShowFileNamePrompt(false);
                                setSelectedTemplateForFile(null);
                                setNewFileName("");
                            },
                        },
                        {
                            text: "Create",
                            handler: async (data) => {
                                if (data.fileName && selectedTemplateForFile !== null) {
                                    await createNewFileWithTemplate(
                                        selectedTemplateForFile,
                                        data.fileName
                                    );
                                }
                            },
                        },
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default DashboardHome;
