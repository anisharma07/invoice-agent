import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonNote,
    IonBadge
} from '@ionic/react';
import { add, trash, createOutline, close, pricetagOutline, documentTextOutline, calculatorOutline } from 'ionicons/icons';

export interface ServiceItem {
    id: string;
    name: string;
    price: number;
    gst?: number;
    description?: string;
}

const ServiceManager: React.FC = () => {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState<number | string>('');
    const [gst, setGst] = useState<number | string>('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        const savedServices = localStorage.getItem('userServices');
        if (savedServices) {
            try {
                setServices(JSON.parse(savedServices));
            } catch (e) {
                console.error('Error parsing services', e);
            }
        }
    }, []);

    const saveServices = (newServices: ServiceItem[]) => {
        setServices(newServices);
        localStorage.setItem('userServices', JSON.stringify(newServices));
    };

    const handleSave = () => {
        if (!name || !price) return;

        const newItem: ServiceItem = {
            id: editingId || Date.now().toString(),
            name,
            price: Number(price),
            gst: gst ? Number(gst) : undefined,
            description
        };

        if (editingId) {
            const updated = services.map(s => s.id === editingId ? newItem : s);
            saveServices(updated);
        } else {
            saveServices([...services, newItem]);
        }

        handleClose();
    };

    const handleEdit = (item: ServiceItem) => {
        setEditingId(item.id);
        setName(item.name);
        setPrice(item.price);
        setGst(item.gst || '');
        setDescription(item.description || '');
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        const updated = services.filter(s => s.id !== id);
        saveServices(updated);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingId(null);
        setName('');
        setPrice('');
        setGst('');
        setDescription('');
    };

    return (
        <div className="service-manager">
            <IonCard className="settings-card-light">
                <IonCardHeader className="settings-card-header-light">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardTitle className="settings-card-title-light">
                            <IonIcon icon={pricetagOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Services & Items
                        </IonCardTitle>
                        <IonButton size="small" fill="outline" onClick={() => setShowModal(true)}>
                            <IonIcon icon={add} slot="start" />
                            Add New
                        </IonButton>
                    </div>
                </IonCardHeader>
                <IonCardContent>
                    {services.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            <p>No services added yet.</p>
                            <p>Add services to quickly use them in your invoices.</p>
                        </div>
                    ) : (
                        <IonList>
                            {services.map(service => (
                                <IonItem key={service.id}>
                                    <IonLabel>
                                        <h2>{service.name}</h2>
                                        <p>{service.description}</p>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                            <IonBadge color="primary">₹{service.price}</IonBadge>
                                            {service.gst && <IonBadge color="secondary">GST: {service.gst}%</IonBadge>}
                                        </div>
                                    </IonLabel>
                                    <IonButtons slot="end">
                                        <IonButton onClick={() => handleEdit(service)}>
                                            <IonIcon icon={createOutline} />
                                        </IonButton>
                                        <IonButton color="danger" onClick={() => handleDelete(service.id)}>
                                            <IonIcon icon={trash} />
                                        </IonButton>
                                    </IonButtons>
                                </IonItem>
                            ))}
                        </IonList>
                    )}
                </IonCardContent>
            </IonCard>

            <IonModal isOpen={showModal} onDidDismiss={handleClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{editingId ? 'Edit Service' : 'Add Service'}</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleClose}>
                                <IonIcon icon={close} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonList>
                        <IonItem>
                            <IonLabel position="stacked">Item/Service Name *</IonLabel>
                            <IonInput
                                value={name}
                                placeholder="e.g. Web Development"
                                onIonChange={e => setName(e.detail.value!)}
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Price (₹) *</IonLabel>
                            <IonInput
                                type="number"
                                value={price}
                                placeholder="0.00"
                                onIonChange={e => setPrice(e.detail.value!)}
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">GST (%) (Optional)</IonLabel>
                            <IonInput
                                type="number"
                                value={gst}
                                placeholder="0"
                                onIonChange={e => setGst(e.detail.value!)}
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Description (Optional)</IonLabel>
                            <IonTextarea
                                value={description}
                                placeholder="Enter details..."
                                onIonChange={e => setDescription(e.detail.value!)}
                                rows={3}
                            />
                        </IonItem>
                    </IonList>
                    <div className="ion-padding">
                        <IonButton expand="block" onClick={handleSave} disabled={!name || !price}>
                            {editingId ? 'Update Service' : 'Save Service'}
                        </IonButton>
                    </div>
                </IonContent>
            </IonModal>
        </div>
    );
};

export default ServiceManager;
