# 🎯 STRIPE SANDBOX TEST PAYMENT SETUP - SUPER DETAILED GUIDE

## 📋 What You'll Achieve
After following this guide, you'll have:
- ✅ Stripe test account (no business verification needed)
- ✅ Test payment system working
- ✅ Fake credit cards that simulate real payments
- ✅ Complete subscription system testing

---

## 🚀 STEP 1: Create Stripe Account (5 minutes)

### 1.1 Go to Stripe Website
- Open your browser
- Go to: https://dashboard.stripe.com/register
- Click "Create account"

### 1.2 Fill Registration Form
```
Email: youremail@gmail.com
Full name: Your Name
Country: United States (select this even if you're in Pakistan)
Password: Create a strong password
```

### 1.3 Verify Email
- Check your email inbox
- Click the verification link from Stripe
- Return to Stripe dashboard

### 1.4 Skip Business Verification
- Stripe will ask for business details
- Click "Skip for now" or "I'll do this later"
- You can use test mode without verification

---

## 🔧 STEP 2: Get Your API Keys (3 minutes)

### 2.1 Navigate to API Keys
- In Stripe dashboard, look at left sidebar
- Click "Developers"
- Click "API keys"

### 2.2 Copy Test Keys
You'll see two keys:

**Publishable Key (starts with pk_test_):**
```
pk_test_51234567890abcdef...
```
- Click "Copy" button
- Save this in notepad

**Secret Key (starts with sk_test_):**
- Click "Reveal test key token"
- Click "Copy" button  
- Save this in notepad

