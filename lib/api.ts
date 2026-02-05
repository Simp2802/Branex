import type {
  ApiResponse,
  AuthResponse,
  AgencyProfile,
  MatchResult,
  SignupRequest,
  LoginRequest,
  AgencyFilterParams,
  StartupPreferences,
} from "@/types";

const API_BASE = "/api";

// Get auth token from localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

// Set auth token
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

// Clear auth token
export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

// Base fetch helper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error occurred",
      },
    };
  }
}

// Auth API
export async function signup(data: SignupRequest): Promise<ApiResponse<AuthResponse>> {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Agencies API
interface AgenciesListResponse {
  agencies: AgencyProfile[];
  total: number;
  filters: AgencyFilterParams;
}

export async function getAgencies(
  filters?: AgencyFilterParams
): Promise<ApiResponse<AgenciesListResponse>> {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }
  
  const queryString = params.toString();
  const endpoint = queryString ? `/agencies?${queryString}` : "/agencies";
  
  return apiFetch<AgenciesListResponse>(endpoint);
}

export async function getAgency(id: string): Promise<ApiResponse<AgencyProfile>> {
  return apiFetch<AgencyProfile>(`/agencies/${id}`);
}

// Match API
interface MatchResponse {
  matches: MatchResult[];
  total_matches: number;
  preferences_used: StartupPreferences;
}

export async function findMatches(
  preferences: StartupPreferences & { minScore?: number; limit?: number }
): Promise<ApiResponse<MatchResponse>> {
  return apiFetch<MatchResponse>("/match", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
}
