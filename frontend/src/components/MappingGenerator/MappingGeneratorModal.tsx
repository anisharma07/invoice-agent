import React, { useState, useEffect, memo } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonText,
    IonSpinner,
} from '@ionic/react';
import { close, add, trash, copy, codeSlash, chevronDown, sparkles } from 'ionicons/icons';
import { AppMappingItem } from '../../types/template';
import { storageApi } from '../../services/storage-api';
import './MappingGeneratorModal.css';

// Bold Arrow SVG Icons for Up/Down navigation
const ArrowUpIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
        <path d="M12 4L5 14h4v6h6v-6h4L12 4z" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
        <path d="M12 20L19 10h-4V4H9v6H5l7 10z" />
    </svg>
);

interface MappingGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: { [key: string]: AppMappingItem };
    mscCode?: string; // MSC code for AI generation
}

interface MappingItemEditorProps {
    itemKey: string;
    item: AppMappingItem;
    onChange: (newItem: AppMappingItem) => void;
    onDelete: () => void;
    level?: number;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}

interface MappingBuilderProps {
    items: { [key: string]: AppMappingItem };
    onChange: (newItems: { [key: string]: AppMappingItem }) => void;
    level?: number;
    isTableCol?: boolean;
}

// Memoized MappingItemEditor component - defined OUTSIDE the main component
const MappingItemEditor = memo(({
    itemKey,
    item,
    onChange,
    onDelete,
    level = 0,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast
}: MappingItemEditorProps) => {
    const updateField = (field: keyof AppMappingItem, value: any) => {
        const newItem = { ...item, [field]: value };
        if (field === 'type') {
            // Reset type-specific fields if type changes
            delete newItem.cell;
            delete newItem.formContent;
            delete newItem.rows;
            delete newItem.col;
            delete newItem.unitname;

            if (value === 'form') newItem.formContent = {};
            if (value === 'table') {
                newItem.rows = { start: 0, end: 0 };
                newItem.col = {};
            }
        }
        onChange(newItem);
    };

    return (
        <div className={`mapping-card`} style={{ marginLeft: level > 0 ? '24px' : '0', marginBottom: '16px' }}>
            <div className="mapping-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="order-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                            onClick={onMoveUp}
                            disabled={isFirst}
                            className="order-btn"
                            style={{
                                border: 'none',
                                background: isFirst ? '#f0f0f0' : '#e0e7ff',
                                borderRadius: '4px',
                                cursor: isFirst ? 'not-allowed' : 'pointer',
                                padding: '2px 4px',
                                color: isFirst ? '#bbb' : '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Move Up"
                        >
                            <ArrowUpIcon />
                        </button>
                        <button
                            onClick={onMoveDown}
                            disabled={isLast}
                            className="order-btn"
                            style={{
                                border: 'none',
                                background: isLast ? '#f0f0f0' : '#e0e7ff',
                                borderRadius: '4px',
                                cursor: isLast ? 'not-allowed' : 'pointer',
                                padding: '2px 4px',
                                color: isLast ? '#bbb' : '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Move Down"
                        >
                            <ArrowDownIcon />
                        </button>
                    </div>
                    <span className="mapping-key">{itemKey}</span>
                    {level > 0 && <span style={{ fontSize: '0.8em', color: '#888', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>Nested</span>}
                </div>
                <IonButton fill="clear" color="danger" size="small" onClick={onDelete}>
                    <IonIcon icon={trash} slot="icon-only" />
                </IonButton>
            </div>

            <div className="mapping-content">
                <IonGrid style={{ padding: 0 }}>
                    <IonRow>
                        <IonCol size="4" sizeMd="4">
                            <div className="mapping-input-wrapper">
                                <IonLabel position="stacked" style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Data Type</IonLabel>
                                <IonSelect
                                    value={item.type}
                                    onIonChange={e => updateField('type', e.detail.value)}
                                    interface="popover"
                                    style={{ fontSize: '13px', width: '100%' }}
                                >
                                    <IonSelectOption value="text">Text / Value</IonSelectOption>
                                    <IonSelectOption value="image">Image</IonSelectOption>
                                    <IonSelectOption value="form">Form Group</IonSelectOption>
                                    <IonSelectOption value="table">Table / List</IonSelectOption>
                                </IonSelect>
                            </div>
                        </IonCol>

                        {/* Text/Image Specific Fields - Inline */}
                        {(item.type === 'text' || item.type === 'image') && (
                            <IonCol size="4" sizeMd="3">
                                <div className="mapping-input-wrapper">
                                    <IonLabel position="stacked" style={{ fontSize: '11px', color: '#666' }}>Cell</IonLabel>
                                    <IonInput
                                        value={item.cell}
                                        placeholder="B2"
                                        onIonInput={e => updateField('cell', e.detail.value)}
                                        style={{ fontSize: '13px' }}
                                    />
                                </div>
                            </IonCol>
                        )}

                        <IonCol size="4" sizeMd="3">
                            <div className="mapping-input-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <IonLabel style={{ fontSize: '13px' }}>Editable</IonLabel>
                                <IonToggle
                                    checked={item.editable !== false}
                                    onIonChange={e => updateField('editable', e.detail.checked)}
                                    style={{ zoom: 0.8 }}
                                />
                            </div>
                        </IonCol>
                    </IonRow>

                    {/* Form Specific Fields */}
                    {item.type === 'form' && (
                        <div className="mapping-nested-container">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <IonIcon icon={chevronDown} color="medium" />
                                <IonLabel style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Form Content Fields
                                </IonLabel>
                            </div>
                            <MappingBuilder
                                items={item.formContent || {}}
                                onChange={newContent => updateField('formContent', newContent)}
                                level={level + 1}
                            />
                        </div>
                    )}

                    {/* Table Specific Fields */}
                    {item.type === 'table' && (
                        <div className="mapping-nested-container">
                            <IonText color="primary" style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Table Configuration</IonText>
                            <IonRow>
                                <IonCol size="4">
                                    <div className="mapping-input-wrapper">
                                        <IonLabel position="stacked" style={{ fontSize: '11px' }}>Start Row</IonLabel>
                                        <IonInput
                                            type="number"
                                            value={item.rows?.start}
                                            onIonInput={e => updateField('rows', { ...item.rows, start: parseInt(e.detail.value!, 10) })}
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                </IonCol>
                                <IonCol size="4">
                                    <div className="mapping-input-wrapper">
                                        <IonLabel position="stacked" style={{ fontSize: '11px' }}>End Row</IonLabel>
                                        <IonInput
                                            type="number"
                                            value={item.rows?.end}
                                            onIonInput={e => updateField('rows', { ...item.rows, end: parseInt(e.detail.value!, 10) })}
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                </IonCol>
                                <IonCol size="4">
                                    <div className="mapping-input-wrapper">
                                        <IonLabel position="stacked" style={{ fontSize: '11px' }}>Item Name</IonLabel>
                                        <IonInput
                                            value={item.unitname}
                                            placeholder="e.g. Item"
                                            onIonInput={e => updateField('unitname', e.detail.value)}
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>
                                </IonCol>
                            </IonRow>
                            <div style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
                                <IonLabel style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Columns</IonLabel>
                                <MappingBuilder
                                    items={item.col || {}}
                                    onChange={newCol => updateField('col', newCol)}
                                    level={level + 1}
                                    isTableCol={true}
                                />
                            </div>
                        </div>
                    )}
                </IonGrid>
            </div>
        </div>
    );
});

// Memoized MappingBuilder component - defined OUTSIDE the main component
const MappingBuilder = memo(({
    items,
    onChange,
    level = 0,
    isTableCol = false
}: MappingBuilderProps) => {
    const [newKey, setNewKey] = useState('');

    const handleAdd = () => {
        if (!newKey.trim()) return;
        if (items[newKey]) {
            alert('Key already exists!');
            return;
        }

        const newItem: AppMappingItem = {
            type: 'text',
            editable: true
        };

        // If it's a table column, we usually want simple text fields with 'name' and 'cell' column letter
        if (isTableCol) {
            newItem.name = newKey; // Default name to key
            newItem.cell = ''; // Expected to be column letter
        }

        onChange({ [newKey]: newItem, ...items });
        setNewKey('');
    };

    const handleChangeItem = (key: string, newItem: AppMappingItem) => {
        onChange({ ...items, [key]: newItem });
    };

    const handleDeleteItem = (key: string) => {
        const newItems = { ...items };
        delete newItems[key];
        onChange(newItems);
    };

    const handleMoveUp = (key: string) => {
        const currentOrder = Object.keys(items);
        const index = currentOrder.indexOf(key);
        if (index <= 0) return;

        // Swap with previous item
        const newOrder = [...currentOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

        // Rebuild the object with new order
        const newItems: { [key: string]: AppMappingItem } = {};
        newOrder.forEach(k => {
            newItems[k] = items[k];
        });
        onChange(newItems);
    };

    const handleMoveDown = (key: string) => {
        const currentOrder = Object.keys(items);
        const index = currentOrder.indexOf(key);
        if (index < 0 || index >= currentOrder.length - 1) return;

        // Swap with next item
        const newOrder = [...currentOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

        // Rebuild the object with new order
        const newItems: { [key: string]: AppMappingItem } = {};
        newOrder.forEach(k => {
            newItems[k] = items[k];
        });
        onChange(newItems);
    };

    const itemKeys = Object.keys(items);

    return (
        <div>
            {/* Add New Item Input (At Top) */}
            <div className="add-item-container" style={{ marginLeft: level > 0 ? '24px' : '0', marginBottom: '16px' }}>
                <IonInput
                    value={newKey}
                    placeholder={isTableCol ? "New Column Name..." : "Add New Field Key..."}
                    onIonInput={e => setNewKey(e.detail.value || '')}
                    className="mapping-input-wrapper"
                    style={{ flex: 1, border: 'none', background: 'transparent' }}
                    onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') handleAdd();
                    }}
                    onKeyUp={e => e.stopPropagation()}
                />
                <IonButton size="small" onClick={handleAdd} fill="solid">
                    <IonIcon icon={add} slot="start" />
                    Add
                </IonButton>
            </div>

            {/* List Existing Items */}
            <div style={{ padding: 0 }}>
                {itemKeys.map((key, index) => (
                    <div key={key} id={`mapping-item-${level}-${key}`}>
                        <MappingItemEditor
                            itemKey={key}
                            item={items[key]}
                            onChange={newItem => handleChangeItem(key, newItem)}
                            onDelete={() => handleDeleteItem(key)}
                            level={level}
                            onMoveUp={() => handleMoveUp(key)}
                            onMoveDown={() => handleMoveDown(key)}
                            isFirst={index === 0}
                            isLast={index === itemKeys.length - 1}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

// Main MappingGeneratorModal component
const MappingGeneratorModal: React.FC<MappingGeneratorModalProps> = ({ isOpen, onClose, initialData, mscCode }) => {
    const [mapping, setMapping] = useState<{ [key: string]: AppMappingItem }>(initialData || {});
    const [jsonPreview, setJsonPreview] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Update mapping when initialData changes
    useEffect(() => {
        if (initialData) {
            setMapping(initialData);
        }
    }, [initialData]);

    // Helper to generate JSON
    useEffect(() => {
        setJsonPreview(JSON.stringify(mapping, null, 2));
    }, [mapping]);

    const handleCopyJson = () => {
        navigator.clipboard.writeText(jsonPreview);
        alert('JSON copied to clipboard!');
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all mappings?')) {
            setMapping({});
        }
    };

    const handleAiGenerate = async () => {
        if (!mscCode) {
            setAiError('No sheet code available for AI analysis. Please load a template first.');
            return;
        }

        setIsGenerating(true);
        setAiError(null);

        try {
            const result = await storageApi.generateMapping(mscCode);

            if (result.success && result.data?.mapping) {
                // Show confirmation before applying
                const fieldCount = result.data.fieldCount || Object.keys(result.data.mapping).length;
                const confirmed = window.confirm(
                    `AI has generated ${fieldCount} mapping fields.\n\n` +
                    `⚠️ This will overwrite your current mappings.\n\n` +
                    `Do you want to apply the generated mapping?`
                );

                if (confirmed) {
                    setMapping(result.data.mapping);
                    setAiError(null);
                }
            } else {
                setAiError(result.error || 'Failed to generate mapping');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            setAiError('An error occurred while generating the mapping');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose} className="mapping-modal-large">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Add mapping ..</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                onKeyUp={e => e.stopPropagation()}
            >
                {/* AI Generate Button */}
                <div style={{ marginBottom: '16px' }}>
                    <IonButton
                        expand="block"
                        color="primary"
                        onClick={handleAiGenerate}
                        disabled={isGenerating || !mscCode}
                        style={{
                            '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '--box-shadow': '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                                Analyzing Sheet...
                            </>
                        ) : (
                            <>
                                <IonIcon icon={sparkles} slot="start" />
                                AI Generate Mapping
                            </>
                        )}
                    </IonButton>
                    {!mscCode && (
                        <IonText color="medium" style={{ display: 'block', textAlign: 'center', marginTop: '4px', fontSize: '12px' }}>
                            AI generation requires a loaded template
                        </IonText>
                    )}
                    {aiError && (
                        <IonText color="danger" style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '12px' }}>
                            {aiError}
                        </IonText>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <IonText color="medium">
                        <p style={{ margin: 0, fontSize: '12px' }}>
                            Build your mapping structure below. Keys are top-level identifiers.
                        </p>
                    </IonText>
                    <IonButtons>
                        <IonButton color="medium" fill="outline" size="small" onClick={handleReset}>
                            Reset
                        </IonButton>
                        <IonButton color="secondary" fill="solid" size="small" onClick={() => setShowPreview(!showPreview)}>
                            <IonIcon icon={codeSlash} slot="start" />
                            {showPreview ? 'Hide JSON' : 'Show JSON'}
                        </IonButton>
                    </IonButtons>
                </div>

                {showPreview && (
                    <IonCard style={{ background: '#f4f4f4', marginBottom: '16px' }}>
                        <IonCardContent>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                <IonButton fill="clear" size="small" onClick={handleCopyJson}>
                                    <IonIcon icon={copy} slot="start" />
                                    Copy
                                </IonButton>
                            </div>
                            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px' }}>
                                {jsonPreview}
                            </pre>
                        </IonCardContent>
                    </IonCard>
                )}

                <MappingBuilder
                    items={mapping}
                    onChange={setMapping}
                />
            </IonContent>
        </IonModal>
    );
};

export default MappingGeneratorModal;
