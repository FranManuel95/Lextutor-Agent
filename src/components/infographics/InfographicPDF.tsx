"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { type InfographicContent } from "@/lib/imagen-service";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f5e6c8",
    padding: 28,
    fontFamily: "Helvetica",
  },
  brandTag: {
    fontSize: 7,
    color: "#6b4a10",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  titleBox: {
    border: "1.5pt dashed #8B6914",
    backgroundColor: "#fdf3dc",
    padding: 10,
    marginBottom: 12,
    borderRadius: 2,
  },
  titleText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#3d2b00",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  divider: {
    borderTop: "0.5pt dashed #8B6914",
    marginBottom: 10,
    opacity: 0.5,
  },
  sectionBox: {
    border: "0.75pt solid #b8924a",
    backgroundColor: "#ffffffa0",
    padding: 8,
    marginBottom: 8,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#7a5210",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
    borderBottom: "0.5pt solid #b8924a40",
    paddingBottom: 3,
  },
  sectionContent: {
    fontSize: 9,
    color: "#2d1a00",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 10,
    borderTop: "0.75pt dashed #8B6914",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#7a5210",
    textAlign: "center",
    fontStyle: "italic",
  },
  footerBrand: {
    fontSize: 6,
    color: "#7a521060",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 3,
  },
});

interface Props {
  content: InfographicContent;
}

export function InfographicPDF({ content }: Props) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.brandTag}>LexTutor Agent</Text>

        <View style={styles.titleBox}>
          <Text style={styles.titleText}>{content.topic}</Text>
        </View>

        <View style={styles.divider} />

        {content.sections.map((section, i) => (
          <View key={i} style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{content.footer_context}</Text>
          <Text style={styles.footerBrand}>Estudiante Elite · LexTutor AI</Text>
        </View>
      </Page>
    </Document>
  );
}
