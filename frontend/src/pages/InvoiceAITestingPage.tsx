import {
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonToast,
    IonAlert,
    IonLabel,
    IonInput,
    IonItemDivider,
    IonModal,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonFabList,
    IonPopover,
    IonList,
    IonItem,
    IonCheckbox,
    isPlatform,
} from "@ionic/react";
import { DATA } from "../templates";
import * as AppGeneral from "../components/socialcalc/index.js";
import { useEffect, useState, useRef } from "react";
import { File } from "../components/Storage/LocalStorage";
import {
    checkmarkCircle,
    syncOutline,
    closeOutline,
    textOutline,
    ellipsisVertical,
    shareSharp,
    downloadOutline,
    createOutline,
    arrowBack,
    documentText,
    folder,
    saveSharp,
    sparklesOutline,
    refreshOutline,
} from "ionicons/icons";
import "./InvoiceAITestingPage.css";
import FileOptions from "../components/FileMenu/FileOptions";
import InvoiceEditingSidebar from "../components/InvoiceEditingAgent/InvoiceEditingSidebar";
import Menu from "../components/Menu/Menu";
import { useTheme } from "../contexts/ThemeContext";
import { useInvoice } from "../contexts/InvoiceContext";
import { useHistory, useLocation, useParams } from "react-router-dom";
import DynamicInvoiceForm from "../components/DynamicInvoiceForm";
import { isQuotaExceededError, getQuotaExceededMessage } from "../utils/helper";
import { getAutoSaveEnabled } from "../utils/settings";
import { SheetChangeMonitor } from "../utils/sheetChangeMonitor";
import { loadTestingData, clearTestingData } from "../utils/testingStorage";

