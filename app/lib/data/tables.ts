// Table IDs as provisioned by scripts/provision-appwrite.ts.
export const TABLES = {
  roles: "roles",
  permissions: "permissions",
  rolesPermissions: "roles_permissions",
  rooms: "rooms",
  artworks: "artworks",
  artists: "artists",
  artistsArtworks: "artists_artworks",
  passwords: "passwords",
  verificationTokens: "verification_tokens",
  comments: "comments",
  follows: "follows",
  likes: "likes",
} as const;
