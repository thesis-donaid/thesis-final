
import { AllocationEmailParams, DisbursementEmailParams, ReceiptNotificationParams, RequestEmailData } from "@/types/email";
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const ORG_NAME = "Puso Ng Ama Foundation Inc.";

function wrapEmailHtml(bodyHtml: string): string {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; color: white; font-size: 18px; font-weight: bold;">${ORG_NAME}</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                ${bodyHtml}
            </div>
            <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 11px;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${ORG_NAME}. All rights reserved.</p>
                <p style="margin: 4px 0 0;">This is an automated message. Please do not reply.</p>
            </div>
        </div>
    `;
}

export async function sendOtpEmail(email: string, code: string) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `${ORG_NAME} - Your Login Verification Code`,
        html: wrapEmailHtml(`
            <h2>Verification Code</h2>
            <p>Your authentication code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #4F46E5;">${code}</h1>
            <p>This code expires in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `),
    });
}

export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function sendDonationConfirmation(data: RequestEmailData) {
  const formattedDate = data.date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.email,
    subject: `${ORG_NAME} - Donation Payment Successful`,
    html: wrapEmailHtml(`
      <h2 style="color: #16a34a;">Payment Successful 🎉</h2>
      
      <p>Hi,</p>

      <p>Thank you for your generous donation to <strong>${ORG_NAME}</strong>! Your payment has been successfully processed through <strong>PayMongo</strong>.</p>

      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 10px;">
        <p><strong>Amount:</strong> ₱${data.amount.toFixed(2)}</p>
        <p><strong>Reference No:</strong> ${data.reference}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
      </div>

      <p style="margin-top: 20px;">
        Your support helps us continue our mission and make a positive impact.
      </p>

      <p>Thank you and God bless! 🙏</p>
    `)
  });
}


export async function sendAllocationNotificationEmail(params: AllocationEmailParams) {
  const { to, donorName, amountUsed, purpose, disbursementDate, isBeneficiary, beneficiaryName } = params;
  
  const formattedDate = disbursementDate
   ? disbursementDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
   })
   : "TBD";

  const subject = isBeneficiary
   ? `Your Request Has Been Approved!`
   : `Your Donation is Making an Impact!`;

  const bodyHtml = isBeneficiary
   ? `
      <h2>Good News, ${donorName}!</h2>
      <p>Your request has been approved and funds have been allocated by <strong>${ORG_NAME}</strong>.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p><strong>Amount Approved:</strong> ₱${amountUsed.toLocaleString()}</p>
        <p><strong>Disbursement Date:</strong> ${formattedDate}</p>
      </div>
      <p>Please prepare the necessary documents for receiving the funds.</p>
    `
    : `
      <h2>Dear ${donorName},</h2>
      <p>We're excited to share that your donation to <strong>${ORG_NAME}</strong> is being put to good use!</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Your Donation Used:</strong> ₱${amountUsed.toLocaleString()}</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        ${beneficiaryName ? `<p><strong>Beneficiary:</strong> ${beneficiaryName}</p>` : ''}
        <p><strong>Scheduled Disbursement:</strong> ${formattedDate}</p>
      </div>
      <p>We used your <strong>₱${amountUsed.toLocaleString()}</strong> donation to help <strong>${beneficiaryName || 'a beneficiary'}</strong> with their request for <em>${purpose}</em>.</p>
      <p>We'll send you another update once the funds have been disbursed, including proof of how your donation made a difference.</p>
      <p>Thank you for your generosity!</p>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${ORG_NAME} - ${subject}`,
    html: wrapEmailHtml(bodyHtml),
  });
}


export async function sendDisbursementNotificationEmail(params: DisbursementEmailParams) {
  const { to, recipientName, amount, purpose, disbursementMethod, disbursementNotes, isBeneficiary, beneficiaryName } = params;

  const methodLabel: Record<string, string> = {
    cash: 'Cash (pick up at the office)',
    check: 'Check',
    bank_transfer: 'Bank Transfer',
  };

  const displayMethod = methodLabel[disbursementMethod] || disbursementMethod;

  const subject = isBeneficiary
    ? 'Your Funds Have Been Disbursed!'
    : 'Your Donation Has Been Disbursed to a Beneficiary!';

  const bodyHtml = isBeneficiary
    ? `
        <h2 style="color: #16a34a;">Funds Disbursed! \uD83C\uDF89</h2>
        <p>Dear ${recipientName},</p>
        <p>Great news! The funds for your request from <strong>${ORG_NAME}</strong> have been officially disbursed.</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p><strong>Amount Disbursed:</strong> \u20B1${amount.toLocaleString()}</p>
          <p><strong>Collection Method:</strong> ${displayMethod}</p>
          ${disbursementNotes ? `<p><strong>Notes:</strong> ${disbursementNotes}</p>` : ''}
        </div>
        ${disbursementMethod === 'cash' 
          ? '<p><strong>Next Step:</strong> Please visit the office during business hours to collect your funds. Bring a valid ID for verification.</p>'
          : disbursementMethod === 'check'
          ? '<p><strong>Next Step:</strong> Your check is ready for pickup at the office. Please bring a valid ID.</p>'
          : '<p><strong>Next Step:</strong> The funds will be transferred to your registered bank account. Please allow 1-3 business days for processing.</p>'
        }
        <p>If you have any questions, feel free to contact us.</p>
    `
    : `
        <h2 style="color: #2563eb;">Your Donation Made a Difference! \uD83D\uDE4F</h2>
        <p>Dear ${recipientName},</p>
        <p>We\'re happy to let you know that <strong>\u20B1${amount.toLocaleString()}</strong> from your donation to <strong>${ORG_NAME}</strong> has been successfully disbursed to <strong>${beneficiaryName || 'a beneficiary'}</strong>.</p>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
          <p><strong>Your Contribution Used:</strong> \u20B1${amount.toLocaleString()}</p>
          <p><strong>Purpose:</strong> ${purpose}</p>
          ${beneficiaryName ? `<p><strong>Beneficiary:</strong> ${beneficiaryName}</p>` : ''}
        </div>
        <p>Thank you for your generosity. Your support is making a real impact in someone\'s life!</p>
        <p>We\'ll continue to keep you updated on how your donations are being used.</p>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${ORG_NAME} - ${subject}`,
    html: wrapEmailHtml(bodyHtml),
  });
}


