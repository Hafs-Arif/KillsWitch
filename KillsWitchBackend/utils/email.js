const { sendMail } = require("./mailer");

function stripHtml(html = "") {
  try {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    return html || "";
  }
}

// Backward-compatible wrapper maintaining the old signature
// sendEmail(from, to, subject, body)
exports.sendEmail = async (from, to, subject, body) => {
  try {
    const info = await sendMail({
      from,
      to, 
      subject,
      html: body,
      text: stripHtml(body),
    });
    if (info && info.response) {
      console.log("Email sent:", info.response);
    }
    return info;
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};