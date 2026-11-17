# ui

The design system: shadcn/ui components restyled with Kotsu's tokens, icons, the font and the theme. No product
words or rules: a component that knows about shelves or cards belongs to a module.

Components are built on Radix primitives (`radix-ui`), toasts on Sonner, the command palette's list on cmdk, with
variants through `cva` and classes merged by `cn`. A compound component (Select, Dialog, DropdownMenu) exports its
parts from one file, as shadcn/ui does; Drawer and the command palette are a Dialog with their own content, so they
take Dialog's other parts.

The app's frame lives here too: the sidebar (`sidebar.tsx`: open or closed by its button or ⌘\ / Ctrl+\, the
choice kept in the `sidebar` cookie from `sidebar-cookie.ts`, which the layout reads for the first paint; closed,
it slides in from the left edge under the pointer), the page header with the button that opens it again, and the
tab bar (`tab-bar.tsx`) that takes the sidebar's place below the `md` breakpoint. Toasts rise above the tab bar
through `--tab-bar-inset` from `theme.css`, its height plus the bottom safe area, `0px` on wide screens. The ⌘K
palette (`command-palette.tsx`) is part of the frame too: its search field sits in the sidebar, ⌘K / Ctrl+K toggles it
from anywhere, and the layout fills it with items that close it as they run (`CommandPaletteLink` goes to a page).
`ToggleThemeCommand` flips the theme there and keeps the pick in the `theme` cookie from `theme-cookie.ts`, which the
root layout reads for the first paint. What counts as a shortcut press and whether to show ⌘ or Ctrl lives in
`shortcut.ts`.

Every component has a `*.stories.tsx` next to it; `pnpm storybook` shows them, with the tokens and icons
under Foundations. Its behaviour (keyboard, focus, disabled) is tested in the stories' `play` functions.

Imports only from `src/ui` and `src/lib`.
