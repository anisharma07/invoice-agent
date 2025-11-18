import React, { useEffect, useRef } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText } from '@ionic/react';
import * as AppGeneral from '../socialcalc/index.js';
import './MSCPreview.css';

interface MSCPreviewProps {
    mscData: any;
    title?: string;
}

const MSCPreview: React.FC<MSCPreviewProps> = ({ mscData, title = 'Invoice Preview' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        console.log('🔍 MSCPreview useEffect triggered');
        console.log('📦 Received mscData:', JSON.stringify(mscData));
        console.log('📦 mscData type:', typeof mscData);
        console.log('📦 mscData is null/undefined:', mscData === null || mscData === undefined);
        console.log('📦 containerRef.current:', containerRef.current);

        if (mscData) {
            console.log('📊 mscData structure:', {
                numsheets: mscData.numsheets,
                currentid: mscData.currentid,
                currentname: mscData.currentname,
                hasSheetArr: !!mscData.sheetArr,
                sheetArrKeys: mscData.sheetArr ? Object.keys(mscData.sheetArr) : [],
            });

            if (mscData.sheetArr) {
                Object.entries(mscData.sheetArr).forEach(([key, sheet]: [string, any]) => {
                    console.log(`📄 Sheet "${key}":`, {
                        name: sheet.name,
                        hidden: sheet.hidden,
                        hasSheetstr: !!sheet.sheetstr,
                        hasSavestr: !!sheet.sheetstr?.savestr,
                        savestrLength: sheet.sheetstr?.savestr?.length || 0,
                        savestrPreview: sheet.sheetstr?.savestr?.substring(0, 200) || 'N/A'
                    });
                });
            }
        }

        // Wait for DOM to be ready, then initialize
        if (mscData) {
            console.log('⏱️ Using setTimeout to ensure DOM is ready');
            const timeoutId = setTimeout(() => {
                console.log('⏱️ Timeout fired, checking DOM elements...');
                const containerElement = document.getElementById('container');
                const workbookControl = document.getElementById('workbookControl');
                const tableeditor = document.getElementById('tableeditor');
                const msg = document.getElementById('msg');

                console.log('📍 DOM Elements check:', {
                    container: !!containerElement,
                    workbookControl: !!workbookControl,
                    tableeditor: !!tableeditor,
                    msg: !!msg,
                });

                if (containerElement && workbookControl && tableeditor && msg) {
                    console.log('🎨 DOM is ready, initializing MSC Preview with data');
                    try {
                        const stringifiedData = JSON.stringify(mscData);
                        console.log('📝 Stringified mscData length:', stringifiedData.length);
                        console.log('📝 Stringified mscData preview:', stringifiedData.substring(0, 500));
                        console.log('🚀 Calling AppGeneral.initializeApp...');

                        AppGeneral.initializeApp(stringifiedData);
                        initializedRef.current = true;
                        console.log('✅ MSC Preview initialized successfully');
                    } catch (error) {
                        console.error('❌ Error initializing MSC Preview:', error);
                        console.error('❌ Error details:', {
                            message: error instanceof Error ? error.message : 'Unknown error',
                            stack: error instanceof Error ? error.stack : 'No stack trace',
                        });
                    }
                } else {
                    console.error('❌ DOM elements not found even after timeout!');
                }
            }, 100); // Give DOM time to render

            return () => {
                console.log('🧹 Cleaning up MSC Preview');
                clearTimeout(timeoutId);
                initializedRef.current = false;
            };
        } else {
            console.warn('⚠️ MSC Preview: mscData is null or undefined');
        }
    }, [mscData]);

    return (
        <IonCard className="msc-preview-card">
            {title && (
                <IonCardHeader style={{ padding: '8px 16px' }}>
                    <IonCardTitle style={{ fontSize: '14px', fontWeight: 300, color: 'var(--ion-color-medium)' }}>
                        {title}
                    </IonCardTitle>
                </IonCardHeader>
            )}
            <IonCardContent>


                <div id="container">
                    <div id="workbookControl"></div>
                    <div id="tableeditor"></div>
                    <div id="msg"></div>
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default MSCPreview;
