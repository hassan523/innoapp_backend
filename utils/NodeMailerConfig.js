import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'mail.innoapp.org',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: 'info@innoapp.org',
        pass: 'supPortinno$12'
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;