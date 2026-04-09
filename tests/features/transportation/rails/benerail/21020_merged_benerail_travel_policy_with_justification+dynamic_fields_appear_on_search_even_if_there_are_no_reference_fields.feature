# Test Name: 21020 MERGED benerail travel policy with justification + dynamic fields appear on search even if there are no reference fields
# Description: oop justification field appears on the cart, drop down options are taken from the administration
# Status: Active
# Labels: NL government,OOP,performance,No Amadeus Hotel Book,Regression,Travel policy,Dynamic fields,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-29T07:52:01Z
# Updated: 2026-02-03T09:38:42Z
@wip @transportation @rails @benerail @regression @travel_policy
Feature: 21020 Benerail - Travel policy with OOP justification and dynamic fields on search
  As a corporate traveler under NL government policy
  I want to see OOP justification and dynamic fields when booking Benerail
  So that policy compliance is enforced and recorded

  Scenario: OOP justification dropdown appears with dynamic fields even without reference fields
    Given I am logged in as "shani_nl" booking a new trip
    And I have added traveler by name "beny"
    # TODO: create step "When I search for a Benerail round trip from {string}" or use one-way step;
    # Source uses Search_benerail_by_place('BEABT', 'nlasc') — add beabtToNlasc to benerail.json
    When I search for a one way Benerail train from "beabtToNlasc"
    # TODO: create step "Then the dynamic fields section should be visible in the Benerail search form" in benerail_search.steps.js
    # covers: validate_dynamic_fields() — fields appear even with no reference fields configured
    Then the dynamic fields section should be visible in the Benerail search form
    When I add a Benerail round trip to the trip
    Then the out of policy indicator should be visible in cart
    When I proceed to checkout
    # TODO: create step "Then the OOP justification mandatory error should be displayed" in benerail_results.steps.js
    # covers: waitForText(".form-payment-err", '*In order to proceed...')
    Then the OOP justification mandatory error should be displayed
    # TODO: create step "Then the OOP justification dropdown should be visible in cart" in cart.steps.js
    # covers: validate_justifications() — verify dropdown options from administration
    Then the OOP justification dropdown should be visible in cart
    # TODO: create step "When I select the first OOP justification option and save" in cart.steps.js
    # covers: page.click(".el-scrollbar__view > :nth-child(1)") + page.click "[class^='px']... .btn"
    When I select the first OOP justification option and save
    # TODO: create step "When I delete the only quote from cart before checkout" in cart.steps.js
    # covers: delete_one_and_only_qoute_from_cart_before_checkout()
    When I delete the only quote from cart before checkout
