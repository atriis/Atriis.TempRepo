# Test Name: 28648 MERGED Book Amadeus flight + check fare rules + contact info appears for a guest
# Description: flight in Amadeus NL - check Fare rules in: results, cart, and checkout
# Status: Active
# Labels: Amadeus,Flights,No Amadeus Hotel Book,Full Purchase,Regression,contact info,guest,Fare Rules,Sanity,Pre Prod,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-20T09:36:54Z
# Updated: 2026-02-04T10:17:42Z

@regression @flights @amadeus @fare-rules @contact-info @guest @full-purchase
Feature: 28648 Amadeus - Book flight with fare rules check and guest contact info
  As a corporate traveler
  I want to verify fare rules at each stage and see contact details for a guest
  So that I can ensure fare information is consistent and guest contact info is collected

  Scenario: Fare rules displayed in results, cart, and trip overview with guest contact info
    Given I am logged in as "pini_nlgov" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I click proceed on the reference fields popup
    And I filter results by carrier "IB"
    # TODO: Check fare rules in results page
    # Testim: Check_flight_fare_rules() — clicks flight details → opens fare rules → verifies content
    # Existing steps: When I click to open flight details + When I click to open fare rules from modal
    And I add the first flight to cart
    And I click to open fare rules in cart
    # TODO: Verify fare rules show "Fare Basis" heading
    # Testim: waitForText(page, ".main-headline", /Fare Basis/)
    And I close fare rules window
    And I click add payment method button
    And I select card 1 and save
    # TODO: Fill free text justification in cart if OOP (conditional)
    # Testim: fill_free_text_justification_in_cart_if_needed()
    And I proceed to checkout
    # TODO: Select first financial reference on checkout page
    # Testim: select_first_financial_reference()
    # TODO: Verify "Contact details" section is visible for guest
    # Testim: waitForText(page, ".contact-details-container ...", 'Contact details')
    # TODO: Validate contact info fields are pre-filled for guest
    # Testim: validate_contact_info() — checks email and phone fields
    # TODO: Fill required field and finalize booking
    # Testim: fills ".is-danger [type='text']" with value, clicks book button, goes to trip
    And I complete the booking
    And I click to open fare rules in cart
    # TODO: Verify fare rules show "Fare Basis" heading after booking
    And I close fare rules window
    Then I successfully cancel the trip
