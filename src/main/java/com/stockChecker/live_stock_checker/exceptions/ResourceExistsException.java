package com.stockChecker.live_stock_checker.exceptions;

public class ResourceExistsException extends RuntimeException {
    public ResourceExistsException(String message) {
        super(message);
    }
}