### 2.3 Important Notes
- ✅ These are TEST keys (safe to use)
- ✅ No real money will be charged
- ✅ You can share test keys (they're not sensitive)

---

## 💰 STEP 3: Create Products & Pricing (5 minutes)

### 3.1 Go to Products Section (Updated for Current Stripe Interface)
**Option 1 - Product Catalog:**
- In left sidebar, click **"Product catalog"**
- Click **"+ Create product"** button

**Option 2 - Through Subscriptions:**
- Click **"Subscriptions"** (in shortcuts section)
- Look for **"Create product"** or **"Add product"**

**Option 3 - More Menu:**
- Click **"More"** → **"Products"**
- Click **"+ Create product"**

### 3.2 Create Standard Plan
```
Product Name: Standard Plan
Description: Perfect for growing creators

Pricing Model: Recurring
Price: $10.00
Billing Period: Monthly
Currency: USD
```
- Click "Save product"
- **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

### 3.3 Create Premium Plan
- Click "Add product" again
```
Product Name: Premium Plan  
Description: For teams and businesses

Pricing Model: Recurring
Price: $25.00
Billing Period: Monthly
Currency: USD
```
- Click "Save product"
- **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

### 3.4 Your Price IDs Should Look Like:
```
Standard: price_1234567890abcdef
Premium: price_0987654321fedcba
```

---

## 🔗 STEP 4: Setup Webhooks (7 minutes)

### 4.1 What are Webhooks?
Webhooks tell your app when payments succeed/fail. Without them, your app won't know when users pay.

### 4.2 Install Ngrok (for local testing)
Open command prompt and run:
```bash
npm install -g ngrok
```

**⚠️ NGROK AUTHENTICATION REQUIRED:**
If you get authentication error, do this:
1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken
3. Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`
4. Then continue with the steps below

**🔄 ALTERNATIVE - Skip Webhooks for Initial Testing:**
You can test payments without webhooks first:
- Skip to Step 5 (Configure Application)
- Use mock payment mode in your app
- Set up webhooks later when ready

### 4.3 Start Your Backend Server
```bash
cd "d:\FYP\fyp 1\backend"
npm run dev
```
- Your server should start on port 5000

### 4.4 Expose Server with Ngrok
Open another command prompt:
```bash
ngrok http 5000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5000
```
**COPY THE HTTPS URL** (abc123.ngrok.io part)

### 4.5 Create Webhook in Stripe
- Go back to Stripe dashboard
- Left sidebar → "Developers" → "Webhooks"
- Click "Add endpoint"

### 4.6 Configure Webhook
```
Endpoint URL: https://abc123.ngrok.io/api/subscriptions/webhooks
Description: Subscription events
```

### 4.7 Select Events
Click "Select events" and choose:
- ✅ checkout.session.completed
- ✅ customer.subscription.created  
- ✅ customer.subscription.updated
- ✅ customer.subscription.deleted
- ✅ invoice.payment_succeeded
- ✅ invoice.payment_failed

Click "Add endpoint"

### 4.8 Get Webhook Secret
- Click on your newly created webhook
- Click "Reveal" next to "Signing secret"
- **COPY THE SECRET** (starts with `whsec_`)

---

## ⚙️ STEP 5: Configure Your Application (3 minutes)

### 5.1 Install Stripe Package
```bash
cd "d:\FYP\fyp 1\backend"
npm install stripe
```

### 5.2 Update Environment Variables
Create/edit `backend/.env` file:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE  
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE

# Stripe Price IDs (from products you created)
STRIPE_STANDARD_PRICE_ID=price_YOUR_STANDARD_PRICE_ID_HERE
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_PRICE_ID_HERE

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 5.3 Restart Your Server
- Stop your backend server (Ctrl+C)
- Start it again: `npm run dev`

---

## 🧪 STEP 6: Test Credit Cards (USE THESE!)

### 6.1 Stripe Test Cards
These are fake cards that simulate different payment scenarios:

**✅ Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any postal code)
```

**❌ Declined Payment:**
```
Card Number: 4000 0000 0000 0002
Expiry: 12/34
CVC: 123
ZIP: 12345
```

**🔐 Requires Authentication:**
```
Card Number: 4000 0025 0000 3155
Expiry: 12/34
CVC: 123
ZIP: 12345
```

### 6.2 More Test Cards
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005
- **Discover**: 6011 1111 1111 1117

---

## 🎮 STEP 7: Test the Complete Flow (10 minutes)

### 7.1 Start Both Servers
```bash
# Terminal 1: Backend
cd "d:\FYP\fyp 1\backend"
npm run dev

# Terminal 2: Frontend  
cd "d:\FYP\fyp 1\frontend"
npm run dev

# Terminal 3: Ngrok (keep running)
ngrok http 5000
```

### 7.2 Test User Registration
1. Go to http://localhost:5173
2. Sign up with a new email
3. ✅ User should get 30-day free trial automatically

### 7.3 Test Trial Expiration (Quick Test)
Method 1 - Database Edit:
1. Open MongoDB Compass or your database
2. Find your user's subscription
3. Change `endDate` to yesterday's date
4. Refresh your app - should show expired

Method 2 - Wait 30 days (not practical 😄)

### 7.4 Test Payment Flow
1. Click "Upgrade to Standard" button
2. Should redirect to Stripe checkout page
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. ✅ Should redirect back to your app
6. ✅ Subscription should show as "Active"

### 7.5 Check Stripe Dashboard
- Go to Stripe dashboard
- Click "Payments" in left sidebar
- ✅ You should see your test payment
- Click "Customers" - should see your test customer
- Click "Subscriptions" - should see active subscription

---

## 🐛 STEP 8: Troubleshooting Common Issues

### Issue 1: "Stripe not configured" Error
**Solution:**
- Check `.env` file has correct keys
- Restart backend server after adding keys
- Make sure keys start with `sk_test_` and `pk_test_`

### Issue 2: Webhook not receiving events
**Solution:**
- Make sure ngrok is running
- Check webhook URL in Stripe matches ngrok URL
- Look at Stripe webhook logs for errors
- Verify webhook secret is correct

### Issue 3: Payment succeeds but subscription not updated
**Solution:**
- Check backend console for errors
- Verify webhook is receiving events
- Check database connection
- Make sure User ID mapping is correct

### Issue 4: Frontend can't connect to Stripe
**Solution:**
- Add publishable key to frontend environment
- Check CORS settings allow frontend domain
- Verify frontend URL in backend .env

---

## 🎯 STEP 9: Verify Everything Works

### 9.1 Test Checklist
Run through this complete flow:

1. ✅ User signs up → Gets free trial
2. ✅ Trial expires → Access blocked  
3. ✅ Click upgrade → Stripe checkout opens
4. ✅ Enter test card → Payment processes
5. ✅ Webhook receives event → Subscription updated
6. ✅ User gets access → Can use all features
7. ✅ Subscription shows "Active" → Correct status display

### 9.2 Check Stripe Dashboard
- ✅ Payment appears in "Payments" section
- ✅ Customer appears in "Customers" section  
- ✅ Subscription appears in "Subscriptions" section
- ✅ Webhook shows successful delivery

---

## 📊 STEP 10: Monitor Your Test Payments

### 10.1 Stripe Dashboard Sections
- **Payments**: See all test transactions
- **Customers**: Manage test customers
- **Subscriptions**: View active/cancelled subscriptions
- **Webhooks**: Monitor webhook delivery
- **Logs**: Debug webhook issues

### 10.2 Useful Stripe Tools
- **Event Explorer**: See all webhook events
- **Webhook Logs**: Debug failed webhooks  
- **Test Clock**: Simulate time passing for subscriptions
- **Payment Links**: Create quick payment links for testing

---

## 🚀 STEP 11: Ready for Production?

### When You're Ready for Real Money:
1. **Get Stripe Account Verified** (through friend/partner in supported country)
2. **Switch to Live Keys** (start with `sk_live_` and `pk_live_`)
3. **Update Webhook URLs** to production domain
4. **Test with Small Amounts** first ($1-2)
5. **Monitor Everything** closely

### Alternative for Pakistan:
- **Keep using test mode** indefinitely for demonstration
- **Integrate JazzCash/EasyPaisa** for local payments
- **Use PayPal** if you have business account
- **Partner with someone** in Stripe-supported country

---

## 🎉 CONGRATULATIONS!

You now have a fully working Stripe sandbox environment where:
- ✅ Users can sign up and get 30-day free trials
- ✅ Trials automatically expire after 30 days  
- ✅ Users are forced to pay to continue using the platform
- ✅ All payments are simulated (no real money)
- ✅ You can test unlimited scenarios with test cards
- ✅ Webhooks update subscriptions automatically

**Your subscription system is now complete and ready for testing!** 🎯

---

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Look at Stripe dashboard logs
3. Check your backend console for errors
4. Verify all environment variables are set correctly
5. Make sure ngrok is running for local testing

**Happy Testing!** 🚀