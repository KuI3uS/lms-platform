package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.TutoringBooking;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTutoringPaymentEmail(TutoringBooking booking) {
        if (booking.getGuestEmail() == null || booking.getGuestEmail().isBlank()) {
            return;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(booking.getGuestEmail());
        message.setSubject("EduHub - rezerwacja korepetycji i płatność");

        message.setText("""
                Cześć %s,

                Twoja rezerwacja korepetycji została utworzona.

                Termin: %s - %s
                Temat: %s
                Czas: %s godz.
                Kwota: %s zł

                Masz 10 minut na opłacenie rezerwacji.
                Po tym czasie termin wróci do dostępnych godzin.

                Link do płatności:
                %s

                Pozdrawiam,
                EduHub
                """.formatted(
                booking.getGuestName(),
                booking.getStartTime().format(formatter),
                booking.getEndTime().format(formatter),
                booking.getTopic(),
                booking.getHours(),
                booking.getPrice(),
                getPaymentLink(booking.getPrice())
        ));

        mailSender.send(message);
    }

    private String getPaymentLink(Integer price) {
        if (price != null && price == 160) {
            return "https://checkout.revolut.com/pay/213d3279-941b-463d-9e73-8dbef67ae8ad";
        }

        return "https://checkout.revolut.com/pay/334e96d4-687b-46d9-8f1b-b5452be7d555";
    }

    @Value("${frontend.url}")
    private String frontendUrl;
    public void sendVerificationEmail(String to, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Potwierdź adres email - EduHub");
        message.setText("""
                Cześć!
                Kliknij link, aby potwierdzić adres email:
                %s
                Link jest ważny 24 godziny.
                """.formatted(link));
        mailSender.send(message);
    }
}