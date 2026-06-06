// PLACEHOLDER for the Explore tab ("Learning Path"). The real all-modules list
// is its own later task; this only exists so the tab bar is fully functional.
import React from 'react';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { I } from '../../theme/icons';

export default function Modules() {
  return (
    <PlaceholderScreen
      title="Learning Path"
      subtitle="All 17 modules"
      emptyIcon={I.layers}
      emptyTitle="Modules list coming soon"
      emptySub="The full learning path will live here."
    />
  );
}
