const nodemailer = require("nodemailer");
const { Visit, validate } = require("./models/visit");

/*
const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // `true` for port 465, `false` for all other ports
    auth: {
        user: "terrell.bashirian50@ethereal.email",
        pass: "Pd9wNFUZ2Pgvgkj252",
    },
});
*/

var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "dc1edfef5b7800",
      pass: "ea45783158c0a3"
    }
});

async function userAccountCreated(email) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Witamy w Naszym warsztacie",
            text: "Witamy w Naszym warsztacie! Nie czekaj i umów swoją pierwszą wizytę. Dziękujemy za zaufanie.",
            html: "Witamy w Naszym warsztacie! Nie czekaj i umów swoją pierwszą wizytę. Dziękujemy za zaufanie.",
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function userDataChanged(email) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Aktualizacja danych konta",
            text: "Dane na Twoim koncie zostały pomyślnie zaktualizowane.",
            html: "Dane na Twoim koncie zostały pomyślnie zaktualizowane.",
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function userAccountDeleted(email) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Usunięcie konta",
            text: "Twoje konto zostało pomyślnie usunięte. Smutno nam, że od Nas odchodzisz, ale mamy nadzieję, że jeszcze do Nas wrócisz.",
            html: "Twoje konto zostało pomyślnie usunięte. Smutno nam, że od Nas odchodzisz, ale mamy nadzieję, że jeszcze do Nas wrócisz.",
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function userVisitCreated(email, visitDetails, newVisitId) {
    try {
        const { serviceType, service, carBrand, carModel, date, time, moreInfo, carProductionYear, engine, vin, registrationNumber, _id } = visitDetails
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Umówienie wizyty",
            text: `Informujemy, że wizyta ${newVisitId} w naszym warsztacie została pomyślnie utworzona. Szczegóły wizyty:
            Usługa: ${serviceType} - ${service}
            Marka samochodu: ${carBrand}
            Model samochodu: ${carModel}
            Data: ${date}
            Godzina: ${time}
            Rok produkcji: ${carProductionYear}
            Silnik: ${engine}
            VIN: ${vin}
            Numer rejestracyjny: ${registrationNumber}
            Informacje dodatkowe: ${moreInfo}`,
            html: `Informujemy, że wizyta <b>${newVisitId}</b> w naszym warsztacie została pomyślnie utworzona.<br/><br/>
            Szczegóły wizyty:</b><br/>
            <ul>
                <li>Usługa: ${serviceType} - ${service}</li>
                <li>Marka samochodu: ${carBrand}</li>
                <li>Model samochodu: ${carModel}</li>
                <li>Data: ${date}</li>
                <li>Godzina: ${time}</li>
                <li>Rok produkcji: ${carProductionYear}</li>
                <li>Silnik: ${engine}</li>
                <li>VIN: ${vin}</li>
                <li>Numer rejestracyjny: ${registrationNumber}</li>
                <li>Informacje dodatkowe: ${moreInfo}</li>
            </ul>`
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function userVisitCanceled(email, visitId) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Anulowanie wizyty",
            text: `Twoja wizyta ${visitId} została odwołana.`,
            html: `Twoja wizyta <b>${visitId}</b> została odwołana.`,
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function statusChanged(creatorEmail, newStatus){
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: creatorEmail,
            subject: "Zmiana statusu wizyty",
            text: `Status twojej wizyty uległ zmianie. Aktualny status: ${newStatus}.`,
            html: `Status twojej wizyty uległ zmianie. Aktualny status: <b>${newStatus}</b>.`,
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function dataChanged(email) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Aktualizacja danych konta",
            text: "Dane na Twoim koncie zostały pomyślnie zaktualizowane. Jeśli masz jakieś pytania - skontaktuj się z nami.",
            html: "Dane na Twoim koncie zostały pomyślnie zaktualizowane. Jeśli masz jakieś pytania - skontaktuj się z nami.",
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function accountDeleted(email) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Usunięcie konta",
            text: "Twoje konto zostało pomyślnie usunięte. Smutno nam, że od Nas odchodzisz, ale mamy nadzieję, że jeszcze do Nas wrócisz. Jeśli masz jakieś pytania - skontaktuj się z nami.",
            html: "Twoje konto zostało pomyślnie usunięte. Smutno nam, że od Nas odchodzisz, ale mamy nadzieję, że jeszcze do Nas wrócisz. Jeśli masz jakieś pytania - skontaktuj się z nami.",
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function visitCanceled(email, visitId) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Anulowanie wizyty",
            text: `Twoja wizyta ${visitId} została odwołana. Jeśli masz jakieś pytania - skontaktuj się z nami.`,
            html: `Twoja wizyta <b>${visitId}</b> została odwołana. Jeśli masz jakieś pytania - skontaktuj się z nami.`,
        })
        console.log("Message sent: %s", info.messageId)
    } catch (error) {
        console.error("Error sending email:", error)
        throw new Error("Failed to send confirmation email")
    }
};

async function sendResetEmail(email, resetLink) {
    try {
        const info = await transporter.sendMail({
            from: '<warsztat@ethereal.email>',
            to: email,
            subject: "Resetowanie hasła",
            text: `Aby zresetować hasło, kliknij w poniższy link: ${resetLink}`,
            html: `Aby zresetować hasło, kliknij w poniższy link: <a href="${resetLink}">${resetLink}</a>`,
        });
        console.log("Reset email sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending reset email:", error);
        throw new Error("Failed to send reset email");
    }
};

module.exports = { userAccountCreated, userDataChanged, userAccountDeleted, userVisitCreated, userVisitCanceled, statusChanged, 
    dataChanged, accountDeleted, visitCanceled, sendResetEmail };