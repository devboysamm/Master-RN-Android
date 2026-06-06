import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PillButton from './PillButton';
import { colors } from '../theme/tokens';
import { font } from '../theme/fonts';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({ message = "Couldn't load content.", onRetry }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.sub}>Check your connection and try again.</Text>
      {onRetry && (
        <View style={{ marginTop: 14, width: 180 }}>
          <PillButton onPress={onRetry}>Retry</PillButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 30, alignItems: 'center' },
  title: { fontFamily: font('800'), fontSize: 16, color: colors.ink },
  sub: { fontFamily: font('600'), fontSize: 13, color: colors.mute, marginTop: 4 },
});
