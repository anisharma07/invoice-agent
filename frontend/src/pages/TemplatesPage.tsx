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
    heart,
    heartOutline,
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
import { DATA } from '../templates';
import { useHistory } from "react-router-dom";
import { tempMeta } from '../templates-meta';
import { getRecentTemplates, toggleFavorite, getFavorites, isFavorite, removeFromRecentTemplates } from '../utils/templateHistory';

// Mock invoice template data structure
interface InvoiceTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
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

const TemplatesPage: React.FC = () => {
    const history = useHistory();
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDevice, setSelectedDevice] = useState<string>('all');

    // ... existing state ...

    const handleEditTemplate = (templateId: number) => {
        const templateData = DATA[templateId];
        if (templateData) {
            // Navigate to the editor with the template ID in the URL
            history.push(`/app/invoice-ai/${templateId}`);
            setShowAppTemplatesModal(false);
        } else {
            console.error('MSC code not found for template', templateId);
            // Optionally show a toast error here
        }
    }
    const [appTemplates, setAppTemplates] = useState<any[]>([]);
    const [filteredAppTemplates, setFilteredAppTemplates] = useState<any[]>([]);
    const [recentTemplates, setRecentTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New State for Refactor
    const [showAppTemplatesModal, setShowAppTemplatesModal] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showToast, setShowToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const [popoverState, setPopoverState] = useState<{ show: boolean, event: Event | undefined, templateId: string | null }>({ show: false, event: undefined, templateId: null });
    const [presentAlert] = useIonAlert();

    useEffect(() => {
        loadTemplates();
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        const favs = await getFavorites();
        setFavorites(new Set(favs.map(f => f.templateId.toString())));
    };

    const handleToggleFavorite = async (e: React.MouseEvent, templateId: string, isAppTemplate: boolean, templateName: string) => {
        e.stopPropagation();
        const success = await toggleFavorite(templateId, isAppTemplate);
        if (success) {
            setFavorites(prev => new Set(prev).add(templateId));
            setShowToast({ show: true, message: `Added ${templateName} to favorites` });
        } else {
            setFavorites(prev => {
                const newSet = new Set(prev);
                newSet.delete(templateId);
                return newSet;
            });
            setShowToast({ show: true, message: `Removed ${templateName} from favorites` });
        }
    };

    const handleDeleteTemplate = (templateId: number, templateName: string) => {
        presentAlert({
            header: 'Delete Template',
            message: `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
            buttons: [
                'Cancel',
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: async () => {
                        await removeFromRecentTemplates(templateId, templateName); // Naive assumption: removing based on ID/Name match from recent
                        loadTemplates(); // Reload to refresh list
                        setShowToast({ show: true, message: `Deleted ${templateName}` });
                    },
                },
            ],
        });
    };

    const handleCreateMenuClick = (e: any, templateId: string) => {
        e.persist();
        setPopoverState({ show: true, event: e, templateId });
    };
    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            // Load app templates from DATA
            const templatesList = Object.values(DATA).map((t: any) => ({
                id: t.templateId,
                name: t.template, // Using template name as display name for now, or improve if needed
                description: t.category + ' Template', // Placeholder description
                category: t.category,
                deviceType: t.category.toLowerCase().includes('mobile') ? 'mobile' : 'desktop', // Simple inference
                imageUrl: tempMeta.find(m => m.template_id === t.templateId)?.ImageUri || '',
                author: 'App', // Default author
                downloads: 0, // Mock
                rating: 5.0, // Mock
                isPremium: false,
                isPrivate: false,
                createdAt: new Date().toISOString(),
                tags: [t.category.toLowerCase()]
            }));
            setAppTemplates(templatesList);

            // Load recent templates
            const recent = await getRecentTemplates();
            // Map recent templates to a usable format if needed, or use as is
            // For now, let's just use the recent list structure directly or enrich it if possible
            // We might need to match IDs back to DATA if we want full details, 
            // but recent history only stores ID and filename.
            // Let's just store what we have and maybe try to find more info from DATA if possible.
            const enrichedRecent = recent.map(r => {
                const templateInfo = DATA[r.templateId];
                return {
                    ...r,
                    name: r.fileName || (templateInfo ? templateInfo.template : 'Unknown Template'),
                    description: 'Last used: ' + new Date(r.lastUsed).toLocaleDateString(),
                    imageUrl: (templateInfo && tempMeta.find(m => m.template_id === templateInfo.templateId)?.ImageUri) || '',
                    // Add other fields to match structure if we want to reuse card component, 
                    // or make a separate comprehensive type.
                    // For "Your Templates" usually we just want quick access card.
                    id: r.templateId
                };
            });
            setRecentTemplates(enrichedRecent);

        } catch (error) {
            console.error("Error loading templates:", error);
        } finally {
            setIsLoading(false);
        }
    };

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

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }

        // Filter by device
        if (selectedDevice !== 'all') {
            filtered = filtered.filter(t => t.deviceType === selectedDevice);
        }

        setFilteredAppTemplates(filtered);
    }, [appTemplates, searchText, selectedCategory, selectedDevice]);

    const getCategoryLabel = (category: string) => {
        return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
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
                        <h2 className="manage-templates-title">Manage your templates</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <IonButton onClick={() => setShowAppTemplatesModal(true)} size="small" fill="solid">
                                <IonIcon icon={addOutline} slot="start" />
                                Add Template
                            </IonButton>
                            <IonButton
                                fill={showFavoritesOnly ? "solid" : "outline"}
                                size="small"
                                color="danger"
                                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            >
                                <IonIcon icon={showFavoritesOnly ? heart : heartOutline} slot="start" />
                                Favorites
                            </IonButton>
                        </div>
                    </div>

                    {recentTemplates.length === 0 ? (
                        <div className="empty-state">
                            <IonIcon icon={documentTextOutline} className="empty-icon" />
                            <h2>No Saved Templates</h2>
                            <p>Templates you use will appear here</p>
                            <IonButton onClick={() => setShowAppTemplatesModal(true)}>
                                Browse Templates
                            </IonButton>
                        </div>
                    ) : (
                        <IonGrid>
                            <IonRow>
                                {recentTemplates
                                    .filter(t => !showFavoritesOnly || favorites.has(t.id.toString()))
                                    .map((template, index) => (
                                        <IonCol key={`recent-${template.id}-${index}`} size="12" sizeMd="6" sizeLg="3">
                                            <IonCard className="template-store-card recent-card">
                                                {/* Template Image */}
                                                <div className="template-store-image">
                                                    <div className="template-image-placeholder">
                                                        <IonIcon icon={documentTextOutline} />
                                                    </div>
                                                    {/* Actions Overlay */}
                                                    <div className="template-card-actions">
                                                        <div
                                                            className="favorite-button"
                                                            onClick={(e) => handleToggleFavorite(e, template.id.toString(), false, template.name)}
                                                        >
                                                            <IonIcon
                                                                icon={favorites.has(template.id.toString()) ? heart : heartOutline}
                                                                color={favorites.has(template.id.toString()) ? "danger" : "medium"}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="template-card-content">
                                                    <h3 className="template-name">{template.name}</h3>

                                                    <div className="template-action-buttons">
                                                        <IonButton
                                                            fill="solid"
                                                            size="small"
                                                            className="create-btn"
                                                            onClick={(e) => handleCreateMenuClick(e, template.id.toString())}
                                                        >
                                                            Create
                                                        </IonButton>

                                                        <IonButton
                                                            fill="clear"
                                                            size="small"
                                                            color="medium"
                                                            onClick={() => { /* Edit Handler Stub */ }}
                                                        >
                                                            <IonIcon icon={createOutline} />
                                                        </IonButton>

                                                        <IonButton
                                                            fill="clear"
                                                            size="small"
                                                            color="danger"
                                                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                                                        >
                                                            <IonIcon icon={trashOutline} />
                                                        </IonButton>
                                                    </div>
                                                </div>
                                            </IonCard>
                                        </IonCol>
                                    ))}
                            </IonRow>
                        </IonGrid>
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
                            // Navigation stub for New Invoice
                            console.log('Create New Invoice from', popoverState.templateId);
                        }}>
                            <IonIcon icon={documentOutline} slot="start" />
                            <IonLabel>New Invoice</IonLabel>
                        </IonItem>
                        <IonItem button onClick={() => {
                            setPopoverState({ ...popoverState, show: false });
                            // Navigation stub for New Job
                            console.log('Create New Job from', popoverState.templateId);
                        }}>
                            <IonIcon icon={briefcaseOutline} slot="start" />
                            <IonLabel>New Job</IonLabel>
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
                                        value={selectedCategory}
                                        onIonChange={e => setSelectedCategory(e.detail.value)}
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
                                    <IonGrid>
                                        <IonRow>
                                            {filteredAppTemplates.map(template => (
                                                <IonCol key={template.id} size="12" sizeMd="6" sizeLg="4">
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
                                                                    <IonIcon icon={getDeviceIcon(template.deviceType)} />
                                                                    <IonLabel>{template.deviceType.charAt(0).toUpperCase() + template.deviceType.slice(1)}</IonLabel>
                                                                </IonChip>
                                                                <div className="template-tags">
                                                                    <span className="tag">{getCategoryLabel(template.category)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="template-store-actions">
                                                                <IonButton className="import-btn" fill="outline" size="small">
                                                                    <IonIcon icon={downloadOutline} slot="start" />
                                                                    Import
                                                                </IonButton>
                                                                <IonButton
                                                                    className="edit-btn"
                                                                    size="small"
                                                                    onClick={() => handleEditTemplate(template.id)}
                                                                >
                                                                    <IonIcon icon={createOutline} slot="start" />
                                                                    Edit
                                                                </IonButton>
                                                            </div>
                                                        </IonCardContent>
                                                    </IonCard>
                                                </IonCol>
                                            ))}
                                        </IonRow>
                                    </IonGrid>
                                </div>
                            )}
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
