import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { validatePassword } from "@/lib/passwordPolicy";
import type { DoctorStatus, Profile, UserRole } from "@shared/schema";

export type AuthProfile = Profile & {
  profileImageUrl?: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  licenseNumber?: string;
  specialty?: string;
  role: Exclude<UserRole, "admin">;
};

type SignUpProfilePayload = Omit<SignUpPayload, "password">;

export type SignUpResult = {
  requiresEmailConfirmation: boolean;
  status: DoctorStatus;
};

type AuthState = {
  user: AuthProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  // True when there's a valid auth session (e.g. just signed in with Google)
  // but no app profile row yet — the user must pick a role and finish setup.
  needsProfile: boolean;
  pendingProfile: { email: string; name: string } | null;
  lastError: string | null;
  role: UserRole | null;
  doctorStatus: DoctorStatus | null;
};

const PENDING_SIGNUP_PROFILE_PREFIX = "aeye:pending-signup-profile";

function mapAuthUser(user: User | null): { id: string; email?: string; metadata: Record<string, any> } | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? undefined,
    metadata,
  };
}

async function fetchProfile(userId?: string): Promise<AuthProfile | null> {
  if (!userId) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    status: data.status,
    name: data.name,
    phone: data.phone ?? undefined,
    dateOfBirth: data.date_of_birth ?? undefined,
    gender: data.gender ?? undefined,
    address: data.address ?? undefined,
    licenseNumber: data.license_number ?? undefined,
    specialty: data.specialty ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as AuthProfile;
}

function statusForRole(role: Exclude<UserRole, "admin">): DoctorStatus {
  return role === "doctor" ? "pending" : "approved";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isSignupRole(value: unknown): value is Exclude<UserRole, "admin"> {
  return value === "patient" || value === "doctor";
}

function normalizeProfilePayload(value: unknown): SignUpProfilePayload | null {
  const raw = value as Partial<SignUpProfilePayload> | null;
  const email = optionalString(raw?.email);
  const name = optionalString(raw?.name);

  if (!email || !name || !isSignupRole(raw?.role)) {
    return null;
  }

  return {
    email,
    role: raw.role,
    name,
    phone: optionalString(raw.phone),
    dateOfBirth: optionalString(raw.dateOfBirth),
    gender: optionalString(raw.gender),
    address: optionalString(raw.address),
    licenseNumber: optionalString(raw.licenseNumber),
    specialty: optionalString(raw.specialty),
  };
}

function pendingProfileKey(email: string) {
  return `${PENDING_SIGNUP_PROFILE_PREFIX}:${email.trim().toLowerCase()}`;
}

function savePendingProfile(payload: SignUpProfilePayload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(pendingProfileKey(payload.email), JSON.stringify(payload));
  } catch (_) {
    // localStorage can be unavailable in private/restricted browser modes.
  }
}

function readPendingProfile(email?: string): SignUpProfilePayload | null {
  if (!email || typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(pendingProfileKey(email));
    return stored ? normalizeProfilePayload(JSON.parse(stored)) : null;
  } catch (_) {
    return null;
  }
}

function clearPendingProfile(email?: string) {
  if (!email || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(pendingProfileKey(email));
  } catch (_) {}
}

function profilePayloadFromAuthUser(user: User): SignUpProfilePayload | null {
  return normalizeProfilePayload({
    ...(user.user_metadata ?? {}),
    email: user.email,
  });
}

async function upsertProfile(userId: string, payload: SignUpProfilePayload): Promise<DoctorStatus> {
  const status = statusForRole(payload.role);
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: payload.role,
      status,
      email: payload.email,
      name: payload.name,
      phone: payload.phone ?? null,
      date_of_birth: payload.dateOfBirth ?? null,
      gender: payload.gender ?? null,
      address: payload.address ?? null,
      license_number: payload.licenseNumber ?? null,
      specialty: payload.specialty ?? null,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message || "Failed to create profile");
  }

  return status;
}

