# Test Name: 47583 Request Assistance - Reference Field order corresponds to the other that was configured in admin
# Description:
# Status: Active
# Labels: Request Assistance,Reference Fields,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-20T11:23:40Z
# Updated: 2026-02-16T02:34:47Z

@shell @reference_fields @regression @request_assistance
Feature: 47583 - Request assistance reference field order matches admin configuration

  As a booker using request assistance
  I want the reference fields to appear in the order configured in admin
  So that the request form matches the configured layout

  Scenario: Reference fields are displayed in the admin-configured order in request assistance
    Given I am logged in as "brunaref@reffields.com" booking a new trip
    And I have added myself as the traveler
    # TODO: implement step - open the request assistance form
    When I open the request assistance form
    # TODO: implement step - fill and send the request assistance form (origin, destination, trip type, dates)
    When I fill and send the request assistance form from "lisbon" to "tlv"
    # TODO: implement step - verify the reference fields appear in the admin-configured order
    Then the request assistance reference fields are displayed in the following order:
      | Cost Centre |
      | Region Code |
      | Preferred departure time |
      | Preferred return time |
      | Booked by |
      | Do you need a carry on bag? |
      | Do you need a check in bag? |
      | Do you need a priority bording if available? |
      | Do you want us to quote you for a prebooked seat? |
      | If traveling to a conference please provide the link |
