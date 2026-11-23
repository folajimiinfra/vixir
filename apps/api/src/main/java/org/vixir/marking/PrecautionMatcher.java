package org.vixir.marking;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Matches student precaution text against the experiment's keyword sets (Req 10.6).
 * Pure — no Spring, no I/O.
 */
public final class PrecautionMatcher {

    private PrecautionMatcher() {}

    /**
     * @param studentTexts   list of precaution strings the student wrote
     * @param keywordSets    list of keyword sets per expected precaution (from experiment config);
     *                       a precaution is matched if any keyword in its set appears in any student text
     * @param maxMarks       maximum marks available for precautions
     * @return               marks awarded (0..maxMarks)
     */
    public static int score(List<String> studentTexts, List<Set<String>> keywordSets, int maxMarks) {
        if (studentTexts == null || keywordSets == null || maxMarks <= 0) return 0;
        Set<String> combined = studentTexts.stream()
                .map(t -> t.toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(" "))
                .chars()
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString()
                .lines()
                .collect(Collectors.toSet());
        // Re-join as one string for simple contains-check
        String allText = studentTexts.stream()
                .map(t -> t.toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(" "));
        int matched = 0;
        for (Set<String> keywords : keywordSets) {
            boolean hit = keywords.stream()
                    .anyMatch(kw -> allText.contains(kw.toLowerCase(Locale.ROOT)));
            if (hit) matched++;
        }
        return Math.min(matched, maxMarks);
    }
}
