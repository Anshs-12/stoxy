package com.stoxyfinance.config;

import com.stoxyfinance.exceptions.ResourceNotFoundException;
import com.stoxyfinance.model.User;
import com.stoxyfinance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@Slf4j
@RequiredArgsConstructor

public class AuthUtils {

    private final UserRepository userRepository;

    public User getloggedInUser(String userEmail) {
        return userRepository.findByUserMailId(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with emailId: " + userEmail));
    }

    public String getLoggedInUserEmail() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal()
                .toString();
    }
}
