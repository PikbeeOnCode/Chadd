import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function sendVerificationEmail(toEmail, token) {
const verifyUrl = `${process.env.APP_URL}/api/v1/users/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Verify your email',
    html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
}

export default sendVerificationEmail 