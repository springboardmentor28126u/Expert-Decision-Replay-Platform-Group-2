export interface User {
  id: string;
  full_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  role?: Role;
  team?: Team;
  profile?: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
