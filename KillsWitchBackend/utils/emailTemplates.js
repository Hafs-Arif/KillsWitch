"use strict";

function currency(amount, currency = "USD") {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

function layout({ title, bodyHtml }) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1f2937; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .header { background: linear-gradient(90deg, #111827, #374151); color: #ffffff; padding: 20px 24px; }
        .content { padding: 24px; }
        .footer { padding: 16px 24px; color: #6b7280; font-size: 12px; text-align: center; }
        .btn { display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff !important; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .muted { color: #6b7280; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: left; font-size: 14px; }
        .badge { display: inline-block; padding: 4px 8px; background: #f3f4f6; border-radius: 9999px; font-size: 12px; color: #374151; }
        .code { font-size: 28px; font-weight: 800; letter-spacing: 6px; background: #111827; color: #ffffff; padding: 12px 16px; border-radius: 10px; display: inline-block; }
      </style>
    </head>
    <body>
      <div style="padding:24px;">
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 18px;">${title}</h1>
          </div>
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <div>© ${new Date().getFullYear()} Killswitch</div>
            <div class="muted">This is an automated email. Please do not reply.</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function otpEmailTemplate({ otp, appName = "Killswitch", validityMinutes = 10 }) {
  const title = `${appName} verification code`;
  const bodyHtml = `
    <p>Use the following One-Time Password (OTP) to complete your request:</p>
    <p class="code">${otp}</p>
    <p class="muted">This code is valid for <strong>${validityMinutes} minutes</strong>. Do not share it with anyone.</p>
  `;
  return { subject: `Your ${appName} OTP Code`, html: layout({ title, bodyHtml }) };
}

function orderConfirmationTemplate({ 
  order,
  items = [],
  currencyCode = "USD",
  appName = "Killswitch",
  supportEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "contact@killswitch.us",
}) {
  const title = `Thanks for your order ${order?.orderId ? `#${order.orderId}` : ""}`;
  const itemsRows = (items || [])
    .map((it) => {
      const name = it.name || it.productName || it.item || "Item";
      const qty = it.quantity || 1;
      const price = it.price || 0;
      return `<tr><td>${name}</td><td class="muted">x${qty}</td><td style="text-align:right;">${currency(price, currencyCode)}</td></tr>`;
    })
    .join("");

  const totals = `
    <tr><td colspan="2"><strong>Subtotal</strong></td><td style="text-align:right;">${currency(order?.subtotal, currencyCode)}</td></tr>
    <tr><td colspan="2"><strong>Shipping</strong></td><td style="text-align:right;">${currency(order?.shipping_cost, currencyCode)}</td></tr>
    <tr><td colspan="2"><strong>Tax</strong></td><td style="text-align:right;">${currency(order?.tax, currencyCode)}</td></tr>
    <tr><td colspan="2"><strong>Total</strong></td><td style="text-align:right;">${currency(order?.total_price || order?.amount, currencyCode)}</td></tr>
  `;

  const shippingBlock = `
    <div>
      <div><span class="badge">Shipping</span></div>
      <div><strong>${order?.shippingName || ""}</strong></div>
      <div>${order?.shippingAddress || ""}</div>
      <div>${[order?.shippingCity, order?.shippingState, order?.shippingCountry].filter(Boolean).join(", ")}</div>
      ${order?.shippingPhone ? `<div>Phone: ${order.shippingPhone}</div>` : ""}
      ${order?.shippingMethod ? `<div>Method: ${order.shippingMethod}</div>` : ""}
      ${order?.trackingNumber ? `<div>Tracking: ${order.trackingNumber}</div>` : ""}
    </div>
  `;

  const bodyHtml = `
    <p>Hi${order?.shippingName ? ` ${order.shippingName}` : ""},</p>
    <p>We’ve received your order <strong>${order?.orderId || ""}</strong>. We’ll notify you when it ships.</p>

    <table class="table" role="presentation" cellspacing="0" cellpadding="0">
      <thead>
        <tr><th>Item</th><th>Qty</th><th style="text-align:right;">Price</th></tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        ${totals}
      </tfoot>
    </table>

    <div style="margin-top:16px;">${shippingBlock}</div>

    <p class="muted">If you have any questions, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
  `;

  return { subject: `${appName} Order Confirmation ${order?.orderId ? `#${order.orderId}` : ""}`, html: layout({ title, bodyHtml }) };
}

function orderStatusUpdateTemplate({ 
  order,
  items = [],
  newStatus,
  currencyCode = "USD",
  appName = "Killswitch",
  supportEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "contact@killswitch.us",
}) {
  const title = `Order Status Update ${order?.orderId ? `#${order.orderId}` : ""}`;
  
  let statusMessage = "";
  let additionalContent = "";

  switch (newStatus) {
    case 'PROCESSING':
      statusMessage = "Your order is now being processed.";
      break;
    case 'SHIPPED':
      statusMessage = "Your order has been shipped.";
      break;
    case 'DELIVERED':
      statusMessage = "Your order has been delivered successfully!";
      additionalContent = `<p style="margin-top: 16px;"><a href="${process.env.WEB_ORIGIN || 'https://www.killswitch.us'}/orders" style="background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">Write a Review</a></p>`;
      break;
    case 'CANCELLED':
      statusMessage = "Your order has been cancelled.";
      additionalContent = `<p style="margin-top: 16px;"><a href="${process.env.WEB_ORIGIN || 'https://www.killswitch.us'}/ContactUs" style="background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">Contact Support</a></p>`;
      break;
    default:
      statusMessage = `Your order status has been updated to ${newStatus}.`;
  }
  
  const bodyHtml = `
    <p>Hi${order?.shippingName ? ` ${order.shippingName}` : ""},</p>
    <p>${statusMessage}</p>
    
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>Order Details:</strong><br>
      Order ID: ${order?.orderId || order?.id || "N/A"}<br>
      Status: <span style="color: #059669; font-weight: bold;">${newStatus}</span>
    </div>

    ${additionalContent}
  `;

  return { subject: `${appName} Order Update ${order?.orderId ? `#${order.orderId}` : ""}`, html: layout({ title, bodyHtml }) };
}

module.exports = {
  otpEmailTemplate,
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
};
