const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtppro.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  timeout: 10000, // 10 detik timeout
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000
});

// ========== EMAIL FUNCTIONS ==========
function generateVerificationCode() {
  return Math.floor(10 + Math.random() * 90).toString();
}

async function sendVerificationEmail(email, verificationCode) {
 try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Black Horse Puzzle - Email Verification Code (important)',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #046064, #0891b2); padding: 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 30px;">
              <h1 style="color: #046064; margin: 0; font-size: 2.5em;"> </h1>
              <h2 style="color: #046064; margin: 10px 0; font-size: 1.8em;">Black Horse Puzzle</h2>
            </div>
            
            <h3 style="color: #333; margin-bottom: 20px; font-size: 1.4em;">Your verification code</h3>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px; line-height: 1.6;">
              Welcome to Black Horse Puzzle!<br>
              Please use this verification code to complete your registration:
            </p>
            
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 3px dashed #046064; padding: 25px; margin: 25px 0; border-radius: 12px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #046064; font-size: 3em; margin: 0; letter-spacing: 10px; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                ${verificationCode}
              </h1>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                This code will expire in <strong>20 minutes</strong> for security reasons.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
              <p style="color: #046064; font-weight: bold; font-size: 1.1em; margin: 0;">
                Ready to tame the Black Horse? 
              </p>
              <p style="color: #666; font-size: 0.9em; margin: 10px 0 0 0;">
                Enter this code in the game to start your puzzle adventure!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">
              © 2025 Black Horse Puzzle - Adventure Awaits! 
            </p>
          </div>
        </div>
      `
    };
   
    await transporter.sendMail(mailOptions);
    //console.log(`[VERIF-CODE-EMAIL-SEND] To: ${normalizedEmail}, Code: ${verificationCode}`);
    console.log(`✅ Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Verification email error:', error);
    return false;
  }
}

async function sendSupportConfirmation(email, paymentDetails, paymentMethod = 'paypal') {
  try {
    let amount, transactionId;
    
    if (paymentMethod === 'paypal') {
      amount = paymentDetails.purchase_units[0].amount.value;
      transactionId = paymentDetails.id;
    } else if (paymentMethod === 'xsolla') {
      amount = paymentDetails.amount || paymentDetails.purchase_units[0].amount.value;
      transactionId = paymentDetails.transactionId || paymentDetails.id;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Black Horse Puzzle - Thank You for Your Support!',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #046064, #0891b2); padding: 20px; border-radius: 15px;">
          <div style="background: white; padding: 40px; border-radius: 15px; text-align: center;">
            <div style="margin-bottom: 30px;">
              <h1 style="color: #046064; margin: 0; font-size: 2.5em;">🐎</h1>
              <h2 style="color: #046064; margin: 10px 0;">Black Horse Puzzle</h2>
            </div>
            
            <div style="background: linear-gradient(135deg, #d4edda, #c3e6cb); border: 2px solid #28a745; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #155724; margin: 0;">🎉 Thank You!</h2>
            </div>
            
            <div style="background: #f8f9fa; border: 2px solid #046064; padding: 20px; margin: 20px 0; border-radius: 10px;">
              <h3 style="color: #046064; margin-bottom: 15px;">💝 Support Details</h3>
              <p style="color: #28a745; font-size: 1.5em; font-weight: bold; margin: 10px 0;">$${amount} USD</p>
              <p style="color: #666; margin: 5px 0;">Payment Method: ${paymentMethod.toUpperCase()}</p>
              <p style="color: #666; margin: 5px 0;">Transaction ID: ${transactionId}</p>
              <p style="color: #666; margin: 5px 0;">Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p style="color: #666; font-size: 16px; margin: 20px 0; line-height: 1.6;">
              Your generous support helps us continue developing Black Horse Puzzle 
              and creating more amazing puzzle experiences! 🧩✨
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${process.env.GAME_URL || 'http://localhost:10000'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #046064, #0891b2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 1.1em;">
                🚀 CONTINUE PLAYING
              </a>
            </div>
            
            <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                🐎 You're amazing! Thank you for being part of our puzzle community!<br>
                <strong>Happy puzzling! 🤠</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Support confirmation sent to: ${email} (${paymentMethod})`);
    return true;
  } catch (error) {
    console.error('❌ Support confirmation error:', error);
    return false;
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendSupportConfirmation
};