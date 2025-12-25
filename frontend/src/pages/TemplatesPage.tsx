import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonIcon,
    IonButton,
    IonChip,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    IonButtons,
    IonPopover,
    IonBackButton,
    IonSpinner,
    IonModal,
    IonList,
    IonItem,
    useIonAlert,
    IonFab,
    IonFabButton,
    IonToast,
    IonInput,
    IonTextarea,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import {
    storefront,
    lockClosedOutline,
    lockOpenOutline,
    starOutline,
    star,
    documentTextOutline,
    phonePortraitOutline,
    tabletPortraitOutline,
    desktopOutline,
    searchOutline,
    filterOutline,
    downloadOutline,
    eyeOutline,
    personOutline,
    addOutline,
    closeOutline,
    documentOutline,
    pencilOutline,
    trashOutline,
    createOutline,
    briefcaseOutline,
    ellipsisVertical
} from 'ionicons/icons';
import './TemplatesPage.css';
import { useHistory } from "react-router-dom";
import { storageApi } from '../services/storage-api';
import { useAuth } from '../contexts/AuthContext';

// Mock invoice template data structure
interface InvoiceTemplate {
    id: string;
    name: string;
    description: string;
    type: string;
    device: 'mobile' | 'tablet' | 'desktop';
    imageUrl: string;
    author: string;
    downloads: number;
    rating: number;
    isPremium: boolean;
    isPrivate: boolean;
    createdAt: string;
    tags: string[];
}

type TabType = 'all' | 'my-invoices' | 'private' | 'public' | 'premium';

// Custom Edit/Settings SVG Icon
const EditSettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
);

