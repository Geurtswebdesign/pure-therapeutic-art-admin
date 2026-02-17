export type UserProfile = {
  display_name: string | null;
  role: "user" | "admin";
  bio?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};