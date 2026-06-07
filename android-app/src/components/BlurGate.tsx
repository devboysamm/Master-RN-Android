import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Icon from './Icon';
import PillButton from './PillButton';
import { I } from '../theme/icons';
import { colors, radii, spacing, type } from '../theme/tokens';
import { font } from '../theme/fonts';
import { useAuth } from '../context/AuthContext';

const DEFAULT_TITLE = 'Continue learning with a free account';
const DEFAULT_SUBTITLE = 'Sign in or register to unlock all modules and lessons.';

type CardProps = { title?: string; subtitle?: string; onDismiss?: () => void };

// Shared sign-in card. The reference fades + scales it in via reanimated; that
// animation is deferred (the card is presented inside Modal's fade instead).
function GateCard({ title, subtitle, onDismiss }: CardProps) {
  const { requestAuth } = useAuth();
  return (
    <View style={styles.card}>
      <View style={styles.iconRing}>
        <Icon d={I.shield} size={28} color={colors.white} strokeWidth={2.2} />
      </View>
      <Text style={styles.head}>{title ?? DEFAULT_TITLE}</Text>
      <Text style={styles.sub}>{subtitle ?? DEFAULT_SUBTITLE}</Text>
      {/* Route into the real auth flow (clears guest → RootStack shows Auth). */}
      <PillButton variant="primary" onPress={() => requestAuth('signup')} style={styles.cta}>
        Sign in or Register
      </PillButton>
      <Pressable
        onPress={() => onDismiss?.()}
        accessibilityRole="button"
        accessibilityLabel="Not now"
        hitSlop={8}
        style={({ pressed }) => [styles.notNow, pressed && { opacity: 0.6 }]}>
        <Text style={styles.notNowText}>Not now</Text>
      </Pressable>
    </View>
  );
}

/**
 * Tap-to-show popup with the sign-in card. Used when a guest taps a locked
 * lesson, or tries to bookmark while signed out. The dark scrim sits behind the
 * card; Modal handles the fade.
 */
export function GatePopup({
  visible,
  onClose,
  title,
  subtitle,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      </View>
      <View style={styles.modalCenter} pointerEvents="box-none">
        <GateCard title={title} subtitle={subtitle} onDismiss={onClose} />
      </View>
    </Modal>
  );
}

/**
 * Full-screen gate: renders children, then a near-opaque cream overlay with the
 * sign-in card centered on top, so gated content never reads as a blank screen.
 * (The reference fades the overlay in via reanimated; static here.) Only reached
 * if a locked lesson is opened directly — unlocked lessons never gate.
 */
export default function BlurGate({ children, onDismiss }: { children: React.ReactNode; onDismiss?: () => void }) {
  return (
    <View style={styles.fullWrap}>
      {children}
      <View style={styles.fullOverlay}>
        <View style={styles.fullCenter}>
          <GateCard onDismiss={onDismiss} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullWrap: { flex: 1 },
  fullOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(245,239,230,0.94)' },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,19,17,0.55)' },
  modalCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radii['4xl'],
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: spacing[7],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    shadowColor: colors.coral,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  head: {
    color: colors.ink,
    fontFamily: font('800'),
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  sub: {
    color: colors.mute,
    fontFamily: font('500'),
    fontSize: type.size.base,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing[2.5],
    paddingHorizontal: spacing[2],
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing[6],
  },
  notNow: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  notNowText: {
    color: colors.mute,
    fontFamily: font('700'),
    fontSize: type.size.sm,
  },
});
