package com.vguard.validation.repository;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.model.UserResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Qualifier;

import java.util.Optional;

@Repository
@Slf4j
public class UserRepository {
    private final JdbcTemplate jdbcTemplate;
    
    // Using constructor injection with qualifier
    public UserRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbcTemplate = userJdbcTemplate;
    }

    public Optional<Long> findIdByEmail(String email) {
        try {
            Long id = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email_id1 = ?", Long.class, email);
            return Optional.ofNullable(id);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Lookup user id by email after normalizing stored and input values by removing '[' and ']'.
     */
    public Optional<Long> findIdByNormalizedEmail(String email) {
        try {
            String sql = "SELECT id FROM users WHERE REPLACE(REPLACE(email_id1,'[',''),']','') = ? LIMIT 1";
            Long id = jdbcTemplate.queryForObject(sql, Long.class, email);
            return Optional.ofNullable(id);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
    
    public Optional<UserResponse> findByEmail(String email) {
        String sql = "SELECT login_name, first_name, last_name, email_id1, status_id FROM users WHERE email_id1 = ?";
        
        try {
            UserResponse user = jdbcTemplate.queryForObject(sql, userRowMapper(), email);
            return Optional.ofNullable(user);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
    
    private RowMapper<UserResponse> userRowMapper() {
        return (rs, rowNum) -> {
            UserResponse user = new UserResponse();
            user.setLogin_name(rs.getString("login_name"));
            user.setFirst_name(rs.getString("first_name"));
            user.setLast_name(rs.getString("last_name"));
            user.setEmail_id1(rs.getString("email_id1"));
            user.setStatus_id(rs.getInt("status_id"));
            return user;
        };
    }
    
    public String findUsernameByEmail(String email) {
        try {
            String sql = "SELECT login_name FROM users WHERE email_id1 = ?";
            return jdbcTemplate.queryForObject(sql, String.class, email);
        } catch (Exception e) {
            return null;
        }
    }
    
    public Long findUserIdByUsername(String username) {
        try {
            String sql = "SELECT id FROM users WHERE login_name = ?";
            return jdbcTemplate.queryForObject(sql, Long.class, username);
        } catch (Exception e) {
            return null;
        }
    }

    public int countByEmail(String email) {
        try {
            String sql = "SELECT COUNT(*) FROM users " +
                    "WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
            return count == null ? 0 : count;
        } catch (Exception e) {
            return 0;
        }
    }
}
