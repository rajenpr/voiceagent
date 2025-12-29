# Demo Session Setup Guide

## Overview

This guide covers setting up **live demo phone numbers** that potential customers can call to test your Voice AI service before buying. This is a proven pre-sales strategy that significantly increases conversion rates.

## Why Demo Numbers?

### Conversion Benefits
- **Show, Don't Tell**: Prospects experience the product firsthand
- **Builds Trust**: Demonstrates the technology works as advertised
- **Reduces Friction**: No signup required - just call and try
- **Industry-Specific**: Showcases customization for their use case

### Typical Conversion Impact
```
Without Demo: 2-5% landing page → paid customer
With Demo:    15-30% demo call → paid customer (3-6x improvement)
```

## Demo Architecture

### Three Pre-Configured Demo Sessions

We've created three industry-specific demos:

```
┌─────────────────────────────────────────────────────────┐
│  Demo 1: DENTAL OFFICE                                  │
│  Business: Smile Dental Demo                            │
│  Phone: +1-415-XXX-XXXX                                 │
│  Shows: Appointment booking, service info, scheduling   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Demo 2: LAW FIRM                                       │
│  Business: Justice Law Firm Demo                        │
│  Phone: +1-213-XXX-XXXX                                 │
│  Shows: Lead qualification, consultation booking        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Demo 3: REAL ESTATE                                    │
│  Business: Premier Realty Demo                          │
│  Phone: +1-212-XXX-XXXX                                 │
│  Shows: Buyer/seller qualification, property info       │
└─────────────────────────────────────────────────────────┘
```

## Quick Setup (Automated)

### Prerequisites

1. **Backend running** on your VPS:
   ```bash
   cd /home/user/voiceagent/backend
   source venv/bin/activate
   python -m app.main
   ```

2. **Environment configured** (`.env` file):
   ```bash
   BASE_URL=http://YOUR_VPS_IP:8000
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxx
   GROQ_API_KEY=gsk_xxxxxxxxxx
   ```

3. **Twilio account** with available credit

### One-Command Setup

```bash
cd /home/user/voiceagent/backend
source venv/bin/activate

# Set up all 3 demo numbers at once
python setup_demo_sessions.py --setup-all
```

**What happens:**
1. ✅ Creates 3 sessions (dental, legal, real estate)
2. ✅ Purchases 3 Twilio phone numbers (~$3.45/month total)
3. ✅ Configures webhooks automatically
4. ✅ Saves demo info to `demo_sessions.json`
5. ✅ Outputs phone numbers and marketing copy

**Expected output:**
```
======================================================================
🎉 ALL DEMOS SET UP SUCCESSFULLY!
======================================================================

📞 Your Demo Phone Numbers:

   DENTAL       → +1-415-555-1234
                 (Smile Dental Demo)

   LEGAL        → +1-213-555-5678
                 (Justice Law Firm Demo)

   REALESTATE   → +1-212-555-9012
                 (Premier Realty Demo)

💰 Monthly Cost:
   3 phone numbers × $1.15 = $3.45/month
   (+ ~$0.04 per demo call)

💡 Next Steps:
   1. Call each number to test
   2. Add to your website/landing page
   3. Share in marketing materials
   4. Monitor conversion rate (demos → paid customers)
```

### Individual Demo Setup

To set up just one demo:

```bash
# Dental only
python setup_demo_sessions.py --industry dental

# Legal only
python setup_demo_sessions.py --industry legal

# Real estate only
python setup_demo_sessions.py --industry realestate
```

## Manual Setup (Step-by-Step)

If you prefer manual control or need to troubleshoot:

### Step 1: Create Demo Session

```bash
curl -X POST http://YOUR_VPS_IP:8000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Smile Dental Demo",
    "industry": "Healthcare - Dental",
    "primary_goal": "Book Appointments",
    "system_instructions": "You are a friendly dental receptionist for Smile Dental Demo. [Full instructions in setup_demo_sessions.py]"
  }'
```

Save the returned `session_id`.

