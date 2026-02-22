package com.stockChecker.live_stock_checker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class LiveStockCheckerApplication {

	public static void main(String[] args) {
		SpringApplication.run(LiveStockCheckerApplication.class, args);
	}

}
