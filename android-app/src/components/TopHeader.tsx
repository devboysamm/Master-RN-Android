import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Icon from './Icon';
import { I } from '../theme/icons';
import { colors } from '../theme/tokens';
import { font } from '../theme/fonts';

type Props = {
  name?: string;
  greeting?: string;
  progress?: number;
  onPressBell?: () => void;
  onPressAvatar?: () => void;
  /** Unread notifications count; shows a badge when > 0 (capped at "9+"). */
  bellBadge?: number;
};

export default function TopHeader({ name = 'John', greeting = 'Welcome back', progress = 0.62, onPressBell, onPressAvatar, bellBadge = 0 }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPressAvatar}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={6}>
        {/* Coral -> yellow gradient ring (SVG, so no expo-linear-gradient needed). */}
        <View style={styles.avatarRing}>
          <Svg style={StyleSheet.absoluteFill} width={44} height={44}>
            <Defs>
              <LinearGradient id="avatarRing" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.coral} />
                <Stop offset="1" stopColor={colors.yellow} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="44" height="44" rx="22" fill="url(#avatarRing)" />
          </Svg>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name[0] || 'J').toUpperCase()}</Text>
          </View>
        </View>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting}, <Text style={styles.name}>{name}</Text>
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <View style={styles.pct}>
            <Text style={styles.pctText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={onPressBell}
        accessibilityRole="button"
        accessibilityLabel={bellBadge > 0 ? `Notifications, ${bellBadge} unread` : 'Notifications'}
        style={styles.bell}>
        <Icon d={I.bell} size={18} color={colors.ink} />
        {bellBadge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{bellBadge > 9 ? '9+' : String(bellBadge)}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontFamily: font('800'), fontSize: 15 },
  greeting: { color: colors.mute, fontFamily: font('700'), fontSize: 12 },
  name: { color: colors.ink, fontFamily: font('800') },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.rule, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.coral, borderRadius: 2 },
  pct: { backgroundColor: colors.coralSoft, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  pctText: { color: colors.coralDeep, fontFamily: font('800'), fontSize: 10 },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Coral count badge at the bell's top-right; cream ring separates it from
  // the icon so it reads cleanly against the header.
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontFamily: font('800'),
    fontSize: 10,
    lineHeight: 12,
  },
});