### Step 2: Purchase Twilio Number

1. Go to: https://console.twilio.com/
2. **Phone Numbers → Buy a number**
3. Choose area code (415 for dental, 213 for legal, 212 for real estate)
4. Click **Buy**

### Step 3: Configure Webhook

1. Go to purchased number settings
2. **Voice & Fax → A Call Comes In:**
   - Webhook: `http://YOUR_VPS_IP:8000/api/twilio/voice/incoming/SESSION_ID`
   - Method: POST
3. **Call Status Changes:**
   - Webhook: `http://YOUR_VPS_IP:8000/api/twilio/voice/status`
   - Method: POST
4. Save

### Step 4: Test

Call the number and verify:
1. Greeting plays immediately
2. AI responds to your questions
3. Booking flow works
4. At end: "This was a demo" reveal

## Adding Demo Numbers to Your Website

### Update Frontend Component

After running setup, you'll have phone numbers. Update the frontend:

**File:** `/home/user/voiceagent/frontend/components/DemoPhones.tsx`

Replace placeholder phone numbers:

```typescript
const DEMO_PHONES: DemoPhone[] = [
  {
    industry: 'Healthcare',
    businessName: 'Smile Dental Demo',
    phoneNumber: '+1-415-555-1234',  // ← Update this
    description: 'Experience AI-powered dental appointment booking',
    icon: '🦷',
    accentColor: '#0066FF',
  },
  {
    industry: 'Legal Services',
    businessName: 'Justice Law Firm Demo',
    phoneNumber: '+1-213-555-5678',  // ← Update this
    description: 'See AI handle legal intake and consultation booking',
    icon: '⚖️',
    accentColor: '#7C3AED',
  },
  {
    industry: 'Real Estate',
    businessName: 'Premier Realty Demo',
    phoneNumber: '+1-212-555-9012',  // ← Update this
    description: 'Experience AI qualifying real estate leads',
    icon: '🏠',
    accentColor: '#059669',
  },
];
```

### Deploy Frontend

```bash
cd /home/user/voiceagent/frontend
npm run build
```

Your website will now show clickable demo phone numbers!

## Marketing the Demo Numbers

### On Your Landing Page

The `DemoPhones` component is already integrated. It displays:
- ✅ Three clickable phone cards with prominent numbers
- ✅ Industry-specific colors and icons
- ✅ Mobile tap-to-call functionality
- ✅ "What to expect" guide
- ✅ Live status indicator

### In Marketing Materials

**Email campaigns:**
```
Subject: Try our AI receptionist - Call now (no signup)

Want to see if AI can handle your [industry] calls?

Call our live demo: +1-XXX-XXX-XXXX

Experience:
✓ Natural conversation
✓ Appointment booking
✓ Question answering
✓ 24/7 availability

No signup. No credit card. Just call and talk.
```

**Social media posts:**
```
🤖 Skeptical about AI receptionists?

Call our LIVE demo right now:
📞 +1-XXX-XXX-XXXX

Ask it anything. Try to stump it. See if you can tell it's not human.

Free to try • No signup • Works 24/7

[Link to your site]
```

**LinkedIn/Twitter bio:**
```
Voice AI for modern businesses
📞 Try it: +1-XXX-XXX-XXXX (live demo)
```

### Sales Calls

When prospecting:
```
"Rather than explaining how it works, why don't you just
call this number right now while we're on the call?

+1-XXX-XXX-XXXX

Ask it to book an appointment or answer questions about
[their industry]. I'll stay on the line."
```

## Demo Configuration Details

### Dental Demo Features

**Configured to handle:**
- Appointment booking (collects: name, phone, date, reason)
- Service inquiries (general, cosmetic, emergency)
- Pricing questions
- Insurance acceptance
- New patient specials
- Emergency escalation

**System prompt highlights:**
- Warm, empathetic tone
- Collects all necessary booking info
- Mentions specific dentists by name
- Promotes new patient special
- Ends with demo reveal

### Legal Demo Features

