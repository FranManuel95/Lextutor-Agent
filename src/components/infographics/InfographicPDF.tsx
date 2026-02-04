import React from 'react';
import { Document, Page, Image, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 0,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: 'grey',
    }
});

interface InfographicPDFProps {
    imageUrl: string;
    topic: string;
}

export const InfographicPDF = ({ imageUrl, topic }: InfographicPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                {/* The Image is the main content */}
                {/* Using raw Base64 string directly */}
                <Image src={imageUrl} style={styles.image} />
            </View>
            <Text style={styles.footer}>
                Generado por LexTutor AI - {new Date().toLocaleDateString()}
            </Text>
        </Page>
    </Document>
);
