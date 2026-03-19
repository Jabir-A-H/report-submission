'use client'

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #0891b2',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 8,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 4,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f9fafb',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: 'center',
    color: '#9ca3af',
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 10,
  }
});

interface CityReportPDFProps {
  data: any[];
  period: string;
}

export const CityReportPDF = ({ data, period }: CityReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>City Aggregation Report</Text>
        <Text style={styles.subtitle}>Talimul Quran Report Submission System • {period}</Text>
      </View>

      <Text style={styles.sectionTitle}>Course Statistics (Consolidated)</Text>
      
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableRow}>
          <View style={[styles.tableColHeader, { width: '40%' }]}>
            <Text style={styles.tableCellHeader}>Category</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Centers</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Students</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Attendance</Text>
          </View>
        </View>

        {/* Rows */}
        {data.map((row, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={[styles.tableCol, { width: '40%' }]}>
              <Text style={styles.tableCell}>{row.category}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.number}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.students}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.attendance}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Generated on {new Date().toLocaleDateString()} • System Confidential
      </Text>
    </Page>
  </Document>
);
