"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { TailoredResumeStructured } from "@/types";

// Register built-in Helvetica — no external font fetch needed
Font.registerHyphenationCallback((word) => [word]);

const c = {
  accent: "#4040cf",
  text: "#1a1a2e",
  muted: "#555577",
  rule: "#d0d0e8",
  bg: "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: c.text,
    backgroundColor: c.bg,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
    lineHeight: 1.4,
  },
  // ── Header ──────────────────────────────────────
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: c.accent,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    color: c.muted,
    fontSize: 9,
    marginBottom: 12,
  },
  contactItem: { color: c.muted },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: c.accent,
    marginBottom: 10,
  },
  // ── Section ─────────────────────────────────────
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: c.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 10,
  },
  sectionRule: {
    borderBottomWidth: 0.5,
    borderBottomColor: c.rule,
    marginBottom: 6,
  },
  // ── Summary ─────────────────────────────────────
  summary: { color: c.text, lineHeight: 1.5, marginBottom: 2 },
  // ── Experience ──────────────────────────────────
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  expCompany: { color: c.muted, fontSize: 9, marginBottom: 3 },
  expDates: { color: c.muted, fontSize: 9 },
  bullet: {
    flexDirection: "row",
    marginBottom: 1.5,
    paddingLeft: 2,
  },
  bulletDot: { color: c.accent, marginRight: 5, fontSize: 10 },
  bulletText: { flex: 1, color: c.text },
  expBlock: { marginBottom: 8 },
  // ── Education ───────────────────────────────────
  eduBlock: { marginBottom: 6 },
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  eduDetails: { color: c.muted, fontSize: 9, marginTop: 1 },
  // ── Skills ──────────────────────────────────────
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  skillChip: {
    backgroundColor: "#eeeef8",
    color: c.accent,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 9,
  },
});

interface Props {
  resume: TailoredResumeStructured;
}

export default function ResumePDF({ resume }: Props) {
  const { name, contact, summary, experience, education, skills, certifications } = resume;

  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.website,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* ── Header ── */}
        <Text style={s.name}>{name}</Text>
        {contactParts.length > 0 && (
          <View style={s.contactRow}>
            {contactParts.map((part, i) => (
              <Text key={i} style={s.contactItem}>
                {part}
                {i < contactParts.length - 1 ? "  ·" : ""}
              </Text>
            ))}
          </View>
        )}
        <View style={s.divider} />

        {/* ── Summary ── */}
        {summary && (
          <>
            <Text style={s.sectionTitle}>Summary</Text>
            <View style={s.sectionRule} />
            <Text style={s.summary}>{summary}</Text>
          </>
        )}

        {/* ── Experience ── */}
        {experience.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            <View style={s.sectionRule} />
            {experience.map((exp, i) => (
              <View key={i} style={s.expBlock} wrap={false}>
                <View style={s.expHeader}>
                  <Text style={s.expTitle}>{exp.title}</Text>
                  <Text style={s.expDates}>{exp.dates}</Text>
                </View>
                <Text style={s.expCompany}>{exp.company}</Text>
                {exp.bullets.map((bullet, j) => (
                  <View key={j} style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {/* ── Education ── */}
        {education.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            <View style={s.sectionRule} />
            {education.map((edu, i) => (
              <View key={i} style={s.eduBlock} wrap={false}>
                <View style={s.eduHeader}>
                  <Text style={s.eduDegree}>{edu.degree}</Text>
                  <Text style={s.expDates}>{edu.dates}</Text>
                </View>
                <Text style={s.expCompany}>{edu.institution}</Text>
                {edu.details && <Text style={s.eduDetails}>{edu.details}</Text>}
              </View>
            ))}
          </>
        )}

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.sectionRule} />
            <View style={s.skillsRow}>
              {skills.map((skill, i) => (
                <Text key={i} style={s.skillChip}>{skill}</Text>
              ))}
            </View>
          </>
        )}

        {/* ── Certifications ── */}
        {certifications && certifications.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Certifications</Text>
            <View style={s.sectionRule} />
            {certifications.map((cert, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{cert}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
