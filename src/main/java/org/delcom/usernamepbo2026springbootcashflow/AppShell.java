package org.delcom.usernamepbo2026springbootcashflow;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.AppShellSettings;

/** Konfigurasi halaman global (meta tag untuk SEO). */
public class AppShell implements AppShellConfigurator {
    @Override
    public void configurePage(AppShellSettings settings) {
        settings.addMetaTag("description",
                "Aplikasi Cashflow untuk mencatat pemasukan dan pengeluaran, "
                        + "melihat saldo, mencari, dan mengurutkan transaksi keuangan.");
        settings.addMetaTag("robots", "index, follow");
        settings.addMetaTag("theme-color", "#ffffff");
    }
}
