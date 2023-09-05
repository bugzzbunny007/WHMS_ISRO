require("dotenv").config();

const generateMail = (name, email, subject, content) => {
  return {
    from: process.env.NODE_MAILER_USEREMAIL,
    to: email,
    subject: subject,
    html: `
            <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
                <div style="margin: 50px auto; width: 70%; padding: 20px 0">
                    <div style="border-bottom: 1px solid #eee">
                        <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600">WHMS</a>
                    </div>
                    <p style="font-size: 1.1em">Hi ${name},</p>
                    ${content}
                    <p style="font-size: 0.9em;">Regards,<br />WHMS</p>
                    <hr style="border: none; border-top: 1px solid #eee" />
                    <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300">
                        <p>WHMS Inc</p>
                        <p>12 Cross Street, Bengaluru</p>
                    </div>
                </div>
            </div>
        `
  };
};

const OTPMail = (name, email, OTP) => {
  const subject = 'Verify Your email Account for WHMS Authentication';
  const content = `
        <p>Thank you for choosing Your WHMS. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
        <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${OTP}</h2>
    `;
  return generateMail(name, email, subject, content);
};

const verifiedMail = (name, email) => {
  const subject = 'Account Verified';
  const content = '<p>Your Email has been verified.</p>';
  return generateMail(name, email, subject, content);
};

transportObject = () => {
  return {
    service: process.env.NODE_MAILER_SERVICE_PROVIDER,
    auth: {
      user: process.env.NODE_MAILER_USEREMAIL,
      pass: process.env.NODE_MAILER_USERPASS
    }
  }
};

module.exports = { OTPMail, transportObject, verifiedMail };
