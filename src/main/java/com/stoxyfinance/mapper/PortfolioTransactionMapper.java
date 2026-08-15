package com.stoxyfinance.mapper;

import com.stoxyfinance.model.PortfolioTransaction;
import com.stoxyfinance.payload.PortfolioPayload.TransactionResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PortfolioTransactionMapper {

    @Mapping(source = "portfolio.id",target = "portfolioId")
    TransactionResponseDTO toResponseDTO(PortfolioTransaction portfolioTransaction);

    List<TransactionResponseDTO> toResponseDTOList(List<PortfolioTransaction> portfolioTransactionList);
}
