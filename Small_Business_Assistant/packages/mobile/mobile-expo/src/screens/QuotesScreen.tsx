import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const QuotesScreen = () => {
  const quotes = [
    {
      id: 1,
      title: 'Kitchen Remodel',
      client: 'John Smith',
      status: 'Pending',
      amount: '$8,500',
      date: 'Dec 15, 2024',
      validUntil: 'Jan 15, 2025'
    },
    {
      id: 2,
      title: 'Bathroom Update',
      client: 'Sarah Johnson',
      status: 'Approved',
      amount: '$3,200',
      date: 'Dec 10, 2024',
      validUntil: 'Jan 10, 2025'
    },
    {
      id: 3,
      title: 'Deck Installation',
      client: 'Mike Davis',
      status: 'Expired',
      amount: '$5,800',
      date: 'Nov 20, 2024',
      validUntil: 'Dec 20, 2024'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return { bg: '#D1FAE5', text: '#065F46' };
      case 'Pending': return { bg: '#FEF3C7', text: '#92400E' };
      case 'Expired': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quotes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New Quote</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {quotes.map((quote) => {
          const statusColors = getStatusColor(quote.status);
          return (
            <TouchableOpacity key={quote.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <Text style={styles.quoteTitle}>{quote.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors.text }]}>
                    {quote.status}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.quoteClient}>{quote.client}</Text>
              
              <View style={styles.quoteAmount}>
                <Text style={styles.amountText}>{quote.amount}</Text>
              </View>

              <View style={styles.quoteDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>{quote.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valid Until:</Text>
                  <Text style={styles.detailValue}>{quote.validUntil}</Text>
                </View>
              </View>

              <View style={styles.quoteActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Text style={styles.primaryButtonText}>Send to Client</Text>
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
  quoteCard: {
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
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteTitle: {
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
  quoteClient: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  quoteAmount: {
    marginBottom: 16,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  quoteDetails: {
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
  quoteActions: {
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

export default QuotesScreen; 