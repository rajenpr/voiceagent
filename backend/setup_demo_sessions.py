#!/usr/bin/env python3
"""
Demo Session Setup Script

Creates 2-3 demo sessions for potential customers to try the service.
Demo numbers showcase different industries and use cases.

Usage:
    python setup_demo_sessions.py --setup-all
    python setup_demo_sessions.py --industry dental
"""

import os
import sys
import argparse
import requests
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# Load environment variables
load_dotenv()

# Demo configurations for different industries
DEMO_CONFIGS = {
    "dental": {
        "business_name": "Smile Dental Demo",
        "industry": "Healthcare - Dental",
        "primary_goal": "Book Appointments",
        "demo_description": "Experience AI-powered dental appointment booking",
        "system_instructions": """You are a friendly dental receptionist for Smile Dental Demo.

Key Information:
- Office Hours: Monday-Friday 9 AM - 6 PM, Saturday 9 AM - 2 PM
- Services: General Dentistry, Cosmetic Dentistry, Emergency Care, Teeth Whitening
- Dentists: Dr. Sarah Johnson (General), Dr. Michael Chen (Cosmetic)
- Location: 123 Main Street, San Francisco, CA 94102
- Phone: The number the caller is calling
- New Patient Special: Free consultation + $50 off first cleaning

Your Role:
1. Greet callers warmly and ask how you can help
2. Book appointments (collect: name, phone, preferred date/time, reason for visit)
3. Answer questions about services, pricing, insurance
4. Handle emergency dental needs with urgency
5. Confirm all details before ending the call

Demo Note: This is a demonstration. At the end, inform caller this was an AI demo and invite them to learn more at your website.

Be natural, empathetic, and efficient. Speak clearly and professionally.""",
        "preferred_area_code": "415",  # San Francisco
        "knowledge_base": {
            "services": [
                "General Dentistry - $150-300",
                "Teeth Whitening - $400",
                "Crowns & Bridges - $1200-2000",
                "Root Canal - $800-1500",
                "Emergency Care - $200+",
            ],
            "insurance": "We accept Delta Dental, MetLife, Cigna, Aetna, and most major insurance plans",
            "payment": "Cash, Credit/Debit cards, CareCredit financing available",
        }
    },

    "legal": {
        "business_name": "Justice Law Firm Demo",
        "industry": "Legal Services",
        "primary_goal": "Qualify Leads & Schedule Consultations",
        "demo_description": "See AI handle legal intake and consultation booking",
        "system_instructions": """You are a professional legal intake specialist for Justice Law Firm Demo.

Key Information:
- Practice Areas: Personal Injury, Family Law, Estate Planning, Business Law
- Attorneys: Sarah Martinez (Personal Injury), David Thompson (Family Law), Jennifer Lee (Estate Planning)
- Office Hours: Monday-Friday 8:30 AM - 5:30 PM
- Location: 456 Legal Plaza, Suite 300, Los Angeles, CA 90012
- Free Initial Consultation: Yes, for all practice areas

Your Role:
1. Professionally greet callers and ask about their legal matter
2. Determine practice area and urgency
3. Collect basic information: name, contact, case type, brief description
4. Schedule free consultation with appropriate attorney
5. Explain our no-win-no-fee policy for personal injury cases
6. Handle sensitive matters with confidentiality and empathy

Demo Note: This is a demonstration of AI-powered legal intake. At the end, let caller know this was a demo.

Maintain attorney-client privilege tone. Be empathetic but professional. Never give legal advice.""",
        "preferred_area_code": "213",  # Los Angeles
        "knowledge_base": {
            "practice_areas": [
                "Personal Injury - Car accidents, slip & fall, workplace injury",
                "Family Law - Divorce, custody, child support",
                "Estate Planning - Wills, trusts, probate",
                "Business Law - Contracts, LLC formation, disputes",
            ],
            "fees": "Contingency fee (no-win-no-fee) for personal injury. Hourly rates for other services: $300-500/hour",
            "consultation": "All initial consultations are FREE",
        }
    },

    "realestate": {
        "business_name": "Premier Realty Demo",
        "industry": "Real Estate",
        "primary_goal": "Qualify Buyers/Sellers & Schedule Showings",
        "demo_description": "Experience AI qualifying real estate leads",
        "system_instructions": """You are an enthusiastic real estate assistant for Premier Realty Demo.

Key Information:
- Brokerage: Premier Realty (Luxury residential & commercial)
- Top Agent: Jessica Williams (15 years experience, $50M+ in sales)
- Service Areas: Manhattan, Brooklyn, Queens
- Office: 789 Park Avenue, New York, NY 10021
- Specialties: Luxury condos, townhouses, investment properties

Your Role:
1. Warmly greet callers and determine if they're buying, selling, or renting
2. For Buyers:
   - Budget range
   - Preferred neighborhoods
   - Bedrooms/bathrooms needed
   - Timeline to purchase
   - Schedule property showing
3. For Sellers:
   - Property address and type
   - Desired price
   - Reason for selling
   - Timeline
   - Schedule home evaluation
4. Highlight current market conditions (strong seller's market)
5. Mention virtual tours available

Demo Note: This is an AI demonstration. At end of call, let caller know and invite them to visit your website.

Be enthusiastic but not pushy. Focus on understanding client needs. Build rapport quickly.""",
        "preferred_area_code": "212",  # New York
        "knowledge_base": {
            "current_listings": [
                "3BR Luxury Condo - Upper East Side - $2.5M",
                "2BR Townhouse - Brooklyn Heights - $1.8M",
                "Studio - Midtown - $650K",
                "4BR Penthouse - Tribeca - $5.2M",
            ],
            "market": "Strong seller's market. Average days on market: 22. Homes selling 5-10% above asking",
            "commission": "Standard 5-6% seller commission. Buyer representation at no cost to buyer",
        }
    }
}