async function ensureProfileForAuthUser(authUser: User | null): Promise<AuthProfile | null> {
  const mappedAuthUser = mapAuthUser(authUser);
  if (!authUser || !mappedAuthUser) return null;

  const existingProfile = await fetchProfile(authUser.id);
  if (existingProfile) {
    return {
      ...existingProfile,
      email: existingProfile.email ?? mappedAuthUser.email,
      profileImageUrl: mappedAuthUser.metadata?.avatar_url,
    };
  }

  const pendingPayload = profilePayloadFromAuthUser(authUser) ?? readPendingProfile(authUser.email ?? undefined);
  if (!pendingPayload) {
    return null;
  }

  await upsertProfile(authUser.id, pendingPayload);
  clearPendingProfile(pendingPayload.email);

  const createdProfile = await fetchProfile(authUser.id);
  if (!createdProfile) return null;

  return {
    ...createdProfile,
    email: createdProfile.email ?? mappedAuthUser.email,
    profileImageUrl: mappedAuthUser.metadata?.avatar_url,
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInitialUser = async () => {
      setIsLoading(true);
      setLastError(null);
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (error) {
        // "Auth session missing" is expected when no user is signed in, not an error to surface.
        if (!error.message.toLowerCase().includes("session missing")) {
          setLastError(error.message);
        }
        setUser(null);
      } else {
        try {
          const profile = await ensureProfileForAuthUser(data.user ?? null);
          if (profile) {
            setUser(profile);
            setNeedsProfile(false);
            setPendingAuthUser(null);
          } else if (data.user) {
            // Authenticated (e.g. via Google) but no profile yet → onboarding.
            setUser(null);
            setNeedsProfile(true);
            setPendingAuthUser(data.user);
          } else {
            setUser(null);
            setNeedsProfile(false);
            setPendingAuthUser(null);
          }
        } catch (profileError: any) {
          setLastError(profileError.message ?? "Failed to load profile");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      (async () => {
        if (!isMounted) return;
        if (!session?.user) {
          setUser(null);
          setNeedsProfile(false);
          setPendingAuthUser(null);
          setIsLoading(false);
          return;
        }

        try {
          const profile = await ensureProfileForAuthUser(session.user);
          if (profile) {
            setUser(profile);
            setNeedsProfile(false);
            setPendingAuthUser(null);
          } else {
            setUser(null);
            setNeedsProfile(true);
            setPendingAuthUser(session.user);
          }
        } catch (profileError: any) {
          setLastError(profileError.message ?? "Failed to load profile");
          setUser(null);
        }

        setIsLoading(false);
      })();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setLastError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsLoading(false);
      setLastError(error.message);
      throw error;
    }

    try {
      const profile = await ensureProfileForAuthUser(data.user);
      if (!profile) {
        throw new Error("Your account profile is missing. Please contact support or create the account again.");
      }
      setUser(profile);
    } catch (profileError: any) {
      setLastError(profileError.message ?? "Failed to load profile");
      setUser(null);
      setIsLoading(false);
      throw profileError;
    }

    setIsLoading(false);
    return data;
  }, []);

  const signUpWithPassword = useCallback(
    async (payload: SignUpPayload): Promise<SignUpResult> => {
      const { email, password, role, ...profileData } = payload;
      setIsLoading(true);
      setLastError(null);

      const passwordError = validatePassword(password);
      if (passwordError) {
        setIsLoading(false);
        setLastError(passwordError);
        throw new Error(passwordError);
      }

      const profilePayload = normalizeProfilePayload({
        ...profileData,
        email,
        role,
      });

      if (!profilePayload) {
        const message = "Please complete all required sign-up fields.";
        setIsLoading(false);
        setLastError(message);
        throw new Error(message);
      }

      savePendingProfile(profilePayload);

      const { data, error } = await supabase.auth.signUp({
        email: profilePayload.email,
        password,
        options: {
          data: profilePayload,
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        setIsLoading(false);
        setLastError(error.message);
        throw error;
      }

      const userId = data.user?.id;
      const accessToken = data.session?.access_token;
      if (!userId || !accessToken) {
        setUser(null);
        setIsLoading(false);
        return {
          requiresEmailConfirmation: true,
          status: statusForRole(profilePayload.role),
        };
      }

      try {
        await upsertProfile(userId, profilePayload);
        clearPendingProfile(profilePayload.email);

        const profile = await ensureProfileForAuthUser(data.user);
        if (!profile) {
          throw new Error("Profile was created, but could not be loaded.");
        }
        setUser(profile);
      } catch (profileError: any) {
        setLastError(profileError.message ?? "Failed to load profile");
        setUser(null);
        setIsLoading(false);
        throw profileError;
      }

      setIsLoading(false);
      return {
        requiresEmailConfirmation: false,
        status: statusForRole(profilePayload.role),
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setLastError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLastError(error.message);
        setIsLoading(false);
        throw error;
      }
      setUser(null);
      setIsLoading(false);
      // Redirect to homepage after logout
      window.location.href = "/";
    } catch (error: any) {
      setLastError(error.message ?? "Failed to sign out");
      setIsLoading(false);
      throw error;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) throw new Error("Please enter your email address.");
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const passwordError = validatePassword(newPassword);
    if (passwordError) throw new Error(passwordError);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    setIsPasswordRecovery(false);
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) throw new Error("Please enter your email address first.");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLastError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setLastError(error.message);
      throw error;
    }
  }, []);

  // Called from the "complete your profile" screen after an OAuth sign-in that
  // has a session but no app profile yet (role isn't known from Google).
  const completeProfile = useCallback(async (payload: Omit<SignUpProfilePayload, "email"> & { email?: string }) => {
    setLastError(null);
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;
    if (!authUser) throw new Error("Your session expired. Please sign in again.");

    const normalized = normalizeProfilePayload({ ...payload, email: payload.email ?? authUser.email });
    if (!normalized) throw new Error("Please complete all required fields.");

    await upsertProfile(authUser.id, normalized);
    const profile = await ensureProfileForAuthUser(authUser);
    if (!profile) throw new Error("Profile was saved but could not be loaded.");

    setUser(profile);
    setNeedsProfile(false);
    setPendingAuthUser(null);
    return profile;
  }, []);

  const state: AuthState = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isPasswordRecovery,
      needsProfile,
      pendingProfile: pendingAuthUser
        ? {
            email: pendingAuthUser.email ?? "",
            name:
              (pendingAuthUser.user_metadata?.full_name as string) ??
              (pendingAuthUser.user_metadata?.name as string) ??
              "",
          }
        : null,
      lastError,
      role: user?.role ?? null,
      doctorStatus: user?.status ?? null,
    }),
    [user, isLoading, isPasswordRecovery, needsProfile, pendingAuthUser, lastError],
  );

  return {
    ...state,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    completeProfile,
    signOut,
    requestPasswordReset,
    updatePassword,
    resendVerificationEmail,
  };
}
