package com.stockChecker.live_stock_checker.exceptions;

import com.stockChecker.live_stock_checker.payload.APIResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(StockNotFoundException.class)
    public ResponseEntity<APIResponse> ResourceNotFoundException(StockNotFoundException ex, HttpServletRequest request) {
        APIResponse response = APIResponse.builder()
                .error("STOCK_NOT_FOUND")
                .message(ex.getMessage())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
}
