package com.vguard.validation.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class ControllerLoggingAspect {

    @Around("execution(public * com.vguard.validation..controller..*(..))")
    public Object logControllerCalls(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String endpoint = resolveEndpoint();

        log.info("[{}] [{}] called | params: {}", className, endpoint, Arrays.toString(joinPoint.getArgs()));
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] [{}] completed | status: 200 | duration: {}ms", className, endpoint, duration);
            return result;
        } catch (IllegalArgumentException | jakarta.validation.ValidationException ex) {
            log.warn("[{}] [{}] validation failed in {} | message: {}", className, endpoint, methodName, ex.getMessage());
            throw ex;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - start;
            log.error("[{}] [{}] failed | duration: {}ms | error: {}", className, endpoint, duration, ex.getMessage(), ex);
            throw ex;
        }
    }

    private String resolveEndpoint() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return "N/A";
        }
        HttpServletRequest request = attrs.getRequest();
        return request.getMethod() + " " + request.getRequestURI();
    }
}
