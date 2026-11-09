package org.delcom.usernamepbo2026springbootcashflow.adapter.presenter;

import org.delcom.usernamepbo2026springbootcashflow.domain.entity.SortOption;
import org.delcom.usernamepbo2026springbootcashflow.domain.entity.Transaction;
import org.delcom.usernamepbo2026springbootcashflow.domain.entity.TransactionType;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Memformat data domain menjadi teks siap tampil. */
public class FinancePresenter {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /** Contoh: 1000000 menjadi "Rp 1,000,000.00". */
    public String formatMoney(BigDecimal amount) {
        DecimalFormat df = new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(Locale.US));
        return "Rp " + df.format(amount);
    }

    public String formatType(TransactionType type) {
        return type == TransactionType.INCOME ? "Pemasukan" : "Pengeluaran";
    }

    public String formatCreatedAt(Transaction t) {
        return t.getCreatedAt().format(DATE_TIME);
    }

    /** Contoh: [1] Gaji | Rp 1,000,000.00 | [Pemasukan] */
    public String format(Transaction t) {
        return String.format("[%d] %s | %s | [%s]",
                t.getId(), t.getDescription(), formatMoney(t.getAmount()), formatType(t.getType()));
    }

    public String showBalance(BigDecimal balance) {
        return "Saldo: " + formatMoney(balance);
    }

    public String formatSortOption(SortOption option) {
        return switch (option) {
            case AMOUNT_ASC -> "Jumlah terkecil";
            case AMOUNT_DESC -> "Jumlah terbesar";
            case INCOME_FIRST -> "Pemasukan dulu";
            case EXPENSE_FIRST -> "Pengeluaran dulu";
        };
    }

    public String showAddSuccess(Transaction t) {
        return "Berhasil menambah transaksi: " + format(t);
    }

    public String showRemoveSuccess() {
        return "Berhasil menghapus transaksi.";
    }

    public String showRemoveFailed(int id) {
        return String.format("[!] Gagal menghapus transaksi dengan ID: %d.", id);
    }

    public String showValidationError(String message) {
        return "[!] " + message;
    }

    public String showInvalidId() {
        return "[!] ID tidak valid!";
    }

    public String showInvalidChoice() {
        return "[!] Pilihan tidak dimengerti.";
    }

    public String showEmpty() {
        return "- Data transaksi belum tersedia!";
    }

    public String showNotFound() {
        return "- Transaksi tidak ditemukan!";
    }
}
