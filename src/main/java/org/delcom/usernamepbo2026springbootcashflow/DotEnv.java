package org.delcom.usernamepbo2026springbootcashflow;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Memuat file .env (KEY=VALUE) ke system properties sebelum Spring Boot start,
 * sehingga placeholder seperti ${APP_PORT:8080} di application.yaml bisa terisi.
 */
public final class DotEnv {
    private DotEnv() {
    }

    /** Memuat file .env dari direktori kerja; diabaikan jika file tidak ada. */
    public static void load() {
        load(Path.of(".env"));
    }

    static void load(Path file) {
        if (!Files.isRegularFile(file)) {
            return;
        }
        try {
            List<String> lines = Files.readAllLines(file);
            for (String raw : lines) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int idx = line.indexOf('=');
                String key = line.substring(0, idx).trim();
                String value = line.substring(idx + 1).trim();
                // Nilai dari environment / -D yang sudah ada tidak ditimpa
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ex) {
            System.err.println("Gagal membaca .env: " + ex.getMessage());
        }
    }
}