export async function sendReceiptNotificationEmail(params: ReceiptNotificationParams) {
  const { to, donorName, beneficiaryName, purpose, amount, message, receiptUrls } = params;

  const receiptLinks = receiptUrls.length > 0
    ? receiptUrls
        .map((url, i) => `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Receipt ${i + 1}</a>`)
        .join(' &nbsp;|&nbsp; ')
    : '';

  const bodyHtml = `
      <h2 style="color: #16a34a;">Transparency Update: Receipt & Thank You \uD83D\uDE4F</h2>
      <p>Dear ${donorName},</p>
      <p>Great news! The beneficiary who received funds from your donation to <strong>${ORG_NAME}</strong> has submitted their receipt/proof of how the funds were used.</p>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p><strong>Beneficiary:</strong> ${beneficiaryName}</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p><strong>Your Contribution Used:</strong> \u20B1${amount.toLocaleString()}</p>
      </div>

      ${message ? `
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
        <p style="font-style: italic; color: #1e40af; margin: 0;">&ldquo;${message}&rdquo;</p>
        <p style="text-align: right; font-size: 12px; color: #6b7280; margin: 8px 0 0 0;">&mdash; ${beneficiaryName}</p>
      </div>
      ` : ''}

      ${receiptLinks ? `
      <div style="margin: 20px 0;">
        <p><strong>Receipt / Proof of Use:</strong></p>
        <p>${receiptLinks}</p>
      </div>
      ` : ''}

      <p>Thank you for your generosity. Your donation truly made a difference!</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${ORG_NAME} - Transparency Update: Receipt & Thank You`,
    html: wrapEmailHtml(bodyHtml),
  });
}