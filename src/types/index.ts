export interface Profile {
  id: string;
  name: string;
  gender: string | null;
  gender_probability: number | null;
  age: number | null;
  age_group: string | null;
  country_id: string | null;
  country_name: string | null;
  country_probability: number | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  status: string;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  links: {
    self: string;
    next: string | null;
    prev: string | null;
  };
  data: T[];
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface User {
  id: string;
  github_id: string;
  username: string;
  email: string;
  avatar_url: string;
  role: "admin" | "analyst";
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

export interface TokenResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  username?: string;
}