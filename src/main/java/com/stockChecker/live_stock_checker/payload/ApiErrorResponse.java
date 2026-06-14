package com.stockChecker.live_stock_checker.payload;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // this tells Jackson to skip null fields entirely when serializing.
public class ApiErrorResponse {
    Boolean success;
    ErrorCode error;
    String message;
    String path;
    LocalDateTime time;
}
