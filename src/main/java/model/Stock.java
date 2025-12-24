package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.NotNull;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Stock {
    /*
        so these are the values of the stock that never changes,static data of a stock.
        then there are dynamic data like currentPrice, openingPrice, closingPrice, marketCap etc.
    */
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serialNumber;
    private String stockName;
    @Column(unique = true,nullable = false)
    @Id
    private String stockSymbol;
    private String aboutStock;
    private String listedExchangeName;
    private String companyWebsite;
}
