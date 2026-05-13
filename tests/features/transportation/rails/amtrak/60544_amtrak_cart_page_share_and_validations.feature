# Test Name: 60544 Amtrak cart page share and validations
# Description: Amtrak cart page share and validations
# Status: Active
# Labels: search,Daily Transportation,Regression,Amtrak Sabre,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-04-03T12:41:41Z
# Updated: 2026-01-30T03:08:56Z
@wip @transportation @rails @amtrak @regression
Feature: 60544 Amtrak - Cart page share and validations
  As a corporate traveler
  I want to validate the Amtrak cart page — share, extras, CO2, fare rules
  So that I can confirm the cart contains correct content and sharing works

  Scenario: Amtrak cart validations including share, extras and fare rules
    Given I am logged in as "bar@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    And I click proceed on the reference fields popup
    # TODO: create step "And I expand the first Amtrak result details" in amtrak_results.steps.js
    # covers: page.click(".amtrak-list > :nth-child(1) [hassabreresults='true']")
    And I expand the first Amtrak result details
    # TODO: create step "Then the available classes and fares should be displayed" in amtrak_results.steps.js
    # covers: waitForText(".classes-card .mb-4", 'Available Classes And Fares')
    Then the available classes and fares should be displayed
    When I click more details for the first Amtrak result
    When I add the first result to trip
    # TODO: create step "Then the Amtrak trip timer badge should be visible in cart" in amtrak.steps.js
    # covers: isVisible(".app-columns .material-symbols-outlined") + hover on ".timed-quote-badge" — counter()
    Then the Amtrak trip timer badge should be visible in cart
    When I click the share quote button
    And I send the share
    When I click the share itinerary button
    And I send the share
    # TODO: create step "Then the required extras notice should be visible in cart" in amtrak.steps.js
    # covers: waitForText("[class^='px']...", 'Please add the required extras')
    Then the required extras notice should be visible in cart
    # TODO: create step "When I expand the Amtrak extras section in cart" in amtrak.steps.js
    # covers: page.click(".ticket-layout-container .is-clickable")
    When I expand the Amtrak extras section in cart
    # TODO: create step "Then the contact information section should be visible in the Amtrak cart extras" in amtrak.steps.js
    # covers: waitForText(".el-tabs .card-title", 'Contact Information')
    Then the contact information section should be visible in the Amtrak cart extras
    # TODO: create step "And the phone number field should be visible in the Amtrak cart extras" in amtrak.steps.js
    # covers: waitForText(".extras-card ...", 'Phone number')
    And the phone number field should be visible in the Amtrak cart extras
    Then the CO2 emissions should be displayed in the trip overview
    # TODO: create step "Then the Amtrak summary title should contain the destination" in amtrak.steps.js
    # covers: waitForText(".summary-title", /Amtrak Rail to/)
    Then the Amtrak summary title should contain the destination
    When I click to open fare rules in cart
    # TODO: create step "Then the fare rules cancellations section should be visible" in amtrak.steps.js
    # covers: waitForText(".rules > :nth-child(1) ...", 'Cancellations')
    Then the fare rules cancellations section should be visible
