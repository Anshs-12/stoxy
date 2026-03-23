package com.stockChecker.live_stock_checker.mapper;

import com.stockChecker.live_stock_checker.model.PortfolioTransaction;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.TransactionResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PortfolioTransactionMapper {

    @Mapping(source = "portfolio.id",target = "portfolioId")
    TransactionResponseDTO toResponseDTO(PortfolioTransaction portfolioTransaction);

    List<TransactionResponseDTO> toResponseDTOList(List<PortfolioTransaction> portfolioTransactionList);
}
