# TemplateModal Integration Guide

## Overview

The new TemplateModal component has been designed with a tab-based interface and advanced filtering. Due to the size and complexity of the changes, this guide will help you integrate the new structure.

## Current Status

- ✅ Template metadata structure updated
- ✅ LocalStorage methods for tracking implemented  
- ✅ FilesPage updated with recent invoices section
- ⚠️ TemplateModal needs manual review and integration

## TemplateModal Architecture

### Tab Structure

```
┌─────────────────────────────────────────────────┐
│  Templates & Invoices               [Filter] [X] │
├─────────────────────────────────────────────────┤
│  [ ⏰ Recent ] [ 📁 Your Invoices ] [ 📋 Default] │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Content area shows different data per tab]    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Tab Content

1. **Recent Tab:**
   - Shows up to 10 most recently opened invoices
   - Click to open file directly
   - Shows: filename, template name, modified date, thumbnail

2. **Your Invoices Tab:**
   - Shows all user-created invoices
   - Sorted by modified date (newest first)
   - Click to open file directly
   - Same display as Recent tab

3. **Default Tab:**
   - Shows all available templates (local + online)
   - Filter button available in header
   - Click to create new file from template
   - Shows: template name, footer count, device badge, online badge

## State Management

### New State Variables

```typescript
// Tab management
const [activeTab, setActiveTab] = useState<"recent" | "yours" | "default">("recent");

// Filter management
const [showFilterPopover, setShowFilterPopover] = useState(false);
const [filterPopoverEvent, setFilterPopoverEvent] = useState<any>(null);
const [selectedDevices, setSelectedDevices] = useState<string[]>(["mobile", "tablet", "desktop"]);
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

// Data management
const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
const [userInvoices, setUserInvoices] = useState<any[]>([]);
const [onlineTemplates, setOnlineTemplates] = useState<TemplateMeta[]>([]);
```

## Key Functions

### Data Loading

```typescript
// Load data when modal opens
useEffect(() => {
  if (isOpen) {
    loadRecentInvoices();
    loadUserInvoices();
    loadOnlineTemplates();
  }
}, [isOpen]);

const loadRecentInvoices = async () => {
  const recent = await store._getRecentInvoices(10);
  setRecentInvoices(recent);
};

const loadUserInvoices = async () => {
  const invoices = await store._getUserInvoices();
  setUserInvoices(invoices);
};

const loadOnlineTemplates = async () => {
  const online = await store._getOnlineTemplates();
  setOnlineTemplates(online);
};
```

### Display Logic

```typescript
// Get templates/invoices based on active tab
const getDisplayTemplates = () => {
  if (activeTab === "recent") {
    return recentInvoices;
  } else if (activeTab === "yours") {
    return userInvoices;
  } else {
    // Default tab - show all templates with filters applied
    const allTemplates = [...tempMeta, ...onlineTemplates];
    return filterTemplates(allTemplates);
  }
};
```

### Filtering

```typescript
const filterTemplates = (templates: TemplateMeta[]) => {
  return templates.filter((template) => {
    const deviceMatch = selectedDevices.length === 0 || 
                       selectedDevices.includes(template.deviceType);
    const categoryMatch = selectedCategories.length === 0 || 
                         selectedCategories.includes(template.category);
    const domainMatch = selectedDomains.length === 0 || 
                       selectedDomains.includes(template.domain);

    return deviceMatch && categoryMatch && domainMatch;
  });
};
```

### Filter Popover Structure

```typescript
<IonPopover
  isOpen={showFilterPopover}
  event={filterPopoverEvent}
  onDidDismiss={() => setShowFilterPopover(false)}
>
  <IonContent>
    <div style={{ padding: "16px" }}>
      <h3>Filters</h3>

      {/* Device Type Section */}
      <IonText><h4>Device Type</h4></IonText>
      <IonList>
        {["mobile", "tablet", "desktop"].map((device) => (
          <IonItem key={device}>
            <IonCheckbox
              checked={selectedDevices.includes(device)}
              onIonChange={(e) => {
                // Toggle device selection
              }}
            />
            <IonLabel>{device}</IonLabel>
          </IonItem>
        ))}
      </IonList>

      {/* Category Section - dynamically populated */}
      {/* Domain Section - dynamically populated */}

      <IonButton expand="block" onClick={() => setShowFilterPopover(false)}>
        Apply Filters
      </IonButton>
    </div>
  </IonContent>
