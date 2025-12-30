package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {

}
