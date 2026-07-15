import { StyleSheet } from 'react-native';
import { brand } from '@/constants/theme';

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: brand.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.orange,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 12,
    color: brand.textTertiary,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: brand.textTertiary,
    letterSpacing: 1.5,
  },
  orderValue: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.orange,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: brand.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  toggleBtnActive: {
    backgroundColor: brand.orange,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.textTertiary,
    letterSpacing: 0.5,
  },
  toggleBtnTextActive: {
    color: '#000',
  },
});
