package com.vguard.validation.repository;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.dto.UserDetailRow;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Types;
import java.util.List;
import java.util.Optional;

@Repository
@Slf4j
public class UserDetailsRepository {
    private static final Logger log = LoggerFactory.getLogger(UserDetailsRepository.class);

    private final JdbcTemplate jdbc;

    public UserDetailsRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    private static final String SQL = """
      SELECT 
        i.name AS instance_name,
        m.user_id,
        u.login_name,
        m.user_type,
        r.name AS role_name,
        r.`key` AS role_key,
        m.status_id,
        m.created_by,
        DATE_FORMAT(m.created_date, '%Y-%m-%d %H:%i:%s') AS created_date,
        m.updated_by,
        DATE_FORMAT(m.updated_date, '%Y-%m-%d %H:%i:%s') AS updated_date,
        u.email_id1 AS email
      FROM vguarddev_smartdocso_20201109134921303_1000000001911.orm_member m
      LEFT JOIN vguarddev_smartdocso_20201109134921303_1000000001911.role r ON r.id = m.user_type
      LEFT JOIN vguarddev_smartdocso_20201109134921303_1000000001911.orm_instance i ON i.id = m.orm_instance_id
      INNER JOIN vguarddev_smartdocso_20201109134921303_1000000001911.users u ON u.id = m.user_id
      WHERE i.name = 'FA' AND (
        REPLACE(REPLACE(u.email_id1,'[',''),']','') = REPLACE(REPLACE(?, '[', ''), ']', '')
        OR m.user_id = ?
      )
    """;

    private static final String SQL_BY_UID = """
      SELECT 
        i.name AS instance_name,
        m.user_id,
        (SELECT u.login_name FROM vguarddev_smartdocso_20201109134921303_1000000001911.users u WHERE u.id = m.user_id) AS login_name,
        m.user_type,
        r.name AS role_name,
        r.`key` AS role_key,
        m.status_id,
        m.created_by,
        DATE_FORMAT(m.created_date, '%Y-%m-%d %H:%i:%s') AS created_date,
        m.updated_by,
        DATE_FORMAT(m.updated_date, '%Y-%m-%d %H:%i:%s') AS updated_date,
        (SELECT u.email_id1 FROM vguarddev_smartdocso_20201109134921303_1000000001911.users u WHERE u.id = m.user_id) AS email
      FROM vguarddev_smartdocso_20201109134921303_1000000001911.orm_member m
      LEFT JOIN vguarddev_smartdocso_20201109134921303_1000000001911.role r ON r.id = m.user_type
      LEFT JOIN vguarddev_smartdocso_20201109134921303_1000000001911.orm_instance i ON i.id = m.orm_instance_id
      WHERE m.user_id = ? AND i.name = 'FA'
    """;

    private RowMapper<UserDetailRow> mapper() {
        return (rs, rowNum) -> {
            Number statusNum;
            try {
                statusNum = (Number) rs.getObject("status_id");
            } catch (ClassCastException ex) {
                // Fallback in case driver returns non-Number
                String s = rs.getString("status_id");
                statusNum = (s == null || s.isEmpty()) ? null : Long.parseLong(s);
            }
            Integer statusId = statusNum == null ? null : Integer.valueOf(statusNum.intValue());

            return new UserDetailRow(
                    rs.getString("instance_name"),
                    rs.getString("user_id"),
                    rs.getString("login_name"),
                    rs.getString("user_type"),
                    rs.getString("role_name"),
                    rs.getString("role_key"),
                    statusId,
                    rs.getString("created_by"),
                    rs.getString("created_date"),
                    rs.getString("updated_by"),
                    rs.getString("updated_date"),
                    rs.getString("email")
            );
        };
    }

    /**
     * Public entry. Accepts either numeric id or email. Normalizes and delegates.
     */
    public List<UserDetailRow> findByUserId(String userIdOrEmail) {
        String raw = userIdOrEmail == null ? "" : userIdOrEmail;
        // URL decode (defend against %40 etc)
        String decoded = URLDecoder.decode(raw, StandardCharsets.UTF_8);
        // Normalize: remove whitespace and bracket characters only.
        String clean = decoded.replaceAll("[\\s\\[\\]]+", "");
        Long uid = null;
        try {
            // If the cleaned input *does not* contain '@' and looks numeric, treat as uid
            if (!clean.contains("@") && clean.matches("^[0-9]+$")) {
                uid = Long.parseLong(clean);
            }
        } catch (NumberFormatException ignored) {
            uid = null;
        }

        log.debug("findByUserId: raw='{}' decoded='{}' cleaned='{}' parsedUid={}", raw, decoded, clean, uid);
        return findByEmailOrUid(clean, uid);
    }

    /**
     * Execute the SQL with two parameters: normalized-email and uid (nullable).
     */
    public List<UserDetailRow> findByEmailOrUid(String cleanEmail, Long uid) {
        return jdbc.query(conn -> {
            var ps = conn.prepareStatement(SQL);
            // bind normalized email string first
            ps.setString(1, cleanEmail);
            // bind uid as long or null
            if (uid == null) {
                ps.setNull(2, Types.BIGINT);
            } else {
                ps.setLong(2, uid);
            }
            return ps;
        }, mapper());
    }

    public List<UserDetailRow> findByUserIdLong(Long uid) {
        return jdbc.query(SQL_BY_UID, mapper(), uid);
    }
}
