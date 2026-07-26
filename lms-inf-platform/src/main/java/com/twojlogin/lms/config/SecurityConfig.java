package com.twojlogin.lms.config;

import com.twojlogin.lms.security.JwtFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.PermissionsPolicyHeaderWriter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
                        ))
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER
                        ))
                        .addHeaderWriter(new PermissionsPolicyHeaderWriter(
                                "camera=(), microphone=(), geolocation=()"
                        ))
                )
                .authorizeHttpRequests(auth -> auth

                        // AUTH
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/certificates/verify/**").permitAll()

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tutoring/available").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tutoring/blocked").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/tutoring/book").permitAll()

                        // STUDENT / ADMIN READ
                        .requestMatchers(HttpMethod.GET, "/api/courses/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/modules/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/lessons/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tasks/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/questions/**").authenticated()

                        // STUDENT LESSON PROGRESS
                        .requestMatchers(HttpMethod.POST, "/api/lessons/*/complete").authenticated()


                        // ADMIN WRITE
                        .requestMatchers(HttpMethod.POST, "/api/courses/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/courses/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/modules/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/modules/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/modules/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/lessons/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/lessons/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/lessons/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/tasks/lesson/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tasks/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tasks/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/questions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/questions/**").hasRole("ADMIN")

                        // STUDENT ACTIONS
                        .requestMatchers(HttpMethod.POST, "/api/tasks/*/check").authenticated()
                        .requestMatchers("/api/lesson-submit/**").authenticated()
                        .requestMatchers("/api/submissions/**").authenticated()
                        .requestMatchers("/api/submit/**").authenticated()
                        .requestMatchers("/api/my-results").authenticated()
                        .requestMatchers("/api/me").authenticated()


                        // ADMIN ONLY

                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/class/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/submissions/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/tutoring/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/tutoring/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tutoring/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tutoring/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()

                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")
                        )
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
