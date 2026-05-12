package com.vguard.validation.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class RepositoryLoggingAspect {

    @Around("execution(public * com.vguard.validation..repository..*(..))")
    public Object logRepositoryCalls(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        log.debug("[{}] Executing query: {} | params: {}", className, methodName, Arrays.toString(args));
        try {
            return joinPoint.proceed();
        } catch (Throwable ex) {
            log.error("[{}] Query failed: {} | params: {} | error: {}",
                    className, methodName, Arrays.toString(args), ex.getMessage(), ex);
            throw ex;
        }
    }
}
