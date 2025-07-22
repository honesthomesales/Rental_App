import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InvoicesScreen = () => {
  const invoices = [
    {
      id: 1,
      title: 'Kitchen Remodel',
      client: 'John Smith',
      status: 'Paid',
      amount: '$8,500',
      date: 'Dec 15, 2024',
      dueDate: 'Jan 15, 2025'
    },
    {
      id: 2,
      title: 'Bathroom Update',
      client: 'Sarah Johnson',
      status: 'Overdue',
      amount: '$3,200',
      date: 'Dec 10, 2024',
      dueDate: 'Jan 10, 2025'
    },
    {
      id: 3,
      title: 'Deck Installation',
      client: 'Mike Davis',
      status: 'Pending',
      amount: '$5,800',
      date: 'Dec 20, 2024',
      dueDate: 'Jan 20, 2025'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return { bg: '#D1FAE5', text: '#065F46' };
      case 'Pending': return { bg: '#FEF3C7', text: '#92400E' };
      case 'Overdue': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New Invoice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {invoices.map((invoice) => {
          const statusColors = getStatusColor(invoice.status);
          return (
            <TouchableOpacity key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceTitle}>{invoice.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors.text }]}>
                    {invoice.status}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.invoiceClient}>{invoice.client}</Text>
              
              <View style={styles.invoiceAmount}>
                <Text style={styles.amountText}>{invoice.amount}</Text>
              </View>

              <View style={styles.invoiceDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issued:</Text>
                  <Text style={styles.detailValue}>{invoice.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due:</Text>
                  <Text style={styles.detailValue}>{invoice.dueDate}</Text>
                </View>
              </View>

              <View style={styles.invoiceActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Text style={styles.primaryButtonText}>Send Reminder</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceClient: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  invoiceAmount: {
    marginBottom: 16,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InvoicesScreen; 