**Configured to handle:**
- Practice area determination
- Case urgency assessment
- Lead qualification
- Consultation scheduling
- Fee structure explanation (contingency vs hourly)
- Confidential tone

**System prompt highlights:**
- Professional, empathetic
- Never gives legal advice
- Explains free consultation
- Mentions specific attorneys
- Sensitive matter handling
- Ends with demo reveal

### Real Estate Demo Features

**Configured to handle:**
- Buyer vs seller identification
- Budget qualification
- Neighborhood preferences
- Property showing scheduling
- Home evaluation booking
- Current market updates

**System prompt highlights:**
- Enthusiastic but not pushy
- Collects key qualification data
- Mentions specific listings
- Virtual tours available
- Market statistics
- Ends with demo reveal

## Monitoring Demo Performance

### Track Demo Calls

View all demo activity:

```bash
# Get platform overview (includes demo calls)
curl http://YOUR_VPS_IP:8000/api/admin/stats/overview

# Get specific demo session stats
curl http://YOUR_VPS_IP:8000/api/admin/client/SESSION_ID/stats
```

### Twilio Call Logs

1. Go to: https://console.twilio.com/us1/monitor/logs/calls
2. Filter by demo phone numbers
3. View:
   - Total calls received
   - Average call duration
   - Call recordings (if enabled)
   - Costs

### Key Metrics to Track

```
Demo Conversion Funnel:

Website Visitors        →  1000
Demo Page Views         →   300 (30%)
Demo Call Attempts      →    50 (16% of views)
Demo Calls Completed    →    45 (90% completion)
Paid Signups            →    12 (26% conversion) ✅

Revenue Impact:
12 signups × $199/month = $2,388/month
Demo cost: $3.45/month + ($0.04 × 45 calls) = $5.25/month
ROI: 45,433% 🚀
```

### Enable Call Recording (Optional)

To review demo conversations:

```python
# In twilio_voice_service.py, add to TwiML response:
response.record(
    recording_status_callback=f"{base_url}/api/twilio/recording/callback",
    recording_status_callback_method='POST'
)
```

## Cost Analysis

### Fixed Costs (Monthly)

```
3 demo phone numbers × $1.15 = $3.45/month
```

### Variable Costs (Per Demo Call)

```
Twilio voice: ~$0.026/minute
Average demo call: 3-5 minutes
Cost per call: ~$0.078-0.13

Plus:
Groq LLM: ~$0.0005/call

Total per demo call: ~$0.08-0.13
```

### Monthly Cost Examples

```
Low usage (30 demo calls/month):
- Fixed: $3.45
- Variable: $4.00
- Total: ~$7.45/month

Medium usage (100 demo calls/month):
- Fixed: $3.45
- Variable: $13.00
- Total: ~$16.45/month

High usage (500 demo calls/month):
- Fixed: $3.45
- Variable: $65.00
- Total: ~$68.45/month
```

### ROI Calculation

Assuming 25% conversion (demo call → paid customer):

```
100 demo calls/month
× 25% conversion
= 25 new customers

25 customers × $199/month = $4,975/month revenue
Demo cost: $16.45/month
ROI: 30,138% 🎉

Even at 10% conversion:
10 customers × $199 = $1,990/month revenue
ROI: 12,096% 📈
```

## Customizing Demo Prompts

### Editing Demo Instructions

**File:** `backend/setup_demo_sessions.py`

Find `DEMO_CONFIGS` dict and edit `system_instructions`:

```python
DEMO_CONFIGS = {
    "dental": {
        "system_instructions": """
        You are a friendly dental receptionist...

        [Add your customizations here]

        - Mention: "We're running a spring promotion..."
        - Emphasize: "We accept most insurance plans..."
        """,
    }
}
```

Then re-run setup:
```bash
python setup_demo_sessions.py --industry dental
```

### Adding Your Own Demo

Create a new industry in `DEMO_CONFIGS`:

