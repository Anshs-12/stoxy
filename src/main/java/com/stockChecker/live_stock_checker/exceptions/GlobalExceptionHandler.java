package com.stockChecker.live_stock_checker.exceptions;

import com.stockChecker.live_stock_checker.payload.APIResponse;
import com.stockChecker.live_stock_checker.payload.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.ZoneId;
import java.time.ZonedDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(StockNotFoundException.class)
    public ResponseEntity<APIResponse> handleStockNotFoundException(StockNotFoundException ex, HttpServletRequest request) {
        log.warn("Stock not found at {} : {}", request.getRequestURI(), ex.getMessage());
        APIResponse response = APIResponse.builder()
                .success(false)
                .error(ErrorCode.STOCK_NOT_FOUND)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IndexNotFoundException.class)
    public ResponseEntity<APIResponse> handleIndexNotFoundException(IndexNotFoundException ex, HttpServletRequest request) {
        log.warn("Index not found at {} : {}", request.getRequestURI(), ex.getMessage());
        APIResponse response = APIResponse.builder()
                .success(false)
                .error(ErrorCode.INDEX_NOT_FOUND)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<APIResponse> resourceNotFoundExceptionHandler(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found at {} : {}", request.getRequestURI(), ex.getMessage());
        APIResponse response = APIResponse.builder()
                .success(false)
                .error(ErrorCode.RESOURCE_NOT_FOUND)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse> internalServerErrorExceptionHandler(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error at {} : {}",request.getRequestURI(),ex.getMessage(),ex);
        APIResponse response = APIResponse.builder()
                .success(false)
                .error(ErrorCode.INTERNAL_SERVER_ERROR)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
