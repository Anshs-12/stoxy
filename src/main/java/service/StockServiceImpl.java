package service;

import model.Stock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import repository.StockRepository;


@Service
public class StockServiceImpl implements StockSerivce {

    @Autowired
    private StockRepository stockRepository;

    /*

        entire flow, first checking if the stock exits in database,
        if not then we call to save into the Database, and then it returns that stock back.
    */

    @Override
    public Stock getStockBySymbol(String symbol) {
        Stock stockFound = stockRepository.findById(symbol)
                .orElseGet(() -> saveStockInDB(symbol));
        return stockFound;
    }

    @Override
    public Stock saveStockInDB(String symbol) {
        Stock newStock = Stock.builder()
                .stockName("ABC")
                .companyWebsite("abc.com")
                .listedExchangeName("NSE")
                .aboutStock("this is a stock related to market")
                .stockSymbol(symbol)
                .build();
        return stockRepository.save(newStock);
    }
}
