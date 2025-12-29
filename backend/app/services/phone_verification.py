"""
Phone Verification Service
Sends SMS verification codes using Twilio
"""

import os
from typing import Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


class PhoneVerificationService:
    """Send and verify SMS verification codes"""

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")

        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            print("⚠️  Twilio not configured. Phone verification disabled.")

    def send_verification_code(self, phone_number: str, code: str) -> bool:
        """
        Send 6-digit verification code via SMS

        Args:
            phone_number: Phone number in E.164 format (e.g., +14155551234)
            code: 6-digit verification code

        Returns:
            True if SMS sent successfully, False otherwise
        """
        if not self.client:
            print(f"⚠️  SMS not sent (Twilio not configured). Code: {code}")
            return False

        # Validate phone number format
        if not phone_number.startswith('+'):
            phone_number = f"+1{phone_number}"  # Assume US number

        try:
            message = self.client.messages.create(
                to=phone_number,
                from_=self.from_number,
                body=f"Your Voice AI verification code is: {code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message."
            )

            print(f"✅ Verification SMS sent to {phone_number} (SID: {message.sid})")
            return True

        except TwilioRestException as e:
            print(f"❌ Failed to send SMS to {phone_number}: {e}")
            return False

    def format_phone_number(self, phone: str, country_code: str = "+1") -> str:
        """
        Format phone number to E.164 standard

        Args:
            phone: Phone number (various formats accepted)
            country_code: Country code (default US +1)

        Returns:
            E.164 formatted phone number
        """
        # Remove common formatting characters
        cleaned = ''.join(filter(str.isdigit, phone))

        # Add country code if not present
        if not phone.startswith('+'):
            if len(cleaned) == 10:  # US number without country code
                return f"{country_code}{cleaned}"
            elif len(cleaned) == 11 and cleaned[0] == '1':  # US with 1 prefix
                return f"+{cleaned}"

        return phone

    def validate_phone_number(self, phone_number: str) -> bool:
        """
        Validate phone number format using Twilio Lookup API

        Args:
            phone_number: Phone number to validate

        Returns:
            True if valid, False otherwise
        """
        if not self.client:
            # Basic validation if Twilio not available
            cleaned = ''.join(filter(str.isdigit, phone_number))
            return len(cleaned) >= 10

        try:
            # Use Twilio Lookup API to validate
            phone = self.client.lookups.v1.phone_numbers(phone_number).fetch()
            return phone.phone_number is not None

        except TwilioRestException:
            return False

    def send_welcome_sms(self, phone_number: str, business_name: str = None) -> bool:
        """
        Send welcome SMS after successful signup

        Args:
            phone_number: User's verified phone number
            business_name: Optional business name

        Returns:
            True if sent successfully
        """
        if not self.client:
            return False

        try:
            if business_name:
                body = f"Welcome to Voice AI! 🎉\n\nYour AI receptionist for {business_name} is ready.\n\nLogin at: https://yoursite.com/dashboard"
            else:
                body = f"Welcome to Voice AI! 🎉\n\nYour account is now active.\n\nLogin at: https://yoursite.com/dashboard"

            message = self.client.messages.create(
                to=phone_number,
                from_=self.from_number,
                body=body
            )

            print(f"✅ Welcome SMS sent to {phone_number}")
            return True

        except TwilioRestException as e:
            print(f"❌ Failed to send welcome SMS: {e}")
            return False
