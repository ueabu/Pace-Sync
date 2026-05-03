"use client";

import type { CourseProfile } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CourseProfileContextValue = {
  profile: CourseProfile | null;
  setCourseProfile: (p: CourseProfile | null) => void;
};

const CourseProfileContext = createContext<CourseProfileContextValue | null>(
  null
);

export function CourseProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CourseProfile | null>(null);
  const setCourseProfile = useCallback((p: CourseProfile | null) => {
    setProfile(p);
  }, []);

  const value = useMemo(
    () => ({ profile, setCourseProfile }),
    [profile, setCourseProfile]
  );

  return (
    <CourseProfileContext.Provider value={value}>
      {children}
    </CourseProfileContext.Provider>
  );
}

export function useCourseProfileOptional(): CourseProfileContextValue | null {
  return useContext(CourseProfileContext);
}

export function useCourseProfile(): CourseProfileContextValue {
  const ctx = useContext(CourseProfileContext);
  if (!ctx) {
    throw new Error(
      "useCourseProfile requires CourseProfileProvider (optional feature)."
    );
  }
  return ctx;
}
