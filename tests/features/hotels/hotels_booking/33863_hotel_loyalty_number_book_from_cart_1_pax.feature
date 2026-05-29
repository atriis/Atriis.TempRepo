# Test Name: 33863 hotel loyalty number - book from cart 1 pax
# Description: 
# Status: Active
# Labels: Regression,Hotel,Full Purchase,Hotel loyalty number,Amadeus,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-02-25T09:11:09Z
# Updated: 2025-11-25T05:29:53Z

@regression @hotel_loyalty @provider:amadeus
Feature: 33863 Hotel loyalty number - book from cart with 1 passenger 
  As a corporate traveler with a hotel loyalty number
  I want to book a hotel from the cart with my loyalty number applied
  So that my loyalty points are credited for the stay

  @priority:critical
  Scenario: Book hotel with loyalty number from cart and cancel
    Given I am logged in as "Tali@Loyal.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    And I expand the loyalty number extras section
    And I select the first existing loyalty number from profile
    Then the loyalty number should be saved with a green success icon
    And I should see a success notification
    When I proceed to checkout
    And I complete the booking
    Then the hotel should appear as refundable in cart
    When I successfully cancel the trip
    And I capture the "request" payload for request type "Amadeus4.Hotel_Sell" from Storage
    Then the captured "request" payload for request type "Amadeus4.Hotel_Sell" should contain the XML block:
      """
					<customerInfo>
						<customerReferences>
							<referenceQualifier>1</referenceQualifier>
							<referenceNumber>456789</referenceNumber>
						</customerReferences>
					</customerInfo>
      """