</IonPopover>
```

## Rendering Functions

### Default Template Card

```typescript
const renderDefaultTemplateItem = (template: TemplateMeta, keyPrefix?: string) => {
  const templateData = DATA[template.template_id];
  const footers = templateData?.footers || [];

  return (
    <div onClick={() => handleTemplateSelect(template.template_id)}>
      {/* Thumbnail */}
      <div>
        {template.ImageUri ? (
          <img src={`data:image/png;base64,${template.ImageUri}`} />
        ) : (
          <IonIcon icon={layers} />
        )}
      </div>

      {/* Template Info */}
      <div>
        <h3>{template.name}</h3>
        <p>{footers.length} footer(s)</p>
        
        {/* Badges */}
        <div>
          <span>{template.deviceType}</span>
          {template.online && <span>Online</span>}
        </div>
      </div>

      <IonIcon icon={chevronForward} />
    </div>
  );
};
```

### Invoice Card (Recent/Yours)

```typescript
const renderInvoiceItem = (invoice: any, keyPrefix?: string) => {
  const templateData = getTemplateMetadata(invoice.templateId);

  return (
    <div onClick={() => handleFileOpen(invoice.fileName)}>
      {/* Thumbnail */}
      <div>
        {templateData?.ImageUri ? (
          <img src={`data:image/png;base64,${templateData.ImageUri}`} />
        ) : (
          <IonIcon icon={layers} />
        )}
      </div>

      {/* Invoice Info */}
      <div>
        <h3>{invoice.fileName}</h3>
        <p>{templateData?.name || `Template ${invoice.templateId}`}</p>
        <p>Modified: {new Date(invoice.modified).toLocaleDateString()}</p>
      </div>

      <IonIcon icon={chevronForward} />
    </div>
  );
};
```

## Event Handlers

### Template Selection (Create New)

```typescript
const handleTemplateSelect = (templateId: number) => {
  setSelectedTemplateForFile(templateId);
  setShowFileNamePrompt(true);
};

// Then in file creation:
const createNewFileWithTemplate = async (templateId: number, fileName: string) => {
  // ... validation ...
  
  // Create file
  await store._saveFile(newFile);
  
  // Track as recent
  await store._addToRecentInvoices(fileName);
  
  // Navigate to editor
  history.push(`/app/editor/${fileName}`);
};
```

### File Opening (Existing Invoice)

```typescript
const handleFileOpen = (fileName: string) => {
  updateSelectedFile(fileName);
  onClose();
  
  // Track as recent
  store._addToRecentInvoices(fileName);
  
  setTimeout(() => {
    history.push(`/app/editor/${fileName}`);
  }, 200);
};
```

### Modal Close/Reset

```typescript
const handleModalClose = () => {
  // Reset all state
  setActiveTab("recent");
  setSelectedTemplateForFile(null);
  setNewFileName("");
  setShowFileNamePrompt(false);
  setSelectedDevices(["mobile", "tablet", "desktop"]);
  setSelectedCategories([]);
  setSelectedDomains([]);
  onClose();
};
```

## Integration Steps

### Step 1: Backup Current File
```bash
cp TemplateModal.tsx TemplateModal.old.tsx
```

### Step 2: Update Imports
Add new imports at the top:
```typescript
import {
  // ... existing imports ...
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
} from "@ionic/react";

import {
  // ... existing icons ...
  timeOutline,
  folderOpenOutline,
  gridOutline,
} from "ionicons/icons";
```

### Step 3: Replace State Variables
Replace old state with new state structure shown above.

### Step 4: Add Data Loading
Add `useEffect` and loading functions for recent/yours/online data.

### Step 5: Update Render Logic
Replace the old content rendering with:
- New tab segment
- Conditional filter button
- New content display logic
- Filter popover

### Step 6: Add New Event Handlers
Update handlers for:
- File opening (invoices)
- Template selection (templates)
- Filter management

### Step 7: Testing
Test each tab independently:
1. Recent tab with existing files
2. Your Invoices with all files
3. Default tab with filters

## Styling Notes

### Consistent Styling Across Cards

```typescript
// Card container style
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

// Hover effects
onMouseOver={(e) => {
  e.currentTarget.style.backgroundColor = isDarkMode ? 
    "var(--ion-color-step-100)" : "var(--ion-color-step-50)";
}}
```

### Badge Styles

```typescript
// Device badge
style={{
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "4px",
  backgroundColor: isDarkMode ? "var(--ion-color-step-150)" : "var(--ion-color-step-100)",
  textTransform: "uppercase",
}}

// Online badge
style={{
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "4px",
  backgroundColor: "var(--ion-color-primary)",
  color: "#fff",
  textTransform: "uppercase",
}}
```

## Troubleshooting

### Templates Not Showing
- Check `tempMeta` array has templates
- Verify filter settings (reset to default)
- Check console for errors in `getDisplayTemplates()`

### Recent Invoices Empty
- Open some files first to populate
- Check `_addToRecentInvoices()` is called
- Verify storage key `__recent_invoices__` exists

### Filters Not Working
- Check `filterTemplates()` logic
- Verify checkbox onChange handlers
- Console.log selected filters

### Online Templates Not Appearing
- Call `_saveOnlineTemplateMetadata()` first
- Check `__online_templates__` storage key
- Verify `online: true` flag is set

## Performance Considerations

1. **Large Invoice Lists:**
   - Consider implementing pagination
   - Add virtual scrolling for 100+ files
   - Lazy load thumbnails

2. **Filter Performance:**
   - Filters are applied on render
   - Consider memoization for large template lists
   - Debounce filter changes if needed

3. **Image Loading:**
   - Thumbnails are base64 - keep small
   - Consider lazy loading for off-screen items
   - Add loading placeholders

## Next Features

Potential enhancements:
- Search functionality within each tab
- Sort options (name, date, type)
- Bulk actions for user invoices
- Template favorites/bookmarks
- Recent templates (separate from recent files)
- Export/import templates
- Template preview modal
