// PLACEHOLDER for the Progress tab ("Saved"). The real bookmarks list is its own
// later task; this only exists so the tab bar is fully functional. The empty
// copy matches the reference's guest state.
import React from 'react';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { I } from '../../theme/icons';

export default function Bookmarks() {
  return (
    <PlaceholderScreen
      title="Saved"
      subtitle="Lessons you've bookmarked"
      emptyIcon={I.bookmark}
      emptyTitle="No saved lessons"
      emptySub="Bookmark lessons to find them here."
    />
  );
}
