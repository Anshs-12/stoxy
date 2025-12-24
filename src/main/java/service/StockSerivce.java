package service;


import model.Stock;
import org.springframework.http.ResponseEntity;

public interface StockSerivce {
    Stock getStockBySymbol(String symbol);

    Stock saveStockInDB(String symbol);
}