class DemoSessionSetup:
    def __init__(self):
        self.base_url = os.getenv("BASE_URL", "http://localhost:8000")
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_client = None

        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)

        # File to store demo session info
        self.demo_file = "demo_sessions.json"
        self.load_demo_sessions()

    def load_demo_sessions(self):
        """Load existing demo sessions"""
        if os.path.exists(self.demo_file):
            try:
                with open(self.demo_file, 'r') as f:
                    self.demo_sessions = json.load(f)
            except:
                self.demo_sessions = {}
        else:
            self.demo_sessions = {}

    def save_demo_sessions(self):
        """Save demo sessions to file"""
        with open(self.demo_file, 'w') as f:
            json.dump(self.demo_sessions, f, indent=2)

    def create_demo_session(self, industry: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a demo session"""
        print(f"\n{'='*70}")
        print(f"🎯 SETTING UP DEMO: {config['business_name']}")
        print(f"{'='*70}\n")

        # Create session via API
        print("📝 Creating demo session...")
        payload = {
            "business_name": config["business_name"],
            "industry": config["industry"],
            "primary_goal": config["primary_goal"],
            "system_instructions": config.get("system_instructions")
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/session/create",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            session_data = response.json()
            session_id = session_data['session_id']

            print(f"✅ Demo session created!")
            print(f"   Session ID: {session_id}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create session: {e}")
            return None

        # Purchase phone number if Twilio is configured
        phone_number = None
        if self.twilio_client:
            phone_number = self.purchase_demo_number(
                config["preferred_area_code"],
                session_id
            )
        else:
            print("\n⚠️  Twilio not configured. You'll need to manually:")
            print(f"   1. Purchase a phone number")
            print(f"   2. Configure webhook: {self.base_url}/api/twilio/voice/incoming/{session_id}")

        # Save demo session info
        demo_info = {
            "industry": industry,
            "session_id": session_id,
            "phone_number": phone_number,
            "business_name": config["business_name"],
            "description": config["demo_description"],
            "webhook_url": f"{self.base_url}/api/twilio/voice/incoming/{session_id}",
            "knowledge_base": config.get("knowledge_base", {}),
        }

        self.demo_sessions[industry] = demo_info
        self.save_demo_sessions()

        self.print_demo_summary(industry, demo_info)

        return demo_info

    def purchase_demo_number(self, area_code: str, session_id: str) -> str:
        """Purchase phone number for demo"""
        print(f"\n📞 Purchasing demo phone number (area code: {area_code})...")

        try:
            # Search for available numbers
            available = self.twilio_client.available_phone_numbers('US') \
                .local.list(area_code=area_code, limit=5)

            if not available:
                print(f"⚠️  No numbers available for area code {area_code}, trying any US number...")
                available = self.twilio_client.available_phone_numbers('US') \
                    .local.list(limit=5)

            if not available:
                print("❌ No phone numbers available")
                return None

            # Purchase first available
            selected = available[0]
            print(f"   Found: {selected.phone_number}")

            incoming = self.twilio_client.incoming_phone_numbers.create(
                phone_number=selected.phone_number,
                friendly_name=f"DEMO - {session_id[:8]}"
            )

            phone_number = incoming.phone_number
            print(f"✅ Phone number purchased: {phone_number}")

            # Configure webhook
            webhook_url = f"{self.base_url}/api/twilio/voice/incoming/{session_id}"
            status_url = f"{self.base_url}/api/twilio/voice/status"

            self.twilio_client.incoming_phone_numbers(incoming.sid).update(
                voice_url=webhook_url,
                voice_method='POST',
                status_callback=status_url,
                status_callback_method='POST'
            )

            print(f"✅ Webhook configured automatically")

            return phone_number

        except TwilioRestException as e:
            print(f"❌ Twilio error: {e}")
            return None

    def print_demo_summary(self, industry: str, demo_info: Dict[str, Any]):
        """Print demo setup summary"""
        print(f"\n{'='*70}")
        print(f"✅ DEMO SETUP COMPLETE: {industry.upper()}")
        print(f"{'='*70}")

        print(f"\n📋 Demo Details:")
        print(f"   Business: {demo_info['business_name']}")
        print(f"   Description: {demo_info['description']}")
        print(f"   Session ID: {demo_info['session_id']}")

        if demo_info['phone_number']:
            print(f"\n📞 Demo Phone Number:")
            print(f"   {demo_info['phone_number']}")
            print(f"\n   ⚡ READY TO TEST - Call this number now!")

        print(f"\n🔗 Webhook URL:")
        print(f"   {demo_info['webhook_url']}")

        print(f"\n🎯 Use Case:")
        print(f"   {demo_info['description']}")

        print(f"\n💡 Marketing Copy:")
        print(f"   'Call {demo_info['phone_number']} to experience our AI in action!'")
        print(f"   'See how our voice AI handles {industry} appointments in real-time'")

        print(f"\n{'='*70}\n")

    def setup_all_demos(self):
        """Set up all demo sessions"""
        print("\n" + "="*70)
        print("🚀 SETTING UP ALL DEMO SESSIONS")
        print("="*70)
        print("\nThis will create 3 demo numbers for:")
        print("  1. Dental Office")
        print("  2. Law Firm")
        print("  3. Real Estate Agency")
        print("\nCost: ~$3.45/month ($1.15 × 3 numbers)")
        print("\nPress Enter to continue or Ctrl+C to cancel...")
        input()

        results = {}
        for industry, config in DEMO_CONFIGS.items():
            result = self.create_demo_session(industry, config)
            if result:
                results[industry] = result

        self.print_final_summary(results)
        return results

    def print_final_summary(self, results: Dict[str, Any]):
        """Print final summary of all demos"""
        print("\n" + "="*70)
        print("🎉 ALL DEMOS SET UP SUCCESSFULLY!")
        print("="*70)

        print("\n📞 Your Demo Phone Numbers:\n")

        for industry, info in results.items():
            if info and info.get('phone_number'):
                print(f"   {industry.upper():12} → {info['phone_number']}")
                print(f"                 ({info['business_name']})")
                print()

        print("\n🌐 Add to Your Website:\n")
        print("   ```html")
        print("   <h3>Try Our AI - Call Now!</h3>")
        for industry, info in results.items():
            if info and info.get('phone_number'):
                print(f"   <p>{info['description']}</p>")
                print(f"   <a href='tel:{info['phone_number']}'>{info['phone_number']}</a>")
                print()
        print("   ```")

        print("\n💰 Monthly Cost:")
        print(f"   {len(results)} phone numbers × $1.15 = ${len(results) * 1.15:.2f}/month")
        print("   (+ ~$0.04 per demo call)")

        print("\n📊 Track Demo Performance:")
        print(f"   curl {self.base_url}/api/admin/stats/overview")

        print("\n💡 Next Steps:")
        print("   1. Call each number to test")
        print("   2. Add to your website/landing page")
        print("   3. Share in marketing materials")
        print("   4. Monitor conversion rate (demos → paid customers)")

        print("\n" + "="*70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Set up demo sessions for customer trials"
    )

    parser.add_argument(
        "--setup-all",
        action="store_true",
        help="Set up all 3 demo sessions (dental, legal, real estate)"
    )
    parser.add_argument(
        "--industry",
        choices=["dental", "legal", "realestate"],
        help="Set up demo for specific industry only"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List existing demo sessions"
    )

    args = parser.parse_args()

    setup = DemoSessionSetup()

    if args.list:
        # List existing demos
        if not setup.demo_sessions:
            print("No demo sessions configured yet.")
            print("Run with --setup-all to create demo sessions.")
        else:
            print("\n📋 Existing Demo Sessions:\n")
            for industry, info in setup.demo_sessions.items():
                print(f"   {industry.upper()}:")
                print(f"      Business: {info['business_name']}")
                print(f"      Phone: {info.get('phone_number', 'Not configured')}")
                print(f"      Session ID: {info['session_id']}")
                print()

    elif args.setup_all:
        setup.setup_all_demos()

    elif args.industry:
        config = DEMO_CONFIGS[args.industry]
        setup.create_demo_session(args.industry, config)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
