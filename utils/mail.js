require("dotenv").config();

const sensorContent = [
    "Your Heart Sensor is showing abnormal values.",
    "Your X Sensor is showing abnormal values.",
    "Your Y Sensor is showing abnormal values."
]

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

const emailAlert = (name, email, alertID, values) => {
    console.log("in email alert ", name, email, alertID, values);
    const subject = 'Email Alert';

    // Initialize content with a default message
    let content = `<p>This is an Email alert.</br>Please be careful</p>`;

    // Iterate through alertID and values arrays
    for (let i = 0; i < alertID.length; i++) {
        // Check if there is an alert for the sensor
        if (alertID[i] === 1) {
            content += `<p>${sensorContent[i]}</br>Its current reading is ${values[i]}</p>`;
        }
    }
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

module.exports = { transportObject, emailAlert };