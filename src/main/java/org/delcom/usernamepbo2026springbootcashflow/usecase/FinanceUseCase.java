package org.delcom.usernamepbo2026springbootcashflow.usecase;

import org.delcom.usernamepbo2026springbootcashflow.domain.entity.SortOption;
import org.delcom.usernamepbo2026springbootcashflow.domain.entity.Transaction;
import org.delcom.usernamepbo2026springbootcashflow.domain.exception.EntityNotFoundException;
import org.delcom.usernamepbo2026springbootcashflow.domain.exception.ValidationException;
import org.delcom.usernamepbo2026springbootcashflow.domain.repository.ITransactionRepository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Proses bisnis pencatatan keuangan. Tanpa I/O UI: hanya memproses data dan
 * melempar checked exception domain bila operasi tidak valid.
 */
public class FinanceUseCase {
    private final ITransactionRepository repository;

    public FinanceUseCase(ITransactionRepository repository) {
        this.repository = repository;
    }

    public List<Transaction> getAllTransactions() {
        return repository.findAll();
    }

    public Transaction addIncome(String description, String amountText) throws ValidationException {
        String desc = validateDescription(description);
        return repository.saveIncome(desc, parseAmount(amountText));
    }

    public Transaction addExpense(String description, String amountText) throws ValidationException {
        String desc = validateDescription(description);
        return repository.saveExpense(desc, parseAmount(amountText));
    }

    public void removeTransaction(int id) throws EntityNotFoundException {
        if (!repository.deleteById(id)) {
            throw new EntityNotFoundException(id);
        }
    }

    /** Mencari berdasarkan keterangan (case-insensitive); kata kunci kosong = semua data. */
    public List<Transaction> searchTransactions(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return repository.findAll();
        }
        String key = keyword.trim().toLowerCase();
        return repository.findBy(t -> t.getDescription().toLowerCase().contains(key));
    }

    public List<Transaction> sortTransactions(SortOption option) {
        return repository.findAll().stream().sorted(option.comparator()).toList();
    }

    public BigDecimal getTotalIncome() {
        return repository.findBy(Transaction::isIncome).stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalExpense() {
        return repository.findBy(t -> !t.isIncome()).stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Saldo = total pemasukan - total pengeluaran. */
    public BigDecimal getBalance() {
        return repository.findAll().stream()
                .map(Transaction::signedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String validateDescription(String description) throws ValidationException {
        if (description == null || description.isBlank()) {
            throw new ValidationException("Keterangan tidak boleh kosong");
        }
        return description.trim();
    }

    private BigDecimal parseAmount(String amountText) throws ValidationException {
        if (amountText == null || amountText.isBlank()) {
            throw new ValidationException("Jumlah tidak boleh kosong");
        }
        BigDecimal amount;
        try {
            amount = new BigDecimal(amountText.trim());
        } catch (NumberFormatException ex) {
            throw new ValidationException("Jumlah harus berupa angka");
        }
        if (amount.signum() <= 0) {
            throw new ValidationException("Jumlah harus lebih dari 0");
        }
        return amount;
    }
}
