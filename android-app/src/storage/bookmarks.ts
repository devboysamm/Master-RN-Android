// Phase 2 guest stub: guests have no bookmarks. For a guest the bookmark icon is
// never "saved" (taps route to the sign-in gate instead), so nothing is read or
// written here. Real on-device persistence (AsyncStorage) lands in a later phase.

export function useBookmarks() {
  return {
    bookmarks: [] as number[],
    isBookmarked: (_id: number) => false,
    toggleBookmark: (_id: number) => {},
  };
}
