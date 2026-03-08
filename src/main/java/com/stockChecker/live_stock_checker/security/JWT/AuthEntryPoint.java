package com.stockChecker.live_stock_checker.security.JWT;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.payload.APIResponse;
import com.stockChecker.live_stock_checker.payload.ErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@Slf4j
public class AuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // this class basically is for catching the unAuthorized requests and send back a error response
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        log.error("UnAuthorized Error : {}", authException.getMessage());
        generateErrorResponseDTO(request, response, authException);
    }

    public void generateErrorResponseDTO(HttpServletRequest request,
                                         HttpServletResponse response,
                                         AuthenticationException authException) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        APIResponse apiResponse = APIResponse.builder()
                .success(false)
                .message("UnAuthorized")
                .error(ErrorCode.UNAUTHORIZED)
                .path(request.getServletPath())
                .time(LocalDateTime.now())
                .build();


        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
