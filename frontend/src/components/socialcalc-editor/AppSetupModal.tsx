import React, { useState, useEffect } from 'react';
import './AppSetupModal.css';

export interface SchemaMapping {
    id: string;
    label: string;
    cell: string;
    type: 'text' | 'image' | 'table' | 'total' | 'invoice_id';
}

export interface TemplateSchema {
    mappings: SchemaMapping[];
}

interface AppSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schema: TemplateSchema) => Promise<void>;
    initialSchema?: TemplateSchema;
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const COMPULSORY_TYPES = ['total', 'invoice_id'];

export const AppSetupModal: React.FC<AppSetupModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialSchema
}) => {
    const [mappings, setMappings] = useState<SchemaMapping[]>([]);

    // New mapping form state
    const [newLabel, setNewLabel] = useState('');
    const [newCell, setNewCell] = useState('');
    const [newType, setNewType] = useState<SchemaMapping['type']>('text');

    useEffect(() => {
        if (isOpen) {
            // Initialize mappings, ensuring compulsory fields exist if not present
            let loadedMappings = initialSchema?.mappings || [];

            // Check for compulsory fields and add internal placeholders if missing (user still needs to configure them)
            // Actually, we should probably prompt user or show them as "Not Configured" but let's just ensure we have the logic.
            // For now, let's just load what's there. User can add them.
            setMappings(loadedMappings);
        }
    }, [isOpen, initialSchema]);

    const handleAddMapping = () => {
        if (!newLabel || !newCell) return;

        // Check if unique constraint (e.g. only one total?) maybe not strictly necessary but logical
        if (newType === 'total' && mappings.some(m => m.type === 'total')) {
            alert('A Total Sum mapping already exists.');
            return;
        }
        if (newType === 'invoice_id' && mappings.some(m => m.type === 'invoice_id')) {
            alert('An Invoice ID mapping already exists.');
            return;
        }

        const newMapping: SchemaMapping = {
            id: generateId(),
            label: newLabel,
            cell: newCell.toUpperCase(),
            type: newType
        };

        setMappings([...mappings, newMapping]);

        // Reset form
        setNewLabel('');
        setNewCell('');
        setNewType('text');
    };

    const handleDeleteMapping = (id: string, type: string) => {
        // Warn if deleting compulsory? Or just allow and validate on save.
        // User asked: "delete some editable cells" but also "Total sum and Invoice ID cells are compulsory"
        // So we should prevent deleting them? Or just warn?
        // Let's prevent completely deleting if we want to enforce presence, or let them delete and blocked save.
        // Let's block save if missing. But for now, allow delete.
        setMappings(mappings.filter(m => m.id !== id));
    };

    const handleSave = async () => {
        // Validation
        const hasTotal = mappings.some(m => m.type === 'total');
        const hasInvoiceId = mappings.some(m => m.type === 'invoice_id');

        if (!hasTotal || !hasInvoiceId) {
            alert('You must map "Total Sum" and "Invoice ID" cells before saving.');
            return;
        }

        await onSave({ mappings });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="setup-modal-overlay" onClick={onClose}>
            <div className="setup-modal-container" onClick={e => e.stopPropagation()}>
                <div className="setup-modal-header">
                    <h2>App Setup</h2>
                    <button className="setup-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="setup-modal-body">
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
                        Configure which cells in your invoice are editable or contain key data.
                        <strong> Total Sum</strong> and <strong>Invoice ID</strong> are required.
                    </p>

                    <div className="setup-section-title">Current Mappings</div>

                    <div className="mappings-list">
                        {mappings.length === 0 && (
                            <div className="mapping-item" style={{ justifyContent: 'center', color: '#999', fontStyle: 'italic' }}>
                                No mappings configured yet.
                            </div>
                        )}
                        {mappings.map(mapping => (
                            <div key={mapping.id} className={`mapping-item ${COMPULSORY_TYPES.includes(mapping.type) ? 'compulsory' : ''}`}>
                                <div className="mapping-info">
                                    <span className="mapping-type-badge">{mapping.type.replace('_', ' ')}</span>
                                    <span className="mapping-label">{mapping.label}</span>
                                    <span className="mapping-cell">{mapping.cell}</span>
                                </div>
                                <div className="mapping-actions">
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteMapping(mapping.id, mapping.type)}
                                        title="Remove mapping"
                                    >
                                        &times; {/* Cross icon */}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="setup-section-title">Add New Mapping</div>
                    <div className="add-mapping-form">
                        <div className="form-group flex-1">
                            <label>Label</label>
                            <input
                                type="text"
                                placeholder="e.g. Client Name"
                                value={newLabel}
                                onChange={e => setNewLabel(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ width: '100px' }}>
                            <label>Cell</label>
                            <input
                                type="text"
                                placeholder="A1"
                                value={newCell}
                                onChange={e => setNewCell(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ width: '140px' }}>
                            <label>Type</label>
                            <select
                                value={newType}
                                onChange={e => setNewType(e.target.value as any)}
                            >
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="table">Table (Items)</option>
                                <option value="total">Total Sum</option>
                                <option value="invoice_id">Invoice ID</option>
                            </select>
                        </div>
                        <button
                            className="add-btn"
                            onClick={handleAddMapping}
                            disabled={!newLabel || !newCell}
                        >
                            Add
                        </button>
                    </div>

                </div>

                <div className="setup-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="save-btn" onClick={handleSave}>Save Setup</button>
                </div>
            </div>
        </div>
    );
};
