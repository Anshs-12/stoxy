package com.stockChecker.live_stock_checker.startup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockDataSeederListener {

    private final StockDataSeeder stockDataSeeder;

    // When Spring completes startup, it fires ApplicationReadyEvent.
    // StockDataSeederListener catches this event via @EventListener.
    // It then calls StockDataSeeder.stockDataSeederMethod() which is marked @Async,
    // meaning it runs in a separate background thread.
    // This way seeding starts immediately after startup but doesn't block the app.
    // the app is fully ready to serve requests while seeding happens in background.
    @EventListener(ApplicationReadyEvent.class)
    public void runStockDataSeederMethod() {
        log.debug("ApplicationReadyEvent received, calling StockDataSeeder");
        stockDataSeeder.stockDataSeederMethod();
    }
}