const InvoiceAITestingPage: React.FC = () => {
    const { isDarkMode } = useTheme();
    const {
        selectedFile,
        billType,
        store,
        updateSelectedFile,
        updateBillType,
        activeTemplateData,
        updateActiveTemplateData,
        updateCurrentSheetId,
    } = useInvoice();
    const history = useHistory();

    const [fileNotFound, setFileNotFound] = useState(false);
    const [templateNotFound, setTemplateNotFound] = useState(false);

    const { fileName } = useParams<{ fileName: string }>();

    const [showMenu, setShowMenu] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastColor, setToastColor] = useState<
        "success" | "danger" | "warning"
    >("success");

    const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
    const [saveAsFileName, setSaveAsFileName] = useState("");
    const [saveAsOperation, setSaveAsOperation] = useState<"local" | null>(null);

    // Autosave state
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(
        getAutoSaveEnabled()
    );
    const [autosaveCount, setAutosaveCount] = useState(0);
    const [showSavePopover, setShowSavePopover] = useState(false);

    // Color picker state
    const [showColorModal, setShowColorModal] = useState(false);
    const [colorMode, setColorMode] = useState<"background" | "font">(
        "background"
    );
    const [customColorInput, setCustomColorInput] = useState("");
    const [activeBackgroundColor, setActiveBackgroundColor] = useState("#f4f5f8");
    const [activeFontColor, setActiveFontColor] = useState("#000000");

    // Actions popover state
    const [showActionsPopover, setShowActionsPopover] = useState(false);

    // Invoice form state
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    // AI Invoice Editing Agent state
    const [showEditingAgent, setShowEditingAgent] = useState(false);

    // Export and mapping editor state
    const [showMappingEditor, setShowMappingEditor] = useState(false);
    const [mappingEditorContent, setMappingEditorContent] = useState("");

    // Available colors for sheet themes
    const availableColors = [
        { name: "red", label: "Red", color: "#ff4444" },
        { name: "blue", label: "Blue", color: "#3880ff" },
        { name: "green", label: "Green", color: "#2dd36f" },
        { name: "yellow", label: "Yellow", color: "#ffc409" },
        { name: "purple", label: "Purple", color: "#6f58d8" },
        { name: "black", label: "Black", color: "#000000" },
        { name: "white", label: "White", color: "#ffffff" },
        { name: "default", label: "Default", color: "#f4f5f8" },
    ];


    const handleExportConfiguration = async () => {
        console.log("🔄 Export Configuration: Starting export process");
        try {
            // Get current spreadsheet content
            const socialCalc = (window as any).SocialCalc;
            console.log("🔍 Export Configuration: Checking SocialCalc", {
                hasSocialCalc: !!socialCalc,
                hasGetCurrentWorkBookControl: !!(socialCalc && socialCalc.GetCurrentWorkBookControl)
            });

            if (!socialCalc || !socialCalc.GetCurrentWorkBookControl) {
                console.log("❌ Export Configuration: SocialCalc not ready");
                setToastMessage("Spreadsheet not ready. Please wait and try again.");
                setToastColor("warning");
                setShowToast(true);
                return;
            }

            const control = socialCalc.GetCurrentWorkBookControl();
            console.log("📋 Export Configuration: Control status", {
                hasControl: !!control,
                hasWorkbook: !!(control && control.workbook),
                hasSpreadsheet: !!(control && control.workbook && control.workbook.spreadsheet)
            });

            if (!control || !control.workbook) {
                console.log("❌ Export Configuration: Control or workbook not ready");
                setToastMessage("Spreadsheet not ready. Please wait and try again.");
                setToastColor("warning");
                setShowToast(true);
                return;
            }

            // Get the testing data to retrieve cell mappings
            const testingData = loadTestingData();
            console.log("📦 Export Configuration: Testing data loaded", {
                hasTestingData: !!testingData,
                hasRawMsc: !!(testingData && testingData.rawMsc),
                hasCellMappings: !!(testingData && testingData.cellMappings),
                testingDataKeys: testingData ? Object.keys(testingData) : []
            });

            if (!testingData) {
                console.log("❌ Export Configuration: No testing data found");
                setToastMessage("No testing data found to export.");
                setToastColor("danger");
                setShowToast(true);
                return;
            }

            // Get current workbook data and serialize it properly
            const workbook = control.workbook;
            console.log("📊 Export Configuration: Building export data");

            // Serialize the workbook sheets properly to avoid circular references
            const serializedSheets = {};
            if (workbook.sheetArr) {
                Object.keys(workbook.sheetArr).forEach(sheetKey => {
                    const sheet = workbook.sheetArr[sheetKey];
                    if (sheet && sheet.sheetstr && sheet.sheetstr.savestr) {
                        // Store only the savestr, which is the serialized sheet data
                        serializedSheets[sheetKey] = {
                            sheetstr: {
                                savestr: sheet.sheetstr.savestr
                            }
                        };
                    }
                });
            }

            const exportData = {
                templateMeta: testingData.templateMeta || null,
                rawMsc: {
                    numsheets: workbook.numsheets || 1,
                    currentid: workbook.currentid || "sheet1",
                    currentname: workbook.currentname || "sheet1",
                    sheetArr: serializedSheets,
                    EditableCells: workbook.EditableCells || activeTemplateData?.msc?.EditableCells,
                },
                cellMappings: testingData.cellMappings,
                timestamp: new Date().toISOString(),
            };

            console.log("✅ Export Configuration: Export data prepared", {
                hasTemplateMeta: !!exportData.templateMeta,
                hasRawMsc: !!exportData.rawMsc,
                hasCellMappings: !!exportData.cellMappings,
                sheetArrKeys: exportData.rawMsc.sheetArr ? Object.keys(exportData.rawMsc.sheetArr) : []
            });

            // Create and download the JSON file
            const jsonString = JSON.stringify(exportData, null, 2);
            console.log("📝 Export Configuration: JSON created", {
                jsonLength: jsonString.length,
                jsonPreview: jsonString.substring(0, 200)
            });

            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `template-config-${Date.now()}.json`;
            document.body.appendChild(link);
            console.log("🔗 Export Configuration: Triggering download");
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log("✅ Export Configuration: Export completed successfully");
            setToastMessage("Configuration exported successfully!");
            setToastColor("success");
            setShowToast(true);
        } catch (error) {
            console.error("❌ Export Configuration: Error during export", error);
            setToastMessage(`Failed to export configuration: ${error.message || 'Unknown error'}`);
            setToastColor("danger");
            setShowToast(true);
        }
    };

    const handleOpenMappingEditor = () => {
        const testingData = loadTestingData();
        if (!testingData) {
            setToastMessage("No testing data found to edit.");
            setToastColor("danger");
            setShowToast(true);
            return;
        }

        const mappingData = {
            cellMappings: testingData.cellMappings,
        };

        setMappingEditorContent(JSON.stringify(mappingData, null, 2));
        setShowMappingEditor(true);
    };

    const handleSaveMappings = () => {
        try {
            const parsedData = JSON.parse(mappingEditorContent);

            // Validate the structure
            if (!parsedData.cellMappings) {
                setToastMessage("Invalid JSON structure. Must include 'cellMappings'.");
                setToastColor("danger");
                setShowToast(true);
                return;
            }

            // Update testing data with new mappings
            const testingData = loadTestingData();
            if (testingData) {
                testingData.cellMappings = parsedData.cellMappings;

                // Save back to testing storage
                localStorage.setItem('testingData', JSON.stringify(testingData));

                setShowMappingEditor(false);
                setToastMessage("Cell mappings updated successfully! Reload the page to apply changes.");
                setToastColor("success");
                setShowToast(true);
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            setToastMessage("Invalid JSON format. Please check your syntax.");
            setToastColor("danger");
            setShowToast(true);
        }
    };

    const handleSave = async () => {
        // For testing page, we don't need to save to storage
        // Just show a message that changes are being tested
        console.log("💾 handleSave: Testing page - changes are temporary");
        return;

        try {
            // Check if SocialCalc is ready
            const socialCalc = (window as any).SocialCalc;
            if (!socialCalc || !socialCalc.GetCurrentWorkBookControl) {
                console.log("⚠️ handleSave: SocialCalc not ready, skipping save");
                return;
            }

            const control = socialCalc.GetCurrentWorkBookControl();
            console.log("📋 handleSave: Control status", {
                hasControl: !!control,
                hasWorkbook: !!(control && control.workbook),
                hasSpreadsheet: !!(
                    control &&
                    control.workbook &&
                    control.workbook.spreadsheet
                ),
            });

            if (!control || !control.workbook || !control.workbook.spreadsheet) {
                console.log("⚠️ handleSave: Control not ready, skipping save");
                return;
            }

            console.log("📄 handleSave: Getting spreadsheet content");
            const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
            console.log("📊 handleSave: Content retrieved", {
                contentLength: content.length,
            });

            // Get existing metadata and update
            console.log("📂 handleSave: Getting existing file metadata");
            const data = await store._getFile(fileName);
            console.log("📋 handleSave: Existing file data", {
                hasData: !!data,
                created: (data as any)?.created,
                templateId: (data as any)?.templateId,
            });

            if (activeTemplateData) {
                console.log("💾 handleSave: Creating and saving file object");
                const file = new File(
                    (data as any)?.created || new Date().toISOString(),
                    new Date().toISOString(),
                    content,
                    fileName,
                    billType,
                    activeTemplateData.templateId,
                    false
                );
                await store._saveFile(file);
                console.log("✅ handleSave: Save completed successfully");
            } else {
                console.log("⚠️ handleSave: No active template data, skipping save");
            }
        } catch (error) {
            console.error("❌ handleSave: Error during save", error);

            // Check if the error is due to storage quota exceeded
            if (isQuotaExceededError(error)) {
                setToastMessage(getQuotaExceededMessage("auto-saving"));
                setToastColor("danger");
                setShowToast(true);
            } else {
                // For auto-save errors, show a less intrusive message
                setToastMessage("Auto-save failed. Please save manually.");
                setToastColor("warning");
                setShowToast(true);
            }
        }
    };

    const handleSaveClick = async () => {
        console.log("💾 handleSaveClick: Testing page - showing info message");

        setToastMessage("This is a testing lab. Changes are temporary and not saved to storage.");
        setToastColor("warning");
        setShowToast(true);
        return;

        try {
            // Check if SocialCalc is ready
            const socialCalc = (window as any).SocialCalc;
            if (!socialCalc || !socialCalc.GetCurrentWorkBookControl) {
                setToastMessage("Spreadsheet not ready. Please wait and try again.");
                setToastColor("warning");
                setShowToast(true);
                return;
            }

            const control = socialCalc.GetCurrentWorkBookControl();
            if (!control || !control.workbook || !control.workbook.spreadsheet) {
                setToastMessage("Spreadsheet not ready. Please wait and try again.");
                setToastColor("warning");
                setShowToast(true);
                return;
            }

            if (!activeTemplateData) {
                setToastMessage("No template data available for saving.");
                setToastColor("warning");
                setShowToast(true);
                return;
            }

            // Call the main save function
            await handleSave();

            // Show success toast for manual save
            setToastMessage("File saved successfully!");
            setToastColor("success");
            setShowToast(true);
            console.log("✅ handleSaveClick: Manual save completed successfully");
        } catch (error) {
            console.error("❌ handleSaveClick: Error during manual save", error);

            if (isQuotaExceededError(error)) {
                setToastMessage(getQuotaExceededMessage("saving files"));
            } else {
                setToastMessage("Failed to save file. Please try again.");
            }
            setToastColor("danger");
            setShowToast(true);
        }
    };

    const activateFooter = (footer) => {
        console.log("🦶 activateFooter: Starting footer activation", { footer });
        // Only activate footer if SocialCalc is properly initialized
        try {
            const tableeditor = document.getElementById("tableeditor");
            const socialCalc = (window as any).SocialCalc;
            console.log("🔍 activateFooter: Checking DOM and SocialCalc", {
                hasTableEditor: !!tableeditor,
                hasSocialCalc: !!socialCalc,
                hasGetCurrentWorkBookControl: !!(
                    socialCalc && socialCalc.GetCurrentWorkBookControl
                ),
            });

            // Check if SocialCalc and WorkBook control are properly initialized
            if (tableeditor && socialCalc && socialCalc.GetCurrentWorkBookControl) {
                const control = socialCalc.GetCurrentWorkBookControl();
                console.log("📋 activateFooter: Control status", {
                    hasControl: !!control,
                    hasWorkbook: !!(control && control.workbook),
                    hasSpreadsheet: !!(
                        control &&
                        control.workbook &&
                        control.workbook.spreadsheet
                    ),
                });
                if (control && control.workbook && control.workbook.spreadsheet) {
                    console.log(
                        "✅ activateFooter: All requirements met, activating footer"
                    );
                    AppGeneral.activateFooterButton(footer);
                } else {
                    console.log(
                        "⚠️ activateFooter: SocialCalc WorkBook not ready for footer activation, skipping"
                    );
                }
            } else {
                console.log(
                    "⚠️ activateFooter: SocialCalc not ready for footer activation, skipping"
                );
            }
        } catch (error) {
            console.error("❌ activateFooter: Error activating footer", error);
        }
    };

    const initializeApp = async () => {
        console.log("🚀 initializeApp: Starting initialization for testing page");

        try {
            const testingData = loadTestingData();

            if (!testingData) {
                console.log("❌ initializeApp: No testing data found");
                setFileNotFound(true);
                setToastMessage("No generated invoice found. Please create one in the Invoice Lab first.");
                setToastColor("warning");
                setShowToast(true);
                return;
            }

            // Extract the savestr from rawMsc
            const rawMsc = testingData.rawMsc;
            if (!rawMsc || !rawMsc.sheetArr || !rawMsc.sheetArr.sheet1) {
                console.log("❌ initializeApp: Invalid rawMsc structure");
                setFileNotFound(true);
                return;
            }

            const savestr = rawMsc.sheetArr.sheet1.sheetstr.savestr;
            console.log("📄 initializeApp: Savestr format check", {
                length: savestr?.length,
                startsWithVersion: savestr?.startsWith('version:'),
                preview: savestr?.substring(0, 100)
            });

            // Use EditableCells from rawMsc (already generated during invoice creation)
            const editableCells = rawMsc.EditableCells || {
                allow: true,
                cells: {},
                constraints: {},
            };

            console.log("✅ initializeApp: Using pre-generated EditableCells", {
                cellCount: Object.keys(editableCells.cells || {}).length,
                hasEditableCells: !!rawMsc.EditableCells,
                sampleCells: Object.keys(editableCells.cells || {}).slice(0, 5),
            });

            // Create template data structure compatible with the app (matching TemplateData interface)
            const templateData = {
                template: "Generated Template",
                templateId: Date.now(), // Use timestamp as unique ID
                category: testingData.templateMeta?.category || "simple_invoice",
                msc: {
                    numsheets: rawMsc.numsheets || 1,
                    currentid: rawMsc.currentid || "sheet1",
                    currentname: rawMsc.currentname || "sheet1",
                    sheetArr: rawMsc.sheetArr,
                    EditableCells: editableCells,
                },
                footers: [
                    {
                        index: 1,
                        name: testingData.templateMeta?.name || "Default",
                        isActive: true
                    }
                ],
                cellMappings: testingData.cellMappings.text,
                logoCell: testingData.cellMappings.logo,
                signatureCell: testingData.cellMappings.signature
            };

            console.log("📊 initializeApp: Template data created", JSON.stringify(templateData.msc));

            updateActiveTemplateData(templateData as any);

            // Convert the workbook structure to JSON string for SocialCalc
            // WorkBookControlLoad expects a JSON string with the workbook structure
            // EditableCells must be at the root level of the workbook structure
            const workbookJson = JSON.stringify({
                numsheets: rawMsc.numsheets || 1,
                currentid: rawMsc.currentid || "sheet1",
                currentname: rawMsc.currentname || "sheet1",
                sheetArr: rawMsc.sheetArr,
                EditableCells: editableCells, // Add EditableCells at root level
            });

            console.log("📦 initializeApp: Workbook JSON prepared", {
                jsonLength: workbookJson.length,
                jsonPreview: workbookJson.substring(0, 200),
                hasEditableCells: !!editableCells,
                editableCellsCount: Object.keys(editableCells.cells || {}).length,
            });

            // Initialize SocialCalc with the generated content
            console.log("⚙️ initializeApp: Starting SocialCalc initialization");

            // Wait a bit to ensure DOM elements are ready
            setTimeout(() => {
                console.log("⏰ initializeApp: Timeout callback executing");
                try {
                    const currentControl = AppGeneral.getWorkbookInfo();
                    console.log("📋 initializeApp: Current control status", {
                        hasControl: !!currentControl,
                        hasWorkbook: !!(currentControl && currentControl.workbook),
                    });

                    if (currentControl && currentControl.workbook) {
                        // SocialCalc is initialized, use viewFile
                        console.log(
                            "✅ initializeApp: SocialCalc already initialized, initializing with generated content"
                        );
                        AppGeneral.viewFile("generated-template", workbookJson);
                    } else {
                        // SocialCalc not initialized, initialize it first
                        console.log(
                            "🔧 initializeApp: SocialCalc not initialized, initializing app"
                        );
                        AppGeneral.initializeApp(workbookJson);
                    }
                } catch (error) {
                    console.error(
                        "❌ initializeApp: Error in SocialCalc initialization",
                        error
                    );
                    // Fallback: try to initialize the app
                    try {
                        console.log("🔄 initializeApp: Attempting fallback initialization");
                        AppGeneral.initializeApp(workbookJson);
                    } catch (initError) {
                        console.error(
                            "💥 initializeApp: Fallback initialization failed",
                            initError
                        );
                        throw new Error(
                            "Failed to load file: SocialCalc initialization error"
                        );
                    }
                }

                // Activate footer after initialization
                setTimeout(() => {
                    const activeFooterIndex = templateData.footers?.find(f => f.isActive)?.index || 1;
                    console.log("🦶 initializeApp: Activating footer", {
                        footerIndex: activeFooterIndex,
                    });
                    activateFooter(activeFooterIndex);
                }, 500);
            }, 100);
            console.log("✅ initializeApp: Successfully completed initialization");
            setFileNotFound(false);
            setTemplateNotFound(false);
        } catch (error) {
            console.error(
                "💥 initializeApp: Caught error during initialization",
                error
            );
            // On error, show file not found
            setFileNotFound(true);
            setTemplateNotFound(false);
        }
    };

    useEffect(() => {
        initializeApp();
    }, []); // Only run once on mount to load testing data

    // Initialize sheet change monitor
    useEffect(() => {
        if (activeTemplateData) {
            // Wait a bit for SocialCalc to be fully initialized
            const timer = setTimeout(() => {
                SheetChangeMonitor.initialize(updateCurrentSheetId);
            }, 1000);

            return () => {
                clearTimeout(timer);
                SheetChangeMonitor.cleanup();
            };
        }
    }, [activeTemplateData, updateCurrentSheetId]);

    // Set default file name for testing
    useEffect(() => {
        updateSelectedFile("generated-template-testing");
    }, []);

    // Reset autosave to global setting when page loads
    useEffect(() => {
        setIsAutoSaveEnabled(getAutoSaveEnabled());
    }, []);

    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
        null
    );

    useEffect(() => {
        setTimeout(() => {
            handleSave();
        }, 1500);
    }, [autosaveCount]);
    useEffect(() => {
        const debouncedAutoSave = () => {
            // Only auto-save if enabled
            if (!isAutoSaveEnabled) {
                return;
            }

            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
            const newTimer = setTimeout(() => {
                handleSave();
                setAutoSaveTimer(null);
            }, 1000);

            setAutoSaveTimer(newTimer);
        };

        let removeListener = () => { };

        // Wait for SocialCalc to be ready before setting up the listener
        const setupListener = () => {
            try {
                const socialCalc = (window as any).SocialCalc;
                if (socialCalc && socialCalc.GetCurrentWorkBookControl) {
                    const control = socialCalc.GetCurrentWorkBookControl();
                    if (control && control.workbook && control.workbook.spreadsheet) {
                        removeListener = AppGeneral.setupCellChangeListener((_) => {
                            debouncedAutoSave();
                        });
                    } else {
                        // Retry after a delay if WorkBook is not ready
                        setTimeout(setupListener, 2000);
                    }
                } else {
                    // Retry after a delay if SocialCalc is not ready
                    setTimeout(setupListener, 2000);
                }
            } catch (error) {
                // Retry after a delay
                setTimeout(setupListener, 2000);
            }
        };

        // Start attempting to setup the listener
        setupListener();

        return () => {
            removeListener();
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
        };
    }, [fileName, billType, autoSaveTimer, isAutoSaveEnabled]);

    useEffect(() => {
        // Add a delay to ensure SocialCalc is initialized before activating footer

        const timer = setTimeout(() => {
            activateFooter(billType);
        }, 1000);

        return () => clearTimeout(timer);
    }, [billType]);

    useEffect(() => {
        // Find the active footer index, default to 1 if none found
        const activeFooter = activeTemplateData?.footers?.find(
            (footer) => footer.isActive
        );
        const activeFooterIndex = activeFooter ? activeFooter.index : 1;
        updateBillType(activeFooterIndex);
    }, [activeTemplateData]);
    // Effect to handle font color in dark mode
    useEffect(() => {
        if (isDarkMode && activeFontColor !== "#000000") {
            // Reapply font color when switching to dark mode
            setTimeout(() => {
                const style = document.createElement("style");
                style.id = "dark-mode-font-override";
                // Remove existing override if any
                const existingStyle = document.getElementById(
                    "dark-mode-font-override"
                );
                if (existingStyle) {
                    existingStyle.remove();
                }
                style.innerHTML = `
          .dark-theme #tableeditor * {
            color: ${activeFontColor} !important;
          }
          .dark-theme #tableeditor td,
          .dark-theme #tableeditor .defaultCell,
          .dark-theme #tableeditor .cell {
            color: ${activeFontColor} !important;
          }
        `;
                document.head.appendChild(style);
            }, 100);
        } else if (!isDarkMode) {
            // Remove dark mode font override when switching to light mode
            const existingStyle = document.getElementById("dark-mode-font-override");
            if (existingStyle) {
                existingStyle.remove();
            }
        }
    }, [isDarkMode, activeFontColor]);

    const footers = activeTemplateData ? activeTemplateData.footers : [];
    const footersList = footers.map((footerArray) => {
        const isActive = footerArray.index === billType;

        return (
            <IonButton
                key={footerArray.index}
                color="light"
                className="ion-no-margin"
                style={{
                    whiteSpace: "nowrap",
                    minWidth: "max-content",
                    marginRight: "8px",
                    flexShrink: 0,
                    border: isActive ? "2px solid #3880ff" : "2px solid transparent",
                    borderRadius: "4px",
                }}
                onClick={() => {
                    updateBillType(footerArray.index);
                    activateFooter(footerArray.index);
                }}
            >
                {footerArray.name}
            </IonButton>
        );
    });

    useEffect(() => {
        updateSelectedFile(fileName);
    }, [fileName]);

    return (
        <IonPage
            className={isDarkMode ? "dark-theme" : ""}
            style={{ height: "100vh", overflow: "hidden" }}
        >
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push("/app/invoice-ai")}
                            style={{ color: "white" }}
                        >
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                    <IonButtons
                        slot="start"
                        className="editing-title"
                        style={{ marginLeft: "8px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <span>Testing Lab - Generated Template</span>
                            {selectedFile && (
                                <div
                                    style={{
                                        position: "relative",
                                        display: "inline-block",
                                        transform: "scale(0.8)",
                                    }}
                                >
                                    {/* Main save icon */}
                                    <IonButton
                                        id="save-trigger"
                                        fill="clear"
                                        size="small"
                                        onClick={() => setShowSavePopover(true)}
                                        style={{
                                            minWidth: "auto",
                                            height: "32px",
                                            position: "relative",
                                        }}
                                        title="Save options"
                                    >
                                        <IonIcon
                                            icon={saveSharp}
                                            size="large"
                                            color={isDarkMode ? "dark" : "light"}
                                        />
                                    </IonButton>

                                    {/* Auto-save indicators (positioned absolutely when enabled) */}
                                    {isAutoSaveEnabled && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: "-16px",
                                                right: "4px",
                                                zIndex: 10,
                                                borderRadius: "50%",
                                            }}
                                        >
                                            <IonIcon
                                                icon={autoSaveTimer ? syncOutline : checkmarkCircle}
                                                size="small"
                                                color={"success"}
                                                style={{
                                                    animation: autoSaveTimer
                                                        ? "spin 1s linear infinite"
                                                        : "none",
                                                    borderRadius: "50%",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </IonButtons>

                    <IonButtons
                        slot="end"
                        className={isPlatform("desktop") && "ion-padding-end"}
                    >
                        {/* Export Configuration Button */}
                        <IonButton
                            fill="clear"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("🖱️ Export Config button clicked");
                                handleExportConfiguration();
                            }}
                            style={{ color: "white", marginRight: "8px" }}
                            title="Export Configuration"
                        >
                            <IonIcon icon={downloadOutline} slot="start" />
                            <span style={{ marginLeft: "4px" }}>Export Config</span>
                        </IonButton>

                        {/* Edit Mappings Button */}
                        <IonButton
                            fill="clear"
                            onClick={handleOpenMappingEditor}
                            style={{ color: "white", marginRight: "8px" }}
                            title="Edit Cell Mappings"
                        >
                            <IonIcon icon={createOutline} slot="start" />
                            <span style={{ marginLeft: "4px" }}>Edit Mappings</span>
                        </IonButton>

                        {/* Wallet Connection */}
                        <div style={{ marginRight: "12px" }}>
                            {/* <WalletConnection /> */}
                        </div>
                        <IonIcon
                            icon={shareSharp}
                            size="large"
                            onClick={(e) => {
                                setShowMenu(true);
                            }}
                            style={{ cursor: "pointer", marginRight: "12px" }}
                        />
                        <IonIcon
                            id="actions-trigger"
                            icon={ellipsisVertical}
                            size="large"
                            onClick={() => setShowActionsPopover(true)}
                            style={{ cursor: "pointer", marginRight: "12px" }}
                            title="More Actions"
                        />
                    </IonButtons>
                </IonToolbar>

                <IonToolbar color="secondary">
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            overflowX: "auto",
                            padding: "8px 16px",
                            width: "100%",
                            alignItems: "center",
                        }}
                    >
                        {footersList}
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent
                fullscreen
                scrollY={false}
                style={{
                    overflow: "hidden",
                    height: "calc(100vh - var(--ion-safe-area-top) - 112px)", // Subtract header heights
                }}
            >
                {fileNotFound ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            padding: "40px 20px",
                            textAlign: "center",
                        }}
                    >
                        <IonIcon
                            icon={documentText}
                            style={{
                                fontSize: "80px",
                                color: "var(--ion-color-medium)",
                                marginBottom: "20px",
                            }}
                        />
                        <h2
                            style={{
                                margin: "0 0 16px 0",
                                color: "var(--ion-color-dark)",
                                fontSize: "24px",
                                fontWeight: "600",
                            }}
                        >
                            No Generated Invoice Found
                        </h2>
                        <p
                            style={{
                                margin: "0 0 30px 0",
                                color: "var(--ion-color-medium)",
                                fontSize: "16px",
                                lineHeight: "1.5",
                                maxWidth: "400px",
                            }}
                        >
                            No generated invoice template was found in the testing data. Please generate one in the Invoice Lab first.
                        </p>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                            <IonButton
                                fill="solid"
                                size="default"
                                onClick={() => {
                                    console.log("🔄 Retrying to load testing data...");
                                    initializeApp();
                                }}
                                style={{ minWidth: "150px" }}
                            >
                                <IonIcon icon={refreshOutline} slot="start" />
                                Retry Load
                            </IonButton>
                            <IonButton
                                fill="outline"
                                size="default"
                                onClick={() => history.push("/app/invoice-ai")}
                                style={{ minWidth: "150px" }}
                            >
                                <IonIcon icon={sparklesOutline} slot="start" />
                                Go to Invoice Lab
                            </IonButton>
                        </div>
                    </div>
                ) : templateNotFound ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            padding: "40px 20px",
                            textAlign: "center",
                        }}
                    >
                        <IonIcon
                            icon={downloadOutline}
                            style={{
                                fontSize: "80px",
                                color: "var(--ion-color-medium)",
                                marginBottom: "20px",
                            }}
                        />
                        <h2
                            style={{
                                margin: "0 0 16px 0",
                                color: "var(--ion-color-dark)",
                                fontSize: "24px",
                                fontWeight: "600",
                            }}
                        >
                            Template Not Found
                        </h2>
                        <p
                            style={{
                                margin: "0 0 30px 0",
                                color: "var(--ion-color-medium)",
                                fontSize: "16px",
                                lineHeight: "1.5",
                                maxWidth: "400px",
                            }}
                        >
                            The file information is not downloaded. Please download the file
                            template to open this file.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap",
                                justifyContent: "center",
                            }}
                        >
                            <IonButton
                                fill="solid"
                                size="default"
                                onClick={() => history.push("/app/files")}
                                style={{ minWidth: "140px" }}
                            >
                                <IonIcon icon={folder} slot="start" />
                                Go to Files
                            </IonButton>
                            <IonButton
                                fill="outline"
                                size="default"
                                onClick={() => {
                                    // Add download template functionality here
                                    setToastMessage(
                                        "Template download functionality coming soon"
                                    );
                                    setToastColor("warning");
                                    setShowToast(true);
                                }}
                                style={{ minWidth: "140px" }}
                            >
                                <IonIcon icon={downloadOutline} slot="start" />
                                Download Template
                            </IonButton>
                        </div>
                    </div>
                ) : (
                    <div id="container">
                        <div id="workbookControl"></div>
                        <div id="tableeditor"></div>
                        <div id="msg"></div>
                    </div>
                )}

                {/* File Options Popover */}
                <FileOptions
                    showActionsPopover={showActionsPopover}
                    setShowActionsPopover={setShowActionsPopover}
                    showColorModal={showColorModal}
                    setShowColorPicker={setShowColorModal}
                    onSave={handleSave}
                    isAutoSaveEnabled={isAutoSaveEnabled}
                    fileName={fileName}
                />


                <DynamicInvoiceForm
                    isOpen={showInvoiceForm}
                    onClose={() => setShowInvoiceForm(false)}
                    setAutosaveCount={setAutosaveCount}
                />

                {/* Expandable Floating Action Button */}
                <IonFab
                    vertical="bottom"
                    horizontal="end"
                    slot="fixed"
                    style={{ zIndex: 10000 }}
                >
                    <IonFabButton color="primary">
                        <IonIcon icon={createOutline} />
                    </IonFabButton>
                    <IonFabList side="top" style={{ zIndex: 10001 }}>
                        <IonFabButton
                            color="tertiary"
                            onClick={() => setShowEditingAgent(true)}
                            title="AI Chat Assistant"
                        >
                            <IonIcon icon={sparklesOutline} />
                        </IonFabButton>
                        <IonFabButton
                            color="secondary"
                            onClick={() => setShowInvoiceForm(true)}
                            title="Manual Edit Invoice"
                        >
                            <IonIcon icon={createOutline} />
                        </IonFabButton>
                    </IonFabList>
                </IonFab>

                <Menu showM={showMenu} setM={() => setShowMenu(false)} />

                {/* AI Invoice Editing Sidebar */}
                <InvoiceEditingSidebar
                    isVisible={showEditingAgent}
                    onClose={() => setShowEditingAgent(false)}
                />

                {/* Mapping Editor Modal */}
                <IonModal
                    isOpen={showMappingEditor}
                    onDidDismiss={() => setShowMappingEditor(false)}
                    style={{ '--width': '90%', '--max-width': '800px', '--height': '80%' }}
                >
                    <IonHeader>
                        <IonToolbar color="primary">
                            <IonTitle>Edit Cell Mappings</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowMappingEditor(false)}>
                                    <IonIcon icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <div style={{ marginBottom: "16px" }}>
                            <p style={{ fontSize: "14px", color: "var(--ion-color-medium)" }}>
                                Edit the cell mappings JSON below. This includes text field mappings, logo cell, and signature cell configurations.
                            </p>
                        </div>
                        <textarea
                            value={mappingEditorContent}
                            onChange={(e) => setMappingEditorContent(e.target.value)}
                            style={{
                                width: "100%",
                                height: "calc(100% - 120px)",
                                fontFamily: "monospace",
                                fontSize: "13px",
                                padding: "12px",
                                border: "1px solid var(--ion-color-medium)",
                                borderRadius: "4px",
                                resize: "none",
                                backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                                color: isDarkMode ? "#d4d4d4" : "#000000",
                            }}
                            spellCheck={false}
                        />
                        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <IonButton
                                fill="outline"
                                onClick={() => setShowMappingEditor(false)}
                            >
                                Cancel
                            </IonButton>
                            <IonButton
                                fill="solid"
                                onClick={handleSaveMappings}
                            >
                                <IonIcon icon={saveSharp} slot="start" />
                                Save Mappings
                            </IonButton>
                        </div>
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default InvoiceAITestingPage;
