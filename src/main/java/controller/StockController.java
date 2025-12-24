package controller;

import model.Stock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import payload.StockSearchResponse;
import service.StockServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/stocks")
public class StockController {

    @Autowired
    private StockServiceImpl stockServiceImpl;

    @GetMapping("/stocks/search")
    public ResponseEntity<StockSearchResponse> searchStockByName(@RequestParam String query) {
        List<StockSearchResponse> stockList = stockServiceImpl.searchStockByName(query);
        return new ResponseEntity<>(stockList, HttpStatus.OK);
    }

    @GetMapping("/search/{stockSymbol}")
    public ResponseEntity<Stock> searchStockBySymbol(@PathVariable String stockSymbol) {
        Stock stockFound = stockServiceImpl.getStockBySymbol(stockSymbol);
        return new ResponseEntity<>(stockFound, HttpStatus.OK);
    }
}
