#!/usr/bin/env python3
"""
Client Provisioning Script for Multi-Tenant Voice AI Platform

This script automates the onboarding of new clients:
1. Creates a session with their business configuration
2. Optionally purchases a Twilio phone number
3. Configures the webhook automatically
4. Outputs all details for the client

Usage:
    python provision_client.py --business-name "Smith Dental" --industry "Healthcare" --goal "Book Appointments"
"""

import os
import sys
import argparse
import requests
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# Load environment variables
load_dotenv()

class ClientProvisioner:
    def __init__(self):
        self.base_url = os.getenv("BASE_URL", "http://localhost:8000")
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_client = None

        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)

    def create_session(self, business_name: str, industry: str, primary_goal: str,
                      knowledge_base: Optional[str] = None) -> Dict[str, Any]:
        """Create a new session for the client"""
        print(f"\n📝 Creating session for '{business_name}'...")

        payload = {
            "business_name": business_name,
            "industry": industry,
            "primary_goal": primary_goal
        }

        if knowledge_base:
            payload["knowledge_base"] = knowledge_base

        try:
            response = requests.post(
                f"{self.base_url}/api/session/create",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            session_data = response.json()

            print(f"✅ Session created successfully!")
            print(f"   Session ID: {session_data['session_id']}")
            return session_data

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create session: {e}")
            sys.exit(1)

    def purchase_phone_number(self, area_code: Optional[str] = None,
                             country: str = "US") -> Optional[str]:
        """Purchase a new Twilio phone number"""
        if not self.twilio_client:
            print("⚠️  Twilio credentials not configured. Skipping phone purchase.")
            return None

        print(f"\n📞 Searching for available phone numbers...")

        try:
            # Search for available phone numbers
            search_params = {"country": country}
            if area_code:
                search_params["area_code"] = area_code

            available_numbers = self.twilio_client.available_phone_numbers(country) \
                .local.list(**search_params, limit=5)

            if not available_numbers:
                print(f"❌ No available numbers found for {country} {area_code or ''}")
                return None

            # Show options
            print("\nAvailable phone numbers:")
            for idx, number in enumerate(available_numbers[:5], 1):
                print(f"  {idx}. {number.phone_number} ({number.locality}, {number.region})")

            # Auto-select first number (or implement user choice)
            selected = available_numbers[0]

            print(f"\n💳 Purchasing {selected.phone_number}...")

            # Purchase the number
            incoming_number = self.twilio_client.incoming_phone_numbers.create(
                phone_number=selected.phone_number
            )

            print(f"✅ Phone number purchased: {incoming_number.phone_number}")
            print(f"   Monthly cost: $1.15")
            return incoming_number.phone_number

        except TwilioRestException as e:
            print(f"❌ Twilio error: {e}")
            return None

    def configure_webhook(self, phone_number: str, session_id: str) -> bool:
        """Configure Twilio webhook for the phone number"""
        if not self.twilio_client:
            print("⚠️  Twilio credentials not configured. Cannot configure webhook.")
            return False

        print(f"\n🔗 Configuring webhook for {phone_number}...")

        webhook_url = f"{self.base_url}/api/twilio/voice/incoming/{session_id}"
        status_callback_url = f"{self.base_url}/api/twilio/voice/status"

        try:
            # Find the phone number SID
            numbers = self.twilio_client.incoming_phone_numbers.list(
                phone_number=phone_number
            )

            if not numbers:
                print(f"❌ Phone number {phone_number} not found in your Twilio account")
                return False

            number_sid = numbers[0].sid

            # Update the webhook configuration
            self.twilio_client.incoming_phone_numbers(number_sid).update(
                voice_url=webhook_url,
                voice_method='POST',
                status_callback=status_callback_url,
                status_callback_method='POST'
            )

            print(f"✅ Webhook configured successfully!")
            print(f"   Voice URL: {webhook_url}")
            print(f"   Status Callback: {status_callback_url}")
            return True

        except TwilioRestException as e:
            print(f"❌ Failed to configure webhook: {e}")
            return False

    def provision_client(self, business_name: str, industry: str, primary_goal: str,
                        knowledge_base: Optional[str] = None,
                        area_code: Optional[str] = None,
                        purchase_number: bool = True,
                        phone_number: Optional[str] = None) -> Dict[str, Any]:
        """Complete client provisioning workflow"""

        print("=" * 70)
        print("🚀 CLIENT PROVISIONING STARTED")
        print("=" * 70)

        # Step 1: Create session
        session_data = self.create_session(business_name, industry, primary_goal, knowledge_base)
        session_id = session_data['session_id']

        # Step 2: Handle phone number
        if phone_number:
            # Use existing phone number
            print(f"\n📞 Using existing phone number: {phone_number}")
            self.configure_webhook(phone_number, session_id)
        elif purchase_number and self.twilio_client:
            # Purchase new number
            phone_number = self.purchase_phone_number(area_code)
            if phone_number:
                self.configure_webhook(phone_number, session_id)
        else:
            print("\n⚠️  No phone number configured. Manual setup required.")
            print(f"   Configure your Twilio phone with this webhook:")
            print(f"   {self.base_url}/api/twilio/voice/incoming/{session_id}")

        # Step 3: Output summary
        self.print_summary(business_name, session_id, phone_number)

        return {
            "session_id": session_id,
            "phone_number": phone_number,
            "webhook_url": f"{self.base_url}/api/twilio/voice/incoming/{session_id}"
        }

    def print_summary(self, business_name: str, session_id: str, phone_number: Optional[str]):
        """Print client onboarding summary"""
        print("\n" + "=" * 70)
        print("✅ CLIENT PROVISIONED SUCCESSFULLY")
        print("=" * 70)
        print(f"\n📋 Client Details:")
        print(f"   Business Name: {business_name}")
        print(f"   Session ID: {session_id}")
        if phone_number:
            print(f"   Phone Number: {phone_number}")

        print(f"\n🔗 Webhook URLs:")
        print(f"   Voice: {self.base_url}/api/twilio/voice/incoming/{session_id}")
        print(f"   Status: {self.base_url}/api/twilio/voice/status")

        if phone_number:
            print(f"\n📞 Client Instructions:")
            print(f"   Give your client this phone number: {phone_number}")
            print(f"   They can start receiving calls immediately!")

        print(f"\n💰 Monthly Costs:")
        if phone_number:
            print(f"   Twilio Phone: $1.15/month")
        print(f"   Per-call cost: ~$0.04 (Twilio + Groq)")
        print(f"   Your pricing: $99-299/month")
        print(f"   Profit margin: ~90%")

        print("\n" + "=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description="Provision a new client for the Voice AI platform"
    )

    # Required arguments
    parser.add_argument(
        "--business-name",
        required=True,
        help="Client's business name (e.g., 'Smith Dental Office')"
    )
    parser.add_argument(
        "--industry",
        required=True,
        help="Client's industry (e.g., 'Healthcare', 'Legal', 'Real Estate')"
    )
    parser.add_argument(
        "--goal",
        required=True,
        help="Primary goal (e.g., 'Book Appointments', 'Answer Questions')"
    )

    # Optional arguments
    parser.add_argument(
        "--knowledge-base",
        help="Path to knowledge base file or text"
    )
    parser.add_argument(
        "--area-code",
        help="Preferred area code for phone number (e.g., '415')"
    )
    parser.add_argument(
        "--phone-number",
        help="Use existing Twilio phone number (e.g., '+18001234567')"
    )
    parser.add_argument(
        "--no-purchase",
        action="store_true",
        help="Don't purchase a new phone number (manual setup)"
    )

    args = parser.parse_args()

    # Initialize provisioner
    provisioner = ClientProvisioner()

    # Provision client
    result = provisioner.provision_client(
        business_name=args.business_name,
        industry=args.industry,
        primary_goal=args.goal,
        knowledge_base=args.knowledge_base,
        area_code=args.area_code,
        purchase_number=not args.no_purchase,
        phone_number=args.phone_number
    )

    # Save to file for records
    output_file = f"client_{result['session_id']}.json"
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\n💾 Client details saved to: {output_file}")


if __name__ == "__main__":
    main()
