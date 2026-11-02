import { Sigma, Dna, Scroll, Laptop, Atom, FlaskConical, Library, BookOpen } from "lucide-react";

// Subject → icon + Glyph tone, shared by Groups, Home tasks and Stats.
const SUBJECTS = {
  Mathematics: { icon: Sigma, tone: "lavender" },
  Math: { icon: Sigma, tone: "lavender" },
  Biology: { icon: Dna, tone: "sage" },
  History: { icon: Scroll, tone: "sunset" },
  "Computer Science": { icon: Laptop, tone: "petal" },
  CS: { icon: Laptop, tone: "petal" },
  Physics: { icon: Atom, tone: "lavender" },
  Chemistry: { icon: FlaskConical, tone: "petal" },
  General: { icon: Library, tone: "butter" },
};

export const DEFAULT_SUBJECT = { icon: BookOpen, tone: "sage" };

export function subjectIcon(subject, fallback = DEFAULT_SUBJECT) {
  return SUBJECTS[subject] || fallback;
}
