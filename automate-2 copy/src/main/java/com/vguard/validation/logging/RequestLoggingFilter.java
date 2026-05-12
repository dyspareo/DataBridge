package com.vguard.validation.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger apiLog = LoggerFactory.getLogger("API_LOGGER");
    private static final Logger authLog = LoggerFactory.getLogger("AUTH_LOGGER");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long start = System.currentTimeMillis();
        String method = request.getMethod();
        String path = request.getRequestURI();
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        apiLog.info("[RequestFilter] --> {} {} | ip: {} | user-agent: {}", method, path, ip, userAgent);
        if (isAuthPath(path)) {
            authLog.info("[AuthService] Request received | method: {} | path: {} | ip: {}", method, path, ip);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - start;
            int status = response.getStatus();
            apiLog.info("[RequestFilter] <-- {} {} | status: {} | duration: {}ms", method, path, status, duration);

            if (status == HttpServletResponse.SC_UNAUTHORIZED || status == HttpServletResponse.SC_FORBIDDEN) {
                authLog.warn("[SecurityFilter] Unauthorized access | path: {} | ip: {}", path, ip);
            } else if (isAuthPath(path)) {
                authLog.info("[AuthService] Request completed | path: {} | status: {} | duration: {}ms", path, status, duration);
            }
        }
    }

    private boolean isAuthPath(String path) {
        if (path == null) {
            return false;
        }
        String normalized = path.toLowerCase();
        return normalized.contains("/auth")
                || normalized.contains("/login")
                || normalized.contains("/logout")
                || normalized.contains("/token");
    }
}
