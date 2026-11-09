package org.delcom.usernamepbo2026springbootcashflow.domain.repository;

import org.delcom.usernamepbo2026springbootcashflow.domain.entity.Transaction;

import java.math.BigDecimal;

/** Port spesifik transaksi dengan penomoran ID otomatis. */
public interface ITransactionRepository extends IRepository<Transaction, Integer> {
    /** Menyimpan transaksi pemasukan baru. */
    Transaction saveIncome(String description, BigDecimal amount);

    /** Menyimpan transaksi pengeluaran baru. */
    Transaction saveExpense(String description, BigDecimal amount);
}
