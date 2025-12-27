package com.stockChecker.live_stock_checker.exceptions;


public class StockNotFoundException extends RuntimeException {
    public StockNotFoundException(String message) {
        super(message);
    }
}
