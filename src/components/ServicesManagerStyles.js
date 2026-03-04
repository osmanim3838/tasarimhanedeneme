/**
 * ServicesManager Styles
 * Extracted from OwnerDashboardScreen for reusability
 */

import { StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default StyleSheet.create({
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addServiceBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  addServiceBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  expandServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandServicesBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  servicesListContainer: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    padding: 12,
  },
  serviceCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  serviceCardMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
