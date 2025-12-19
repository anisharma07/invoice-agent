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
    IonBackButton,
    IonSpinner,
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
} from 'ionicons/icons';
import './InvoiceStorePage.css';

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

const InvoiceStorePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDevice, setSelectedDevice] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('popular');
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
    const [filteredTemplates, setFilteredTemplates] = useState<InvoiceTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mock data - replace with actual API call
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            const mockTemplates: InvoiceTemplate[] = [
                {
                    id: '1',
                    name: 'Professional Business Invoice',
                    description: 'Clean professional invoice template with comprehensive business details and tax calculations',
                    category: 'tax_invoice',
                    deviceType: 'desktop',
                    imageUrl: '/invoices/preview1.jpg',
                    author: 'John Doe',
                    downloads: 1234,
                    rating: 4.8,
                    isPremium: false,
                    isPrivate: false,
                    createdAt: '2024-01-15',
                    tags: ['business', 'professional', 'tax'],
                },
                {
                    id: '2',
                    name: 'Modern Service Receipt',
                    description: 'Sleek and modern service receipt design perfect for service-based businesses',
                    category: 'service_receipt',
                    deviceType: 'mobile',
                    imageUrl: '/invoices/preview2.jpg',
                    author: 'Jane Smith',
                    downloads: 856,
                    rating: 4.5,
                    isPremium: true,
                    isPrivate: false,
                    createdAt: '2024-02-10',
                    tags: ['modern', 'service', 'mobile'],
                },
                {
                    id: '3',
                    name: 'Detailed Quotation Template',
                    description: 'Comprehensive quotation template with itemized pricing and terms',
                    category: 'quotation',
                    deviceType: 'desktop',
                    imageUrl: '/invoices/preview3.jpg',
                    author: 'Mike Johnson',
                    downloads: 645,
                    rating: 4.7,
                    isPremium: false,
                    isPrivate: true,
                    createdAt: '2024-03-05',
                    tags: ['quotation', 'detailed', 'pricing'],
                },
                {
                    id: '4',
                    name: 'Simple Purchase Order',
                    description: 'Straightforward purchase order template for quick transactions',
                    category: 'purchase_order',
                    deviceType: 'tablet',
                    imageUrl: '/invoices/preview4.jpg',
                    author: 'Sarah Williams',
                    downloads: 423,
                    rating: 4.3,
                    isPremium: true,
                    isPrivate: false,
                    createdAt: '2024-03-20',
                    tags: ['simple', 'purchase', 'quick'],
                },
                {
                    id: '5',
                    name: 'Premium Tax Invoice',
                    description: 'Premium tax invoice with advanced calculations and multiple currency support',
                    category: 'tax_invoice',
                    deviceType: 'desktop',
                    imageUrl: '/invoices/preview5.jpg',
                    author: 'David Brown',
                    downloads: 2145,
                    rating: 4.9,
                    isPremium: true,
                    isPrivate: false,
                    createdAt: '2024-04-01',
                    tags: ['premium', 'tax', 'advanced'],
                },
                {
                    id: '6',
                    name: 'Credit Note Template',
                    description: 'Professional credit note template for returns and adjustments',
                    category: 'credit_note',
                    deviceType: 'mobile',
                    imageUrl: '/invoices/preview6.jpg',
                    author: 'Emily Davis',
                    downloads: 334,
                    rating: 4.4,
                    isPremium: false,
                    isPrivate: true,
                    createdAt: '2024-04-15',
                    tags: ['credit', 'returns', 'adjustments'],
                },
            ];
            setTemplates(mockTemplates);
            setIsLoading(false);
        }, 1000);
    }, []);

    // Filter and sort templates
    useEffect(() => {
        let filtered = [...templates];

        // Filter by tab
        if (activeTab === 'my-invoices') {
            filtered = filtered.filter(t => t.author === 'John Doe'); // Replace with actual user
        } else if (activeTab === 'private') {
            filtered = filtered.filter(t => t.isPrivate);
        } else if (activeTab === 'public') {
            filtered = filtered.filter(t => !t.isPrivate);
        } else if (activeTab === 'premium') {
            filtered = filtered.filter(t => t.isPremium);
        }

        // Filter by search text
        if (searchText) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchText.toLowerCase()) ||
                t.description.toLowerCase().includes(searchText.toLowerCase()) ||
                t.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
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

        // Sort
        switch (sortBy) {
            case 'popular':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        setFilteredTemplates(filtered);
    }, [templates, activeTab, searchText, selectedCategory, selectedDevice, sortBy]);

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
            <IonContent className="invoice-store-content">
                {/* Tabs */}
                <div style={{ padding: '10px 16px 0' }}>
                    <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as TabType)}>
                        <IonSegmentButton value="all">
                            <IonLabel>All Templates</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="my-invoices">
                            <IonLabel>My Invoices</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="private">
                            <IonLabel>
                                <IonIcon icon={lockClosedOutline} style={{ fontSize: '14px', marginRight: '4px' }} />
                                Private
                            </IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="public">
                            <IonLabel>
                                <IonIcon icon={lockOpenOutline} style={{ fontSize: '14px', marginRight: '4px' }} />
                                Public
                            </IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="premium">
                            <IonLabel>
                                <IonIcon icon={star} style={{ fontSize: '14px', marginRight: '4px' }} />
                                Premium
                            </IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </div>

                {/* Search and Filters */}
                <div style={{ padding: '10px 16px' }}>
                    <div className="search-filter-container">
                        <IonSearchbar
                            value={searchText}
                            onIonInput={e => setSearchText(e.detail.value || '')}
                            placeholder="Search by name, description, or tags..."
                            className="store-searchbar"
                        />
                        <div className="filter-controls">
                            <IonSelect
                                value={selectedCategory}
                                onIonChange={e => setSelectedCategory(e.detail.value)}
                                interface="popover"
                                placeholder="Category"
                                className="filter-select"
                            >
                                <IonSelectOption value="all">All Categories</IonSelectOption>
                                <IonSelectOption value="tax_invoice">Tax Invoice</IonSelectOption>
                                <IonSelectOption value="service_receipt">Service Receipt</IonSelectOption>
                                <IonSelectOption value="quotation">Quotation</IonSelectOption>
                                <IonSelectOption value="purchase_order">Purchase Order</IonSelectOption>
                                <IonSelectOption value="proforma_invoice">Proforma Invoice</IonSelectOption>
                                <IonSelectOption value="credit_note">Credit Note</IonSelectOption>
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

                            <IonSelect
                                value={sortBy}
                                onIonChange={e => setSortBy(e.detail.value)}
                                interface="popover"
                                placeholder="Sort By"
                                className="filter-select"
                            >
                                <IonSelectOption value="popular">Most Popular</IonSelectOption>
                                <IonSelectOption value="rating">Highest Rated</IonSelectOption>
                                <IonSelectOption value="newest">Newest First</IonSelectOption>
                                <IonSelectOption value="name">Name (A-Z)</IonSelectOption>
                            </IonSelect>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-container">
                        <IonSpinner name="crescent" />
                        <p>Loading templates...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="empty-state">
                        <IonIcon icon={searchOutline} className="empty-icon" />
                        <h2>No Templates Found</h2>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="store-container">
                        <div className="results-header">
                            <h3>{filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'} Found</h3>
                        </div>

                        <IonGrid>
                            <IonRow>
                                {filteredTemplates.map(template => (
                                    <IonCol key={template.id} size="12" sizeMd="6" sizeLg="4">
                                        <IonCard className="template-store-card">
                                            {/* Template Image */}
                                            <div className="template-store-image">
                                                {template.imageUrl ? (
                                                    <img src={template.imageUrl} alt={template.name} />
                                                ) : (
                                                    <div className="template-image-placeholder">
                                                        <IonIcon icon={documentTextOutline} />
                                                    </div>
                                                )}
                                                {template.isPremium && (
                                                    <IonBadge className="premium-badge">
                                                        <IonIcon icon={star} />
                                                        Premium
                                                    </IonBadge>
                                                )}
                                                {template.isPrivate && (
                                                    <IonBadge className="private-badge">
                                                        <IonIcon icon={lockClosedOutline} />
                                                        Private
                                                    </IonBadge>
                                                )}
                                            </div>

                                            {/* Template Content */}
                                            <IonCardHeader>
                                                <div className="template-store-header">
                                                    <h3>{template.name}</h3>
                                                    {renderStars(template.rating)}
                                                </div>
                                            </IonCardHeader>

                                            <IonCardContent>
                                                <p className="template-store-description">{template.description}</p>

                                                {/* Meta Information */}
                                                <div className="template-store-meta">
                                                    <IonChip className="category-chip">
                                                        <IonIcon icon={documentTextOutline} />
                                                        <IonLabel>{getCategoryLabel(template.category)}</IonLabel>
                                                    </IonChip>
                                                    <IonChip className="device-chip">
                                                        <IonIcon icon={getDeviceIcon(template.deviceType)} />
                                                        <IonLabel>{template.deviceType}</IonLabel>
                                                    </IonChip>
                                                </div>

                                                {/* Stats */}
                                                <div className="template-store-stats">
                                                    <span>
                                                        <IonIcon icon={personOutline} />
                                                        {template.author}
                                                    </span>
                                                    <span>
                                                        <IonIcon icon={downloadOutline} />
                                                        {template.downloads} downloads
                                                    </span>
                                                </div>

                                                {/* Tags */}
                                                <div className="template-tags">
                                                    {template.tags.map(tag => (
                                                        <span key={tag} className="tag">#{tag}</span>
                                                    ))}
                                                </div>

                                                {/* Actions */}
                                                <div className="template-store-actions">
                                                    <IonButton expand="block" fill="outline" size="small">
                                                        <IonIcon icon={eyeOutline} slot="start" />
                                                        Preview
                                                    </IonButton>
                                                    <IonButton expand="block" size="small">
                                                        <IonIcon icon={downloadOutline} slot="start" />
                                                        Use Template
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
            </IonContent>
        </IonPage>
    );
};

export default InvoiceStorePage;
