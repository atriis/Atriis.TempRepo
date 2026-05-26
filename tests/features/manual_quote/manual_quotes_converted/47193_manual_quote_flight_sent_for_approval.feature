# Test Name: 47193 Manual quote - Flight manual quote is sent for approval successfully
# Status: Active
# Labels: Regression,Manual Quote,Flights,Approval flow,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-14T09:11:53Z
# Updated: 2025-10-21T11:18:05Z
@regression @manual_quote @flights @approval
Feature: 47193 Manual Quote - Flight manual quote is sent for approval
  As a corporate traveler booking for a guest that requires approval
  I want the flight manual quote to be sent for approval
  So that the trip continues through the approval workflow

  @priority:high
  Scenario: Flight manual quote with a random guest traveler is sent for approval
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip

    # Testim shared step: Add_traveler___random_guest()
    # TODO: New step + DSL — Travelers.openAddTravelerDialog(page) (click '.add-btn .is-flex')
    When I open the Add traveler dialog
    # TODO: New step + DSL — Travelers.expectSearchTitle(page, 'Search specific traveler')
    Then the traveler search dialog should display "Search specific traveler"
    # TODO: New step + DSL — Travelers.clickAddGuest(page) (click '.add-guest-btn')
    When I choose to add a guest traveler
    # TODO: New step + DSL — Travelers.selectGuestTitle(page, index) (open '.personal-info-container > :nth-child(2) .el-select__caret' + pick first option)
    And I select the first available guest title
    # TODO: New step + DSL — Travelers.fillGuestFirstName(page, value) (Testim 'random-value-generator' marker — DSL must produce random first name)
    And I enter a random guest first name
    # TODO: New step + DSL — Travelers.fillGuestLastName(page, value) (random)
    And I enter a random guest last name
    # TODO: New step + DSL — Travelers.fillGuestBirthDate(page, value) (Testim 'date-generator' marker — DSL must produce a valid past birth date)
    And I enter a valid guest birth date
    # TODO: New step + DSL — Travelers.selectGuestGender(page) (click '.personal-info-container > :nth-child(3) > :nth-child(3)')
    And I select the guest gender
    # TODO: New step + DSL — Travelers.fillGuestNationality(page, value) ('#el-id-9261-947' — 'israel')
    And I set the guest nationality to "israel"
    # TODO: New step + DSL — Travelers.pickFirstNationalitySuggestion(page) (click '#el-id-9261-1058 > span')
    And I pick the first nationality suggestion
    # TODO: New step + DSL — Travelers.fillGuestEmail(page, randomEmail) (Testim 'random-value-generator' marker — DSL must build email like 'randomLocal@atriistech.com')
    And I enter a random guest email at "atriistech.com"
    # TODO: New step + DSL — Travelers.fillGuestPhone(page, parts) (random parts — country '222' + random num2 + random num3)
    And I enter a random guest phone number starting with "222"
    # TODO: New step + DSL — Travelers.selectGuestPhoneType(page) (open '.contact-info-container .el-select__caret' + pick first)
    And I select the first guest phone type
    # TODO: New step + DSL — Travelers.confirmAddGuest(page) (click '.add-guest-btn')
    And I confirm the new guest traveler
    # TODO: New step + DSL — Travelers.expectStarIconVisible(page) (wait for '.star-icon' visible)
    Then the guest traveler should be added with a star marker

    # Testim shared step: add_manual_quote_flight_one_way_LON_MAD() — same as 41113/46276
    When I open the Manual Quote tab
    Then the flight manual quote form should display "Flight 1"
    When I enter "LON" as the flight manual quote origin
    And I enter "MAD" as the flight manual quote destination
    And I pick a future departure date for the flight manual quote
    And I set the flight number to "1235"
    And I set the flight booking reference to "rewq23"
    And I set the flight carrier to "el al"
    And I select the first carrier suggestion
    And I set the flight base fare to "1"
    And I set the flight tax to "20"
    And I set the flight change fee to "5"
    And I save the flight manual quote

    # Testim shared step: Flight_manual_quote_is_sent_for_approval_successfully()
    # Composes: Trip_reference_questions() + On_Hold___Wait_for_element_text() + click checkout + select_first_financial_reference() + assert Contact details + click hidden-mobile + assert approval message
    # TODO: New step + DSL — Cart.handleTripReferenceFormIfPresent(page) (only acts when '.el-dialog__title' == 'Trip Reference Form')
    When I handle the Trip Reference Form if displayed
    # TODO: Reuses ManualQuoteCart.expectQuoteLabel (waitForText '.app-label--quote' 'On hold')
    Then the booking status should be "On hold"
    # TODO: Reuses Cart.proceedToCheckout (click '.btn-container span')
    When I proceed to checkout
    # TODO: New step + DSL — Checkout.selectFirstFinancialReference(page) (waitForText 'Financial Reference' + open caret + pick first + confirm)
    And I select the first available financial reference
    # TODO: Reuses Checkout.expectContactDetailsHeading
    Then the checkout page should display "Contact details"
    # TODO: New step + DSL — Checkout.clickBookButton(page) (click '.is-hidden-mobile' final book button)
    When I click the book button on the checkout page
    # TODO: New step + DSL — Checkout.expectApprovalSuccess(page) ('Your order has been booked and sent to your approver for approval')
    Then the booking should be confirmed with "Your order has been booked and sent to your approver for approval"

    # Testim: Click_Go_to_Trip()
    # TODO: Reuses Trips.expectGoToTripButton + Trips.goToTrip
    When I click Go to Trip

    # Testim: Flights___Trip_Overview___Wait_for__Flight_details__text_display()
    # TODO: Reuses Trips.expectFlightDetailsButtonVisible (waitForText '.more-details-btn' 'Flight details')
    Then the trip overview should display "Flight details"

    # Testim: Trip_Cancelation___warning_and_continue() — same as Trip_Cancelation
    Then I successfully cancel the trip
