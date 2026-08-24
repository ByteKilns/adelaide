// Shared between src/app/(app)/layout.tsx (reads it, server-side, to avoid a
// flash of the wrong sidebar width) and SidebarNav (writes it, client-side —
// this is a pure UI preference with no sensitive content, so it's set
// directly via document.cookie rather than a server action).
export const SIDEBAR_COLLAPSED_COOKIE_NAME = "sidebar-collapsed";
