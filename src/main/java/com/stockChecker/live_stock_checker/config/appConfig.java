package com.stockChecker.live_stock_checker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.modelmapper.ModelMapper;

@Configuration
public class appConfig {

    @Bean
    public ModelMapper modelMapper(){
        return new ModelMapper();
    }
}
