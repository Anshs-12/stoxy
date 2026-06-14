package com.stockChecker.live_stock_checker.exceptions;

import com.stockChecker.live_stock_checker.payload.ApiErrorResponse;
import com.stockChecker.live_stock_checker.payload.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.ZoneId;
import java.time.ZonedDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(StockNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleStockNotFoundException(StockNotFoundException ex, HttpServletRequest request) {
        log.warn("Stock not found at {} : {}", request.getRequestURI(), ex.getMessage());
        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.STOCK_NOT_FOUND)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IndexNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleIndexNotFoundException(IndexNotFoundException ex, HttpServletRequest request) {
        log.warn("Index not found at {} : {}", request.getRequestURI(), ex.getMessage());
        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.INDEX_NOT_FOUND)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> resourceNotFoundExceptionHandler(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found at {} : {}", request.getRequestURI(), ex.getMessage());
        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.RESOURCE_NOT_FOUND)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI()) // returns /api/v1/stocks/TATA
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> internalServerErrorExceptionHandler(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error at {} : {}", request.getRequestURI(), ex.getMessage(), ex);
        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.INTERNAL_SERVER_ERROR)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ResourceExistsException.class)
    public ResponseEntity<ApiErrorResponse> resourceExistsExceptionHandler(ResourceExistsException ex, HttpServletRequest request) {
        log.warn("Resource found at {} : {}", request.getRequestURI(), ex.getMessage());
        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.RESOURCE_ALREADY_EXISTS)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InsufficientQuantityException.class)
    public ResponseEntity<ApiErrorResponse> insufficientQuantityExceptionHandler(InsufficientQuantityException ex, HttpServletRequest request) {
        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.INSUFFICIENT_QUANTITY)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> methodArgumentNotValidExceptionHandler(MethodArgumentNotValidException ex, HttpServletRequest request) {
        FieldError fieldError = ex.getBindingResult().getFieldErrors().getFirst();

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.INVALID_REQUEST)
                .message(fieldError.getField() + " " + fieldError.getDefaultMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UpstoxFeedException.class)
    public ResponseEntity<ApiErrorResponse> upstoxFeedExceptionHandler(UpstoxFeedException ex, HttpServletRequest request) {
        log.error("Upstox Feed Connection failed at {} : {}", request.getRequestURI(), ex.getMessage(), ex);

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(ErrorCode.UPSTOX_FEED_ERROR)
                .message(ex.getMessage())
                .time(ZonedDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalDateTime())
                .path(request.getRequestURI())
                .build();

        return new ResponseEntity<>(response, HttpStatus.SERVICE_UNAVAILABLE);  // 503 is suitable for feed connection issues
    }
}