```python
DEMO_CONFIGS = {
    # ... existing demos ...

    "restaurant": {
        "business_name": "Gourmet Bistro Demo",
        "industry": "Restaurant",
        "primary_goal": "Take Reservations",
        "demo_description": "Experience AI handling restaurant reservations",
        "system_instructions": """
        You are a host at Gourmet Bistro Demo.

        Take reservations:
        - Name, party size, date, time
        - Special requests (allergies, occasions)

        Answer questions about:
        - Menu items
        - Hours (Lunch 11-3, Dinner 5-10)
        - Dress code (Smart casual)

        At end: Reveal this was a demo.
        """,
        "preferred_area_code": "310",  # LA
        "knowledge_base": {
            "menu_highlights": [
                "Signature: Truffle Pasta - $28",
                "Wagyu Steak - $65",
                "Seasonal Tasting Menu - $85",
            ]
        }
    }
}
```

## Troubleshooting

### Demo Number Not Answering

**Check:**
1. Backend is running: `curl http://YOUR_IP:8000/`
2. Firewall allows port 8000: `sudo ufw status`
3. Webhook configured correctly in Twilio
4. Check Twilio debugger: https://console.twilio.com/us1/monitor/logs/debugger

**Quick fix:**
```bash
# Restart backend
cd /home/user/voiceagent/backend
source venv/bin/activate
python -m app.main

# Verify webhook
curl -X POST "http://YOUR_IP:8000/api/twilio/voice/incoming/SESSION_ID" \
  -d "CallSid=TEST"
```

### AI Doesn't Sound Right

**Edit system instructions** in `setup_demo_sessions.py` and re-run:

```bash
python setup_demo_sessions.py --industry dental
```

### Phone Number Too Expensive

Twilio numbers cost $1.15/month. If you need cheaper:
- Use toll-free numbers instead ($2/month but more professional)
- Or use just 1 demo number for all industries
- Or use local numbers in cheaper regions

### Demo Calls Not Converting

**Improve conversion:**
1. **Add urgency**: "Sign up this week, get 50% off first month"
2. **Better reveal**: At end, AI should clearly explain how to sign up
3. **Follow-up**: Capture caller phone number, send SMS follow-up
4. **Track closely**: Which demo converts best? Focus on that one

## Advanced: Demo Call Tracking

### Add Phone Number Capture

Update `twilio_voice_service.py` to save caller numbers:

```python
# In incoming call handler
caller_number = form_data.get("From")

# Save to database or file for follow-up
with open("demo_callers.csv", "a") as f:
    f.write(f"{datetime.now()},{caller_number},{session_id}\n")
```

### Send Follow-up SMS

After demo call ends:

```python
# In call status handler, when status == "completed"
if session_id in DEMO_SESSION_IDS:
    client.messages.create(
        to=caller_number,
        from_=twilio_phone_number,
        body="Thanks for trying our AI demo! Get 50% off your first month: https://yoursite.com/signup?demo=true"
    )
```

## Next Steps

1. ✅ Run `setup_demo_sessions.py --setup-all`
2. ✅ Test each demo number yourself
3. ✅ Update `DemoPhones.tsx` with real phone numbers
4. ✅ Deploy frontend: `npm run build`
5. ✅ Add demo numbers to all marketing materials
6. 📊 Track conversion metrics weekly
7. 🚀 Optimize based on data

## Success Metrics

Track these weekly:

```
✅ Demo calls received
✅ Average call duration (longer = more engaged)
✅ Demo → paid customer conversion %
✅ Cost per demo call
✅ Cost per acquisition (demo cost / new customers)
✅ ROI (revenue from demo customers / demo costs)
```

**Target benchmarks:**
- Demo call duration: 2-5 minutes ✅
- Demo → customer: 15-30% ✅
- Cost per acquisition: < $20 ✅
- ROI: > 1000% ✅

---

**You now have a world-class demo system that lets prospects try before they buy!** 🎉

The best part? Once set up, these demos run 24/7 with zero maintenance. Every call is a potential customer, and the AI never sleeps.
