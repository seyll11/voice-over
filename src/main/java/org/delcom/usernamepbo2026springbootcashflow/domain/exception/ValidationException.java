package org.delcom.usernamepbo2026springbootcashflow.domain.exception;

/** Dilempar saat validasi aturan bisnis / input gagal. */
public class ValidationException extends DomainException {
    public ValidationException(String message) {
        super(message);
    }
}
