// PLACEHOLDER for the Chat tab ("Native AI"). The real chat (gated behind
// sign-in for guests) is its own later task; this only exists so the tab bar is
// fully functional.
import React from 'react';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { I } from '../../theme/icons';

export default function AIChat() {
  return (
    <PlaceholderScreen
      title="Native AI"
      subtitle="Your React Native tutor"
      emptyIcon={I.sparkle}
      emptyTitle="Ask Native AI"
      emptySub="Sign in to chat with the AI tutor."
    />
  );
}
