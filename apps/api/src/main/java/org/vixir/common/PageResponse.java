package org.vixir.common;

import java.util.List;

/** Standard paginated list envelope: { items, page, size, total }. */
public record PageResponse<T>(List<T> items, int page, int size, long total) {

    public static <T> PageResponse<T> of(List<T> items, int page, int size, long total) {
        return new PageResponse<>(items, page, size, total);
    }

    public static <T> PageResponse<T> ofAll(List<T> items) {
        return new PageResponse<>(items, 0, items.size(), items.size());
    }
}
