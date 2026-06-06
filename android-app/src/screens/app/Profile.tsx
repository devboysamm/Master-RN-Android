// PLACEHOLDER for the Profile tab. The real profile (guest hero, account, edit,
// delete) is its own later task; this only exists so the tab bar is fully
// functional.
import React from 'react';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { I } from '../../theme/icons';

export default function Profile() {
  return (
    <PlaceholderScreen
      title="Profile"
      subtitle="Guest"
      emptyIcon={I.user}
      emptyTitle="You're browsing as a guest"
      emptySub="Sign up to save your progress and bookmarks."
    />
  );
}
