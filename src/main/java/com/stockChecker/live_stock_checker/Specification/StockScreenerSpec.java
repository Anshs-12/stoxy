package com.stockChecker.live_stock_checker.Specification;

import com.stockChecker.live_stock_checker.model.Company;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.StockFinancials;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

public final class StockScreenerSpec {

    private StockScreenerSpec() {
    }

    public static Specification<Stock> hasMinPe(Double minPe) {
        return (Root<Stock> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (minPe == null) return null;
            // join stock -> stockFinancials (assuming OneToOne mapped field name = "stockFinancials")
            Join<Stock, StockFinancials> financials = root.join("stockFinancials");
            // ensure numeric comparison uses correct type
            return cb.greaterThanOrEqualTo(financials.get("pe").as(Double.class), minPe);
        };
    }

    public static Specification<Stock> hasMaxPe(Double maxPe) {
        return (root, query, cb) -> {
            if (maxPe == null) return null;
            Join<Stock, StockFinancials> financials = root.join("stockFinancials");
            return cb.lessThanOrEqualTo(financials.get("pe").as(Double.class), maxPe);
        };
    }

    public static Specification<Stock> hasSector(String sector) {
        return (root, query, cb) -> {
            if (sector == null || sector.isBlank()) return null;
            Join<Stock, Company> company = root.join("company");
            return cb.equal(cb.lower(company.get("sector")), sector.toLowerCase());
        };
    }

    public static Specification<Stock> hasIndustry(String industry) {
        return (root, query, cb) -> {
            if (industry == null || industry.isBlank()) return null;
            Join<Stock, Company> company = root.join("company");
            return cb.equal(cb.lower(company.get("industry")), industry.toLowerCase());
        };
    }
}
/*

    first we're checking if this is required or not with the if statement then
    we are going to Join the two entities or tables incase we want to work
    with the other values, so then we start building the WHERE clause using the criteriaBuilder,
    which is majorly of multiple various methods such as lessThanEqual, greaterThanEqual and equal
    Now what we want in sense of the methods required or involved,
    we then choose it, here equal demands two params once is the left side path and
    other our value to check and compare to the actual database values

    Example:
        cb.equal(path, value) is equivalent to WHERE sector = 'Oil' in SQL

    So this way, we can even change our value so that it remains from both  sides.
*/





























