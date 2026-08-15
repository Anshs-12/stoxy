package com.stoxyfinance.exceptions;

public class IndexNotFoundException extends RuntimeException {

    public IndexNotFoundException(String message) {
        super(message);
    }
}