const TemplatesPage: React.FC = () => {
    const history = useHistory();
    const { user } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedDevice, setSelectedDevice] = useState<string>('all');

    // ... existing state ...

    const handleEditTemplate = (templateId: string | number) => {
        // Navigate to the editor with the template ID (filename for user templates)
        // InvoiceAIPage will handle loading the template data
        // Check if it's a number (legacy/store id) or string (filename)
        // For user templates, we pass the filename
        history.push(`/app/invoice-ai/${encodeURIComponent(templateId)}`);
        setShowAppTemplatesModal(false);
    }
    const [appTemplates, setAppTemplates] = useState<any[]>([]);
    const [filteredAppTemplates, setFilteredAppTemplates] = useState<any[]>([]);
    const [userTemplates, setUserTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUserTemplates, setIsLoadingUserTemplates] = useState(true);
    const [appPage, setAppPage] = useState(1);
    const [appTotal, setAppTotal] = useState(0);
    const [appLimit] = useState(10);

    // New State for Refactor
    const [showAppTemplatesModal, setShowAppTemplatesModal] = useState(false);
    const [showToast, setShowToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [popoverState, setPopoverState] = useState<{ show: boolean, event: Event | undefined, templateId: string | null }>({ show: false, event: undefined, templateId: null });
    const [presentAlert] = useIonAlert();

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', type: 'invoice', device: 'desktop', image: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
    const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);

    useEffect(() => {
        loadUserTemplates();
    }, []);

    useEffect(() => {
        loadStoreTemplates(appPage);
    }, [appPage]);


    const handleDeleteTemplate = (filename: string) => {
        presentAlert({
            header: 'Delete Template',
            message: `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
            buttons: [
                'Cancel',
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: async () => {
                        const userId = user?.sub || 'default_user';

                        // Show loading state
                        setDeletingTemplateId(filename);
                        setShowToast({ show: true, message: `Deleting ${filename}...` });

                        // Optimistically remove from UI
                        setUserTemplates(prev => prev.filter(t => t.id !== filename));

                        // Try deleting as TEMPLATE first
                        const success = await storageApi.deleteTemplate(filename, userId);

                        if (success) {
                            setShowToast({ show: true, message: `Deleted ${filename}` });
                        } else {
                            // Fallback to deleteInvoice in case it was a legacy invoice-template
                            const fallbackSuccess = await storageApi.deleteInvoice(filename, userId);
                            if (fallbackSuccess) {
                                setShowToast({ show: true, message: `Deleted ${filename}` });
                            } else {
                                // Restore the template if deletion failed
                                await loadUserTemplates();
                                setShowToast({ show: true, message: `Failed to delete ${filename}` });
                            }
                        }

                        setDeletingTemplateId(null);
                    },
                },
            ],
        });
    };

    const handleCreateMenuClick = (e: any, templateId: string) => {
        e.persist();
        setPopoverState({ show: true, event: e, templateId });
    };

    const handleOpenEditModal = (template: any) => {
        setEditingTemplate(template);
        setEditForm({
            name: template.name || '',
            description: template.description || '',
            type: template.type || 'invoice',
            device: template.device || 'desktop',
            image: template.image || template.imageUrl || ''
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTemplate) return;

        setIsSaving(true);
        try {
            const userId = user?.sub || 'default_user';
            const success = await storageApi.updateTemplateMeta(
                editingTemplate.id,
                editForm,
                userId
            );

            if (success) {
                setShowToast({ show: true, message: 'Template updated successfully!' });
                setShowEditModal(false);
                setEditingTemplate(null);
                await loadUserTemplates(); // Refresh list
            } else {
                setShowToast({ show: true, message: 'Failed to update template' });
            }
        } catch (error) {
            console.error('Error saving template:', error);
            setShowToast({ show: true, message: 'Error saving template' });
        } finally {
            setIsSaving(false);
        }
    };

    const loadUserTemplates = async () => {
        setIsLoadingUserTemplates(true);
        try {
            const userId = user?.sub || 'default_user';

            // Fetch user templates using fetchTemplates (which gets from .../templates/)
            const result = await storageApi.fetchTemplates(1, 100, userId);

            const enrichedTemplates = result.items.map(t => ({
                id: t.id, // e.g. "My Template.json"
                name: t.name,
                description: t.description || `Last modified: ${new Date(t.last_modified).toLocaleDateString()}`,
                imageUrl: t.image || '',
                image: t.image || '',
                type: t.type || 'invoice',
                device: t.device || 'desktop',
                isUserTemplate: true
            }));
            setUserTemplates(enrichedTemplates);
        } catch (error) {
            console.error("Error loading user templates:", error);
        } finally {
            setIsLoadingUserTemplates(false);
        }
    };

    const loadStoreTemplates = async (page: number = 1) => {
        setIsLoading(true);
        try {
            // Load app templates from API with pagination
            const result = await storageApi.fetchGlobalTemplates(page, appLimit);
            const apiTemplates = result.items;
            setAppTotal(result.pagination?.total || 0);

            const templatesList = apiTemplates.map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description || (t.type) + ' Template',
                type: t.type || 'invoice',
                device: t.device || 'desktop',
                imageUrl: t.image || '',
                author: 'App',
                downloads: 0,
                rating: 5.0,
                isPremium: t.isPremium || false,
                price: t.price || {},
                isPrivate: false,
                createdAt: t.last_modified,
                tags: t.hashtag || [t.type || 'general']
            }));

            if (templatesList.length > 0) {
                setAppTemplates(templatesList);
            } else {
                setAppTemplates([]);
            }

        } catch (error) {
            console.error("Error loading store templates:", error);
            setAppTemplates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportTemplate = async (templateId: string, templateName: string) => {
        presentAlert({
            header: 'Import Template',
            subHeader: `Importing ${templateName}`,
            message: 'Enter a unique name for this template in your library:',
            inputs: [
                {
                    name: 'uniqueName',
                    type: 'text',
                    placeholder: 'My Custom Template',
                    value: templateName
                }
            ],
            buttons: [
                'Cancel',
                {
                    text: 'Import',
                    handler: (data) => {
                        const uniqueName = data.uniqueName.trim();
                        if (!uniqueName) {
                            setShowToast({ show: true, message: 'Name cannot be empty' });
                            return false; // Keep dialog open
                        }

                        // Check uniqueness
                        if (userTemplates.some(t => t.id === uniqueName)) {
                            setShowToast({ show: true, message: 'A template with this name already exists.' });
                            return false; // Keep dialog open
                        }

                        // Show loading toast and close modals immediately
                        setShowToast({ show: true, message: `Importing "${uniqueName}"...` });
                        setShowAppTemplatesModal(false);
                        setIsLoadingUserTemplates(true); // Show loading in My Templates section

                        // Run import in background (don't await - let dialog close)
                        const userId = user?.sub || 'default_user';
                        storageApi.importTemplate(templateId, uniqueName, userId)
                            .then(async (success) => {
                                if (success) {
                                    setShowToast({ show: true, message: `Template "${uniqueName}" imported successfully!` });
                                    await loadUserTemplates();
                                } else {
                                    setShowToast({ show: true, message: 'Failed to import template. Please try again.' });
                                    setIsLoadingUserTemplates(false);
                                }
                            })
                            .catch((err) => {
                                console.error("Import error", err);
                                setShowToast({ show: true, message: 'Error importing template.' });
                                setIsLoadingUserTemplates(false);
                            });

                        return true; // Close dialog immediately
                    }
                }
            ]
        });
    }

    // Filter and sort App templates
    useEffect(() => {
        let filtered = [...appTemplates];

        // Filter by search text
        if (searchText) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchText.toLowerCase()) ||
                t.description.toLowerCase().includes(searchText.toLowerCase()) ||
                t.tags.some((tag: string) => tag.toLowerCase().includes(searchText.toLowerCase()))
            );
        }

        // Filter by type
        if (selectedType !== 'all') {
            filtered = filtered.filter(t => t.type === selectedType);
        }

        // Filter by device
        if (selectedDevice !== 'all') {
            filtered = filtered.filter(t => t.device === selectedDevice);
        }

        setFilteredAppTemplates(filtered);
    }, [appTemplates, searchText, selectedType, selectedDevice]);

    const getTypeLabel = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'mobile': return phonePortraitOutline;
            case 'tablet': return tabletPortraitOutline;
            case 'desktop': return desktopOutline;
            default: return desktopOutline;
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(i => (
                    <IonIcon
                        key={i}
                        icon={i <= Math.round(rating) ? star : starOutline}
                        className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}
                    />
                ))}
                <span className="rating-text">{rating.toFixed(1)}</span>
            </div>
        );
    };

    return (
        <IonPage>
            <IonContent className="invoice-store-content ion-padding">
                {/* Your Templates / Saved Templates Section */}
                <div className="section-container">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className="manage-templates-title">My Templates</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <IonButton onClick={() => setShowAppTemplatesModal(true)} size="small" fill="solid">
                                <IonIcon icon={addOutline} slot="start" />
                                Browse Store
                            </IonButton>
                        </div>
                    </div>

                    {isLoadingUserTemplates ? (
                        <div className="empty-state">
                            <IonSpinner name="crescent" style={{ width: '48px', height: '48px' }} />
                            <p style={{ marginTop: '16px' }}>Loading templates...</p>
                        </div>
                    ) : userTemplates.length === 0 ? (
                        <div className="empty-state">
                            <IonIcon icon={documentTextOutline} className="empty-icon" />
                            <h2>No Saved Templates</h2>
                            <p>Import templates from the store to get started</p>
                            <IonButton onClick={() => setShowAppTemplatesModal(true)}>
                                Browse Templates
                            </IonButton>
                        </div>
                    ) : (
                        <div className="templates-grid">
                            {userTemplates.map((template, index) => (
                                <div key={`user-${template.id}-${index}`} style={{ height: '100%' }}>
                                    <IonCard className="template-store-card recent-card">
                                        {/* Template Image */}
                                        <div className="template-store-image">
                                            {template.imageUrl ? (
                                                <img
                                                    src={
                                                        template.imageUrl.startsWith('data:') || template.imageUrl.startsWith('http')
                                                            ? template.imageUrl
                                                            : `data:image/png;base64,${template.imageUrl}`
                                                    }
                                                    alt={template.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                                                        if (placeholder) {
                                                            (placeholder as HTMLElement).style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`template-image-placeholder`} style={{ display: template.imageUrl ? 'none' : 'flex' }}>
                                                <IonIcon icon={documentTextOutline} />
                                            </div>
                                        </div>

                                        <div className="template-card-content">
                                            <h3 className="template-name">{template.name}</h3>
                                            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>{template.description}</p>

                                            <div className="template-action-buttons">
                                                <IonButton
                                                    fill="solid"
                                                    size="small"
                                                    className="create-btn"
                                                    onClick={(e) => handleEditTemplate(template.id)}
                                                >
                                                    Open Editor
                                                </IonButton>

                                                <IonButton
                                                    fill="clear"
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenEditModal(template)}
                                                    title="Edit template details"
                                                >
                                                    <EditSettingsIcon />
                                                </IonButton>

                                                <IonButton
                                                    fill="clear"
                                                    size="small"
                                                    color="danger"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <IonIcon icon={trashOutline} />
                                                </IonButton>
                                            </div>
                                        </div>
                                    </IonCard>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <IonPopover
                    isOpen={popoverState.show}
                    event={popoverState.event}
                    onDidDismiss={() => setPopoverState({ ...popoverState, show: false })}
                >
                    <IonList>
                        <IonItem button onClick={() => {
                            setPopoverState({ ...popoverState, show: false });
                            if (popoverState.templateId) handleEditTemplate(popoverState.templateId);
                        }}>
                            <IonIcon icon={createOutline} slot="start" />
                            <IonLabel>Edit</IonLabel>
                        </IonItem>
                        <IonItem button onClick={() => {
                            setPopoverState({ ...popoverState, show: false });
                            if (popoverState.templateId) handleDeleteTemplate(popoverState.templateId);
                        }}>
                            <IonIcon icon={trashOutline} color="danger" slot="start" />
                            <IonLabel color="danger">Delete</IonLabel>
                        </IonItem>
                    </IonList>
                </IonPopover>

                {/* App Templates Modal */}
                <IonModal isOpen={showAppTemplatesModal} onDidDismiss={() => setShowAppTemplatesModal(false)} className="browse-templates-modal">
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Browse Templates</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowAppTemplatesModal(false)}>
                                    <IonIcon icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        {/* Search and Filters inside Modal */}
                        <div style={{ padding: '10px 16px' }}>
                            <div className="search-filter-container">
                                <IonSearchbar
                                    value={searchText}
                                    onIonInput={e => setSearchText(e.detail.value || '')}
                                    placeholder="Search templates..."
                                    className="store-searchbar"
                                />
                                <div className="filter-controls">
                                    <IonSelect
                                        value={selectedType}
                                        onIonChange={e => setSelectedType(e.detail.value)}
                                        interface="popover"
                                        placeholder="Type"
                                        className="filter-select"
                                    >
                                        <IonSelectOption value="all">All Types</IonSelectOption>
                                        <IonSelectOption value="tax_invoice">Tax Invoice</IonSelectOption>
                                        <IonSelectOption value="basic_invoice">Basic Invoice</IonSelectOption>
                                        <IonSelectOption value="commercial_invoice">Commercial Invoice</IonSelectOption>
                                    </IonSelect>

                                    <IonSelect
                                        value={selectedDevice}
                                        onIonChange={e => setSelectedDevice(e.detail.value)}
                                        interface="popover"
                                        placeholder="Device"
                                        className="filter-select"
                                    >
                                        <IonSelectOption value="all">All Devices</IonSelectOption>
                                        <IonSelectOption value="mobile">Mobile</IonSelectOption>
                                        <IonSelectOption value="tablet">Tablet</IonSelectOption>
                                        <IonSelectOption value="desktop">Desktop</IonSelectOption>
                                    </IonSelect>

                                </div>
                            </div>
                        </div>

                        {/* App Templates List */}
                        <div className="section-container">
                            {isLoading ? (
                                <div className="loading-container">
                                    <IonSpinner name="crescent" />
                                    <p>Loading templates...</p>
                                </div>
                            ) : filteredAppTemplates.length === 0 ? (
                                <div className="empty-state">
                                    <IonIcon icon={searchOutline} className="empty-icon" />
                                    <h2>No Templates Found</h2>
                                    <p>Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                <div className="store-container">
                                    <div className="templates-grid">
                                        {filteredAppTemplates.map(template => (
                                            <div key={template.id} style={{ height: '100%' }}>
                                                <IonCard className="template-store-card">
                                                    {/* Template Image */}
                                                    <div className="template-store-image">
                                                        {template.imageUrl ? (
                                                            <img src={`data:image/png;base64,${template.imageUrl}`} alt={template.name} className="template-preview-image" />
                                                        ) : (
                                                            <div className="template-image-placeholder">
                                                                <IonIcon icon={documentTextOutline} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Template Content */}
                                                    <IonCardHeader>
                                                        <div className="template-store-header">
                                                            <h3>{template.name}</h3>
                                                        </div>
                                                    </IonCardHeader>

                                                    <IonCardContent>

                                                        {/* Meta Information */}
                                                        <div className="template-store-meta">
                                                            <IonChip className="device-chip">
                                                                <IonIcon icon={getDeviceIcon(template.device)} />
                                                                <IonLabel>{template.device.charAt(0).toUpperCase() + template.device.slice(1)}</IonLabel>
                                                            </IonChip>
                                                            <div className="template-tags">
                                                                <span className="tag">{getTypeLabel(template.type)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="template-store-actions">
                                                            <IonButton
                                                                className="import-btn"
                                                                fill="outline"
                                                                size="small"
                                                                onClick={() => handleImportTemplate(template.id, template.name)}
                                                                disabled={importingTemplateId === template.id}
                                                            >
                                                                {importingTemplateId === template.id ? (
                                                                    <IonSpinner name="dots" slot="start" />
                                                                ) : (
                                                                    <IonIcon icon={downloadOutline} slot="start" />
                                                                )}
                                                                {importingTemplateId === template.id ? 'Importing...' : 'Import'}
                                                            </IonButton>
                                                        </div>
                                                    </IonCardContent>
                                                </IonCard>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {appTotal > appLimit && (
                            <div className="pagination-controls ion-padding ion-text-center">
                                <IonButton
                                    disabled={appPage === 1}
                                    onClick={() => setAppPage(p => Math.max(1, p - 1))}
                                    fill="clear"
                                >
                                    Previous
                                </IonButton>
                                <span style={{ margin: '0 10px' }}>
                                    Page {appPage} of {Math.ceil(appTotal / appLimit)}
                                </span>
                                <IonButton
                                    disabled={appPage * appLimit >= appTotal}
                                    onClick={() => setAppPage(p => p + 1)}
                                    fill="clear"
                                >
                                    Next
                                </IonButton>
                            </div>
                        )}
                    </IonContent>
                </IonModal>

                {/* Edit Template Modal */}
                <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Edit Template Details</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowEditModal(false)}>
                                    <IonIcon icon={closeOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <IonLabel position="stacked" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                    Template Name
                                </IonLabel>
                                <IonInput
                                    value={editForm.name}
                                    onIonInput={(e) => setEditForm({ ...editForm, name: e.detail.value || '' })}
                                    placeholder="Enter template name"
                                    fill="outline"
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <IonLabel position="stacked" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                    Description
                                </IonLabel>
                                <IonTextarea
                                    value={editForm.description}
                                    onIonInput={(e) => setEditForm({ ...editForm, description: e.detail.value || '' })}
                                    placeholder="Enter template description"
                                    fill="outline"
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <IonLabel position="stacked" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Type
                                    </IonLabel>
                                    <IonSelect
                                        value={editForm.type}
                                        onIonChange={(e) => setEditForm({ ...editForm, type: e.detail.value })}
                                        placeholder="Select type"
                                        fill="outline"
                                    >
                                        <IonSelectOption value="invoice">Invoice</IonSelectOption>
                                        <IonSelectOption value="quote">Quote</IonSelectOption>
                                        <IonSelectOption value="receipt">Receipt</IonSelectOption>
                                        <IonSelectOption value="work_order">Work Order</IonSelectOption>
                                        <IonSelectOption value="estimate">Estimate</IonSelectOption>
                                        <IonSelectOption value="other">Other</IonSelectOption>
                                    </IonSelect>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <IonLabel position="stacked" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Device
                                    </IonLabel>
                                    <IonSelect
                                        value={editForm.device}
                                        onIonChange={(e) => setEditForm({ ...editForm, device: e.detail.value })}
                                        placeholder="Select device"
                                        fill="outline"
                                    >
                                        <IonSelectOption value="desktop">Desktop</IonSelectOption>
                                        <IonSelectOption value="tablet">Tablet</IonSelectOption>
                                        <IonSelectOption value="mobile">Mobile</IonSelectOption>
                                    </IonSelect>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <IonLabel position="stacked" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                    Template Image
                                </IonLabel>

                                {/* Image Preview */}
                                <div style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    background: '#f5f5f5',
                                    borderRadius: '12px',
                                    border: '2px dashed #ddd',
                                    minHeight: '200px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {editForm.image ? (
                                        <>
                                            <img
                                                src={
                                                    editForm.image.startsWith('data:') || editForm.image.startsWith('http')
                                                        ? editForm.image
                                                        : `data:image/png;base64,${editForm.image}`
                                                }
                                                alt="Preview"
                                                style={{
                                                    maxWidth: '300px',
                                                    maxHeight: '220px',
                                                    objectFit: 'contain',
                                                    borderRadius: '8px',
                                                    background: 'white',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <IonButton
                                                fill="clear"
                                                size="small"
                                                color="medium"
                                                style={{ marginTop: '12px' }}
                                                onClick={() => setEditForm({ ...editForm, image: '' })}
                                            >
                                                Remove Image
                                            </IonButton>
                                        </>
                                    ) : (
                                        <p style={{ color: '#999', margin: '0 0 12px 0' }}>No image uploaded</p>
                                    )}

                                    {/* Upload Button */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="template-image-upload"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const result = reader.result as string;
                                                    setEditForm({ ...editForm, image: result });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <IonButton
                                        fill="solid"
                                        size="default"
                                        onClick={() => document.getElementById('template-image-upload')?.click()}
                                    >
                                        <IonIcon icon={documentOutline} slot="start" />
                                        {editForm.image ? 'Change Image' : 'Upload Image'}
                                    </IonButton>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <IonButton expand="block" fill="outline" onClick={() => setShowEditModal(false)} style={{ flex: 1 }} disabled={isSaving}>
                                    Cancel
                                </IonButton>
                                <IonButton expand="block" onClick={handleSaveEdit} style={{ flex: 1 }} disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <IonSpinner name="crescent" style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </IonButton>
                            </div>
                        </div>
                    </IonContent>
                </IonModal>

                <IonToast
                    isOpen={showToast.show}
                    onDidDismiss={() => setShowToast({ ...showToast, show: false })}
                    message={showToast.message}
                    duration={2000}
                    position="bottom"
                />

            </IonContent>
        </IonPage>
    );
};

export default TemplatesPage;
