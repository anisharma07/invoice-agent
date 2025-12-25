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
  IonPopover,
  IonList,
  IonItem,
  IonCheckbox,
  isPlatform,
} from "@ionic/react";
// import { DATA } from "../templates"; // REMOVED
import { TemplateData, AppMappingItem } from "../types/template";
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
  saveOutline,
  toggleOutline,
  saveSharp,
  sparklesOutline,
  add,
} from "ionicons/icons";
import "./Home.css";
import FileOptions from "../components/FileMenu/FileOptions";
import InvoiceEditingSidebar from "../components/InvoiceEditingAgent/InvoiceEditingSidebar";
import Menu from "../components/Menu/Menu";
import { useTheme } from "../contexts/ThemeContext";
import { useInvoice } from "../contexts/InvoiceContext";
import { useAuth } from "../contexts/AuthContext";
import { useHistory, useLocation, useParams } from "react-router-dom";

import { isQuotaExceededError, getQuotaExceededMessage } from "../utils/helper";
import { getAutoSaveEnabled } from "../utils/settings";
import { SheetChangeMonitor } from "../utils/sheetChangeMonitor";
import { backgroundClip } from "html2canvas/dist/types/css/property-descriptors/background-clip";
import { storageApi } from "../services/storage-api";

// Helper function to generate editable cells from appMapping
const generateEditableCells = (appMapping: any, sheetName: string = 'sheet1'): { allow: boolean; cells: { [key: string]: boolean }; constraints: {} } => {
  const cells: { [key: string]: boolean } = {};

  const processItem = (item: AppMappingItem, currentSheet: string) => {
    if (item.type === 'text' && item.editable && item.cell) {
      cells[`${currentSheet}!${item.cell}`] = true;
    }
    // Handle table rows
    if (item.type === 'table' && item.rows && item.col) {
      for (const [colKey, colItem] of Object.entries(item.col)) {
        if ((colItem as AppMappingItem).editable && (colItem as AppMappingItem).cell) {
          const cellRef = (colItem as AppMappingItem).cell!;
          const colLetter = cellRef.replace(/[0-9]/g, '');
          for (let row = item.rows.start; row <= item.rows.end; row++) {
            cells[`${currentSheet}!${colLetter}${row}`] = true;
          }
        }
      }
    }
  };

  // Process all sheets in appMapping
  for (const [sheet, mappings] of Object.entries(appMapping || {})) {
    for (const [header, item] of Object.entries(mappings as any || {})) {
      processItem(item as AppMappingItem, sheet);
    }
  }

  return { allow: true, cells, constraints: {} };
};

// Helper function to extract total from a specific cell
const extractTotalFromCell = (appMapping: any, sheetName: string = 'sheet1'): string | null => {
  const sheetMapping = appMapping?.[sheetName];
  if (!sheetMapping) return null;

  // Look for "Total" or "Grand Total" key
  const totalItem = sheetMapping['Total'] || sheetMapping['Grand Total'] || sheetMapping['total'];
  if (totalItem && totalItem.cell) {
    return totalItem.cell;
  }
  return null;
};

const InvoicePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const {
    selectedFile,
    billType,
    store,
    updateSelectedFile,
    updateBillType,
    activeTemplateData,
    activeTemplateId,
    updateActiveTemplateData,
    updateCurrentSheetId,
  } = useInvoice();
  const { user } = useAuth();
  const userId = user?.sub || 'default_user';
  const history = useHistory();

  const [fileNotFound, setFileNotFound] = useState(false);
  const [templateNotFound, setTemplateNotFound] = useState(false);

  const { fileName } = useParams<{ fileName: string }>();

  const location = useLocation();

  // Parse URL query parameters
  const searchParams = new URLSearchParams(location.search);
  // New pattern: ?template=<id> for creating fresh invoice from template
  const templateFromUrl = searchParams.get('template');
  // Legacy pattern: ?templateId=<id>&mode=new (keep for backwards compatibility)
  const templateIdFromUrl = templateFromUrl || searchParams.get('templateId');
  const modeFromUrl = searchParams.get('mode');
  // New invoice mode: either using new ?template= pattern, or legacy ?templateId=&mode=new
  const isNewInvoiceMode = (templateFromUrl !== null) || (modeFromUrl === 'new' && templateIdFromUrl !== null);

  // State for tracking if invoice has been saved
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");

  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState("");
  const [saveAsOperation, setSaveAsOperation] = useState<"local" | null>(null);

  // Autosave state (kept for sidebar compatibility)
  const [autosaveCount, setAutosaveCount] = useState(0);

  // Save Invoice Dialog state
  const [showSaveInvoiceDialog, setShowSaveInvoiceDialog] = useState(false);
  const [saveInvoiceName, setSaveInvoiceName] = useState("");

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



  // AI Invoice Editing Agent state
  const [showEditingAgent, setShowEditingAgent] = useState(false);

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

  const handleColorChange = (colorName: string) => {
    try {
      // Get the actual color value (hex) for the color name
      const selectedColor = availableColors.find((c) => c.name === colorName);
      const colorValue = selectedColor ? selectedColor.color : colorName;

      if (colorMode === "background") {
        AppGeneral.changeSheetBackgroundColor(colorName);
        setActiveBackgroundColor(colorValue);
      } else {
        AppGeneral.changeSheetFontColor(colorName);
        setActiveFontColor(colorValue);

        // Additional CSS override for dark mode font color
        setTimeout(() => {
          const spreadsheetContainer = document.getElementById("tableeditor");
          if (spreadsheetContainer && isDarkMode) {
            // Force font color in dark mode by adding CSS override
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
                color: ${colorValue} !important;
              }
              .dark-theme #tableeditor td,
              .dark-theme #tableeditor .defaultCell,
              .dark-theme #tableeditor .cell {
                color: ${colorValue} !important;
              }
            `;
            document.head.appendChild(style);
          }
        }, 100);
      }
    } catch (error) {
      setToastMessage("Failed to change sheet color");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleCustomColorApply = () => {
    const hexColor = customColorInput.trim();
    if (hexColor && /^#?[0-9A-Fa-f]{6}$/.test(hexColor)) {
      const formattedColor = hexColor.startsWith("#")
        ? hexColor
        : `#${hexColor}`;
      handleColorChange(formattedColor);
      setCustomColorInput("");
    } else {
      setToastMessage(
        "Please enter a valid hex color (e.g., #FF0000 or FF0000)"
      );
      setToastColor("warning");
      setShowToast(true);
    }
  };

  const executeSaveAsWithFilename = async (newFilename: string) => {
    updateSelectedFile(newFilename);

    if (saveAsOperation === "local") {
      await performLocalSave(newFilename);

      // If we're saving a new invoice (from placeholder), navigate to the new URL
      if (fileName === "invoice") {
        history.replace(`/app/editor/${newFilename}`);
      }
    }
    setSaveAsFileName("");
    setSaveAsOperation(null);
  };

  const performLocalSave = async (fileName: string) => {
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

      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const now = new Date().toISOString();

      // Get template ID from active template ID or fallback
      const templateId = activeTemplateId || billType;

      const file = new File(
        now,
        now,
        content,
        fileName,
        billType,
        templateId,
        false
      );
      await store._saveFile(file);

      setToastMessage(`File "${fileName}" saved locally!`);
      setToastColor("success");
      setShowToast(true);
    } catch (error) {
      // Check if the error is due to storage quota exceeded
      if (isQuotaExceededError(error)) {
        setToastMessage(getQuotaExceededMessage("saving files"));
      } else {
        setToastMessage("Failed to save file locally.");
      }
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleSave = async (invoiceName?: string) => {
    // If no file is selected, can't save
    if (!fileName) {
      return;
    }

    // Don't try to save if template is not found
    if (templateNotFound || fileNotFound) {
      return;
    }

    // If this is a new invoice (placeholder name), skip auto-save
    // User must explicitly use "Save As" from the menu to save
    if (fileName === "invoice") {
      return;
    }

    try {
      // Check if SocialCalc is ready
      const socialCalc = (window as any).SocialCalc;
      if (!socialCalc || !socialCalc.GetCurrentWorkBookControl) {
        console.log("⚠️ handleSave: SocialCalc not ready, skipping save");
        return;
      }

      const control = socialCalc.GetCurrentWorkBookControl();

      // Strict check for control readiness
      if (!control || !control.workbook || !control.workbook.spreadsheet || !control.workbook.spreadsheet.sheet) {
        console.log("⚠️ handleSave: Control/Workbook/Spreadsheet not ready, skipping save");
        return;
      }

      console.log("📄 handleSave: Getting spreadsheet content");
      // Safe content retrieval
      let content = "";
      try {
        content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      } catch (e) {
        console.error("❌ handleSave: Failed to get spreadsheet content", e);
        return;
      }

      if (!activeTemplateData) {
        console.log("⚠️ handleSave: No active template data, skipping save");
        return;
      }

      // Extract total value from the mapped cell
      let totalValue: number | null = null;
      try {
        const totalCellRef = extractTotalFromCell(activeTemplateData.appMapping, 'sheet1');
        if (totalCellRef) {
          const sheet = control.workbook.spreadsheet.sheet;
          if (sheet && sheet.cells && sheet.cells[totalCellRef]) {
            const cell = sheet.cells[totalCellRef];
            if (cell.datavalue !== undefined) {
              const parsed = parseFloat(cell.datavalue);
              if (!isNaN(parsed)) {
                totalValue = parsed;
              }
            }
          }
        }
      } catch (e) {
        console.log("⚠️ handleSave: Could not extract total value (non-critical)", e);
      }

      // Use existing invoice ID or it will be generated on backend
      const invoiceIdToUse = currentInvoiceId || undefined;

      // Get active footer info
      const activeFooter = activeTemplateData.footers?.find((f: any) => f.index === billType) || null;

      console.log("💾 handleSave: Saving to S3 via API...", {
        fileName,
        templateId: activeTemplateId,
        billType,
        invoiceId: invoiceIdToUse,
        total: totalValue,
        hasAppMapping: !!activeTemplateData.appMapping,
        hasFooter: !!activeFooter
      });

      // Save to S3 with complete invoice data (MSC + appMapping + footer)
      await storageApi.saveInvoice(
        fileName,
        content,
        activeTemplateId || billType,
        billType,
        userId,
        invoiceIdToUse,
        totalValue,
        invoiceName || fileName, // invoice display name
        'draft', // status
        undefined, // invoice number (optional)
        activeTemplateData.appMapping, // appMapping
        activeFooter // footer
      );

      // Mark invoice as saved
      setIsInvoiceSaved(true);

      // Also save to local for backup/consistency
      const file = new File(
        new Date().toISOString(),
        new Date().toISOString(),
        content,
        fileName,
        billType,
        activeTemplateId || billType,
        false
      );
      await store._saveFile(file);

      console.log("✅ handleSave: Save completed successfully");
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
    console.log("💾 handleSaveClick: Starting manual save");

    if (!fileName) {
      setToastMessage("No file selected to save.");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

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
    console.log("🚀 initializeApp: Starting initialization", { fileName, isNewInvoiceMode, templateIdFromUrl });

    try {
      // Prioritize URL parameter over context to ensure fresh state
      let fileToLoad = fileName;
      console.log("📁 initializeApp: File to load", { fileToLoad });

      // If no file is specified, redirect to files page
      // But allow 'invoice' as a placeholder for new invoices from template
      if (!fileToLoad || fileToLoad === "") {
        console.log(
          "⚠️ initializeApp: No file specified, redirecting to files"
        );
        history.push("/app/files");
        return;
      }

      // If fileName is 'invoice' (placeholder) but no template specified, redirect
      if (fileToLoad === "invoice" && !isNewInvoiceMode) {
        console.log("⚠️ initializeApp: 'invoice' placeholder without template, redirecting to templates");
        history.push("/app/dashboard/templates");
        return;
      }

      let contentToLoad: string = "";
      let templateData: any = null;
      let templateId: string | number = "";
      let footerIndex = 1;

      // ========== MODE 1: NEW INVOICE FROM TEMPLATE ==========
      if (isNewInvoiceMode && templateIdFromUrl) {
        console.log("📝 initializeApp: NEW INVOICE MODE - Loading template", { templateIdFromUrl });
        setIsInvoiceSaved(false);

        // Fetch template data from API - try user templates first, then global
        try {
          // HELPER: Function to try fetching with variances
          const tryFetchTemplate = async (baseId: string): Promise<any> => {
            // 1. Try exact match (User)
            let t = await storageApi.fetchTemplate(baseId, false, userId);
            if (t) return t;

            // 2. Try with .json (User)
            if (!baseId.endsWith('.json')) {
              t = await storageApi.fetchTemplate(baseId + '.json', false, userId);
              if (t) return t;
            }

            // 3. Try Global
            t = await storageApi.fetchTemplate(baseId, true, userId);
            if (t) return t;

            // 4. Try Global with .json
            if (!baseId.endsWith('.json')) {
              t = await storageApi.fetchTemplate(baseId + '.json', true, userId);
              if (t) return t;
            }
            return null;
          };

          // Try original ID
          let apiTemplate = await tryFetchTemplate(templateIdFromUrl);

          // FALLBACK: Common typos correction
          if (!apiTemplate) {
            // Work-Order1 -> Work-Order
            if (templateIdFromUrl === "Work-Order1") {
              console.log("⚠️ initializeApp: Applying correction 'Work-Order1' -> 'Work-Order'");
              apiTemplate = await tryFetchTemplate("Work-Order");
              if (apiTemplate) templateId = "Work-Order";
            }
          }

          if (apiTemplate) {
            console.log("✅ initializeApp: Template loaded from API");
            templateData = apiTemplate;
            if (!templateId) templateId = templateIdFromUrl;
          }
        } catch (e) {
          console.log("❌ initializeApp: Failed to fetch template from API", e);
        }

        if (!templateData) {
          console.log("❌ initializeApp: Template not found", { templateIdFromUrl });
          setTemplateNotFound(true);
          setFileNotFound(false);
          return;
        }

        // Generate EditableCells from appMapping
        const editableCells = generateEditableCells(templateData.appMapping, 'sheet1');
        console.log("🔧 initializeApp: Generated EditableCells", { cellCount: Object.keys(editableCells.cells).length });

        // Update the MSC with EditableCells
        const mscWithEditableCells = {
          ...templateData.msc,
          EditableCells: editableCells
        };

        // Convert to string format for SocialCalc
        contentToLoad = JSON.stringify(mscWithEditableCells);

        // Get active footer
        const activeFooter = templateData.footers?.find((f: any) => f.isActive);
        footerIndex = activeFooter?.index || 1;

      }
      // ========== MODE 2: EXISTING INVOICE ==========
      else {
        console.log("📂 initializeApp: EXISTING INVOICE MODE - Loading saved invoice");
        setIsInvoiceSaved(true);

        // Check if the file exists in storage (Prioritize Cloud)
        console.log("🔍 initializeApp: Checking cloud storage first");
        let fileData: any = null;

        try {
          const cloudInvoice = await storageApi.fetchInvoice(fileToLoad, userId);
          if (cloudInvoice) {
            console.log("✅ initializeApp: Found in cloud storage", {
              hasContent: !!cloudInvoice.content,
              templateId: cloudInvoice.template_id,
              invoiceId: cloudInvoice.invoice_id
            });

            // Content might be a string or object
            let content = cloudInvoice.content;
            if (typeof content === 'string') {
              // Check if it's URL-encoded
              try {
                content = decodeURIComponent(content);
              } catch (e) {
                // Not encoded, use as-is
              }
            }

            fileData = {
              ...cloudInvoice,
              content: content,
              templateId: cloudInvoice.template_id,
              billType: parseInt(cloudInvoice.bill_type || '1', 10),
            };

            // Store invoice ID if present
            if (cloudInvoice.invoice_id) {
              setCurrentInvoiceId(cloudInvoice.invoice_id);
            }
          }
        } catch (err) {
          console.log("⚠️ initializeApp: Cloud fetch failed or not found, falling back to local", err);
        }

        if (!fileData) {
          console.log("🔍 initializeApp: Checking local storage");
          const fileExists = await store._checkKey(fileToLoad);
          if (fileExists) {
            fileData = await store._getFile(fileToLoad);
          }
        }

        if (!fileData) {
          console.log("❌ initializeApp: File not found in storage");
          setFileNotFound(true);
          return;
        }

        // Load the file content
        console.log("📖 initializeApp: Loading file data");
        let decodedContent = fileData.content;

        // Check if this is the new invoice format with {msc, appMapping, footer}
        let storedAppMapping: any = null;
        let storedFooter: any = null;

        if (typeof decodedContent === 'object' && decodedContent.msc !== undefined) {
          // New format: extract components
          console.log("📦 initializeApp: Detected new invoice format with embedded appMapping/footer");
          storedAppMapping = decodedContent.appMapping;
          storedFooter = decodedContent.footer;
          decodedContent = decodedContent.msc;

          // If msc is still an object, stringify it
          if (typeof decodedContent === 'object') {
            decodedContent = JSON.stringify(decodedContent);
          }
        } else if (typeof decodedContent === 'object') {
          // Stringify objects that don't match new format
          decodedContent = JSON.stringify(decodedContent);
        }

        contentToLoad = decodedContent;
        templateId = fileData.templateId;
        footerIndex = fileData.billType || 1;

        console.log("📄 initializeApp: File data loaded", {
          contentLength: contentToLoad.length,
          templateId: templateId,
          billType: footerIndex,
          hasStoredAppMapping: !!storedAppMapping,
          hasStoredFooter: !!storedFooter,
        });

        // If we have stored appMapping/footer from the invoice, use those
        // Otherwise, fetch template data for appMapping and footers
        if (storedAppMapping) {
          console.log("📋 initializeApp: Using stored appMapping from invoice");

          // Decode the MSC content if it's URL-encoded
          try {
            contentToLoad = decodeURIComponent(contentToLoad);
          } catch (e) {
            // Not encoded or already decoded
          }

          // Build a template data object from stored data
          // Need to create a minimal msc structure to avoid null reference in updateActiveTemplateData
          templateData = {
            appMapping: storedAppMapping,
            footers: storedFooter ? [storedFooter] : [],
            msc: { currentid: 'sheet1' } // Minimal msc to prevent null reference error
          };

          // Still try to fetch template for any missing footer data
          try {
            let apiTemplate = await storageApi.fetchTemplate(String(templateId), false, userId);
            if (!apiTemplate && !String(templateId).endsWith('.json')) {
              apiTemplate = await storageApi.fetchTemplate(String(templateId) + '.json', false, userId);
            }
            if (!apiTemplate) {
              apiTemplate = await storageApi.fetchTemplate(String(templateId), true, userId);
              if (!apiTemplate && !String(templateId).endsWith('.json')) {
                apiTemplate = await storageApi.fetchTemplate(String(templateId) + '.json', true, userId);
              }
            }

            // Use template footers if we don't have stored footer
            if (apiTemplate && (!storedFooter || templateData.footers?.length === 0)) {
              templateData.footers = apiTemplate.footers;
            }
          } catch (e) {
            console.log("⚠️ initializeApp: Could not fetch template for footers (non-critical)", e);
          }
        } else {
          // Old format: fetch template data for appMapping and footers
          console.log("🔍 initializeApp: Fetching template data from API");

          try {
            // Try user templates first
            let apiTemplate = await storageApi.fetchTemplate(String(templateId), false, userId);
            if (!apiTemplate && !String(templateId).endsWith('.json')) {
              apiTemplate = await storageApi.fetchTemplate(String(templateId) + '.json', false, userId);
            }

            // If not found in user templates, try global templates
            if (!apiTemplate) {
              console.log("🔍 initializeApp: Not found in user templates, trying global...");
              apiTemplate = await storageApi.fetchTemplate(String(templateId), true, userId);
              if (!apiTemplate && !String(templateId).endsWith('.json')) {
                apiTemplate = await storageApi.fetchTemplate(String(templateId) + '.json', true, userId);
              }
            }

            if (apiTemplate) {
              console.log("✅ initializeApp: Template loaded from API");
              templateData = apiTemplate;
            }
          } catch (e) {
            console.log("❌ initializeApp: Failed to fetch template from API", e);
          }

          if (!templateData) {
            console.log("❌ initializeApp: Template not found in API", { templateId });
            setTemplateNotFound(true);
            setFileNotFound(false);
            return;
          }
        }
      }

      // Load template data into context
      console.log("✅ initializeApp: Template found, loading template data");
      console.log("📊 initializeApp: Template data", {
        templateId: templateId,
        footersCount: templateData.footers?.length,
      });
      updateActiveTemplateData(templateData, templateId);

      // Initialize SocialCalc with the content
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
              "✅ initializeApp: SocialCalc already initialized, using viewFile"
            );
            AppGeneral.viewFile(fileToLoad, contentToLoad);
          } else {
            // SocialCalc not initialized, initialize it first
            console.log(
              "🔧 initializeApp: SocialCalc not initialized, initializing app"
            );
            AppGeneral.initializeApp(contentToLoad);
          }
        } catch (error) {
          console.error(
            "❌ initializeApp: Error in SocialCalc initialization",
            error
          );
          // Fallback: try to initialize the app
          try {
            console.log("🔄 initializeApp: Attempting fallback initialization");
            AppGeneral.initializeApp(contentToLoad);
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
          console.log("🦶 initializeApp: Activating footer", {
            billType: footerIndex,
          });
          activateFooter(footerIndex);
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
  }, [fileName, location.search]); // Depend on fileName and query params for template mode

  // Initialize sheet change monitor
  useEffect(() => {
    if (fileName && activeTemplateData) {
      // Wait a bit for SocialCalc to be fully initialized
      const timer = setTimeout(() => {
        SheetChangeMonitor.initialize(updateCurrentSheetId);
      }, 1000);

      return () => {
        clearTimeout(timer);
        SheetChangeMonitor.cleanup();
      };
    }
  }, [fileName, activeTemplateData, updateCurrentSheetId]);

  useEffect(() => {
    if (fileName) {
      updateSelectedFile(fileName);
    }
  }, [fileName]);



  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    setTimeout(() => {
      handleSave();
    }, 1500);
  }, [autosaveCount]);

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
              onClick={() => {
                // Use window.location for proper page refresh
                window.location.href = "/app/dashboard/invoices";
              }}
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
              <span>{fileName === "invoice" ? "New Invoice" : selectedFile}</span>
            </div>
          </IonButtons>

          <IonButtons
            slot="end"
            className={isPlatform("desktop") && "ion-padding-end"}
          >
            <IonIcon
              icon={saveSharp}
              size="large"
              onClick={() => {
                // If it's a new invoice, prompt for name
                if (fileName === "invoice" || !isInvoiceSaved) {
                  setSaveInvoiceName("");
                  setShowSaveInvoiceDialog(true);
                } else {
                  // Existing invoice, save directly
                  handleSaveClick();
                }
              }}
              style={{ cursor: "pointer", marginRight: "12px" }}
              title="Save"
            />
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
              File Not Found
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
              {selectedFile
                ? `The file "${selectedFile}" doesn't exist in your storage.`
                : "The requested file couldn't be found."}
            </p>
            <IonButton
              fill="solid"
              size="default"
              onClick={() => history.push("/app/files")}
              style={{ minWidth: "200px" }}
            >
              <IonIcon icon={folder} slot="start" />
              Go to File Explorer
            </IonButton>
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
              Template Not Available
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
              The template you are trying to load is not available in your account.
              Please create a new template or select a different one.
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
                onClick={() => history.push("/app/dashboard/templates")}
                style={{ minWidth: "160px" }}
              >
                <IonIcon icon={folder} slot="start" />
                Select Template
              </IonButton>
              <IonButton
                fill="outline"
                size="default"
                onClick={() => history.push("/app/dashboard/templates")}
                style={{ minWidth: "160px" }}
              >
                <IonIcon icon={add} slot="start" />
                Create New
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

        {/* Toast for save notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />

        {/* Save As Dialog */}
        <IonAlert
          isOpen={showSaveAsDialog}
          onDidDismiss={() => {
            setShowSaveAsDialog(false);
            setSaveAsFileName("");
            setSaveAsOperation(null);
          }}
          header="Save As - Local Storage"
          message="Enter a filename for your invoice:"
          inputs={[
            {
              name: "filename",
              type: "text",
              placeholder: "Enter filename...",
              value: saveAsFileName,
              attributes: {
                maxlength: 50,
              },
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setSaveAsFileName("");
                setSaveAsOperation(null);
              },
            },
            {
              text: "Save",
              handler: (data) => {
                if (data.filename && data.filename.trim()) {
                  setSaveAsFileName(data.filename.trim());
                  // Close dialog and execute save
                  setShowSaveAsDialog(false);
                  // Use setTimeout to ensure state updates
                  setTimeout(async () => {
                    await executeSaveAsWithFilename(data.filename.trim());
                  }, 100);
                } else {
                  setToastMessage("Please enter a valid filename");
                  setToastColor("warning");
                  setShowToast(true);
                  return false; // Prevent dialog from closing
                }
              },
            },
          ]}
        />

        {/* File Options Popover */}
        <FileOptions
          showActionsPopover={showActionsPopover}
          setShowActionsPopover={setShowActionsPopover}
          showColorModal={showColorModal}
          setShowColorPicker={setShowColorModal}
          fileName={fileName}
        />

        {/* Color Picker Modal */}
        <IonModal
          className="color-picker-modal"
          isOpen={showColorModal}
          onDidDismiss={() => {
            setShowColorModal(false);
            setCustomColorInput("");
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Change Sheet Color</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  className="close-button"
                  onClick={() => setShowColorModal(false)}
                  fill="clear"
                >
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {/* Tab Segments */}
            <IonSegment
              value={colorMode}
              onIonChange={(e) =>
                setColorMode(e.detail.value as "background" | "font")
              }
            >
              <IonSegmentButton value="background">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: activeBackgroundColor,
                      borderRadius: "50%",
                      border: "2px solid #ccc",
                    }}
                  />
                  <IonLabel>Background Color</IonLabel>
                </div>
              </IonSegmentButton>
              <IonSegmentButton value="font">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: activeFontColor,
                      borderRadius: "50%",
                      border: "2px solid #ccc",
                    }}
                  />
                  <IonLabel>Font Color</IonLabel>
                </div>
              </IonSegmentButton>
            </IonSegment>

            <IonItemDivider>
              <IonLabel>
                {colorMode === "background"
                  ? "Background Colors"
                  : "Font Colors"}
              </IonLabel>
            </IonItemDivider>

            <IonGrid>
              <IonRow>
                {availableColors.map((color) => (
                  <IonCol size="3" size-md="2" key={color.name}>
                    <div
                      className="color-swatch"
                      onClick={() => handleColorChange(color.name)}
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: color.color,
                        borderRadius: "12px",
                        margin: "8px auto",
                        border:
                          (colorMode === "background" &&
                            activeBackgroundColor === color.color) ||
                            (colorMode === "font" &&
                              activeFontColor === color.color)
                            ? "3px solid #3880ff"
                            : "2px solid #ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "12px",
                        margin: "4px 0",
                        fontWeight: "500",
                      }}
                    >
                      {color.label}
                    </p>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            <IonItemDivider>
              <IonLabel>Custom Hex Color</IonLabel>
            </IonItemDivider>

            <div style={{ padding: "16px" }}>
              <IonInput
                fill="outline"
                value={customColorInput}
                placeholder="Enter hex color (e.g., #FF0000)"
                onIonInput={(e) => setCustomColorInput(e.detail.value!)}
                maxlength={7}
                style={{ marginBottom: "16px" }}
              />
              <IonButton
                expand="block"
                onClick={handleCustomColorApply}
                disabled={!customColorInput.trim()}
              >
                Apply Custom Color
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Single Floating Action Button - Opens Edit Sidebar */}
        {!showEditingAgent && (
          <IonFab
            vertical="bottom"
            horizontal="end"
            slot="fixed"
            style={{ zIndex: 10000 }}
          >
            <IonFabButton
              color="primary"
              onClick={() => setShowEditingAgent(true)}
            >
              <IonIcon icon={createOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Save Invoice Dialog */}
        <IonAlert
          isOpen={showSaveInvoiceDialog}
          onDidDismiss={() => {
            setShowSaveInvoiceDialog(false);
            setSaveInvoiceName("");
          }}
          header="Save Invoice"
          message="Enter a name for your invoice:"
          inputs={[
            {
              name: "invoiceName",
              type: "text",
              placeholder: "Invoice name...",
              value: saveInvoiceName,
              attributes: {
                maxlength: 50,
              },
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setSaveInvoiceName("");
              },
            },
            {
              text: "Save",
              handler: async (data) => {
                if (data.invoiceName && data.invoiceName.trim()) {
                  const invoiceName = data.invoiceName.trim();
                  setSaveInvoiceName(invoiceName);
                  setShowSaveInvoiceDialog(false);

                  // If this is a new invoice (placeholder), update filename and navigate
                  if (fileName === "invoice") {
                    // Generate a filename from invoice name
                    const filename = invoiceName.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-');
                    updateSelectedFile(filename);

                    try {
                      // Get the spreadsheet content
                      const socialCalc = (window as any).SocialCalc;
                      if (socialCalc && socialCalc.GetCurrentWorkBookControl) {
                        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
                        const activeFooter = activeTemplateData?.footers?.find((f: any) => f.index === billType) || null;

                        // Save to S3
                        await storageApi.saveInvoice(
                          filename,
                          content,
                          activeTemplateId || billType,
                          billType,
                          userId,
                          undefined, // new invoice ID will be generated
                          null, // total
                          invoiceName,
                          'draft',
                          undefined,
                          activeTemplateData?.appMapping,
                          activeFooter
                        );

                        setIsInvoiceSaved(true);
                        setToastMessage(`Invoice "${invoiceName}" saved successfully!`);
                        setToastColor("success");
                        setShowToast(true);

                        // Navigate to the new invoice URL
                        history.replace(`/app/editor/${filename}`);
                      }
                    } catch (error) {
                      console.error("Failed to save invoice:", error);
                      setToastMessage("Failed to save invoice. Please try again.");
                      setToastColor("danger");
                      setShowToast(true);
                    }
                  } else {
                    // Existing invoice, just update with new name
                    await handleSave(invoiceName);
                    setToastMessage(`Invoice saved successfully!`);
                    setToastColor("success");
                    setShowToast(true);
                  }
                } else {
                  setToastMessage("Please enter a valid invoice name");
                  setToastColor("warning");
                  setShowToast(true);
                  return false; // Prevent dialog from closing
                }
              },
            },
          ]}
        />

        <Menu showM={showMenu} setM={() => setShowMenu(false)} />

        {/* Invoice Editing Sidebar with Manual & AI tabs */}
        <InvoiceEditingSidebar
          isVisible={showEditingAgent}
          onClose={() => setShowEditingAgent(false)}
          setAutosaveCount={setAutosaveCount}
        />
      </IonContent>
    </IonPage>
  );
};

export default InvoicePage;
