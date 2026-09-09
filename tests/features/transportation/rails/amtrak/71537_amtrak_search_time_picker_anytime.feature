# Test Name: 71537 [Amtrak] Search component - Time-picker functionality for "Anytime"
# Description: Round trip NYP <-> WAS on Amtrak Sabre. The time the traveller picks for each leg -
# or the default the form applies when no time is picked at all - must reach the supplier in the
# "Sabre Amtrak Search" request, one departure dateTime per leg.
# Status: Active (one example blocked by bug 84632 - see the Scenario Outline)
# Labels: Regression,Transportation,Rail,Amtrak Sabre,Search,Payload
# Owner: Bruna Santos

# ADO Test Case ID: 71537
@ado:71537
@transportation @rails @amtrak @regression @payload
Feature: 71537 Amtrak - Search component time-picker "Anytime"
  As a corporate traveler
  I want the time I pick for each Amtrak leg to reach the supplier
  So that the trains I am offered start from the time I asked for

  # Both legs of a round trip ride in ONE request, and the trip logs it under the single request
  # type "Sabre Amtrak Search (Outbound)" - no "(Inbound)" type is ever written, despite what the
  # manual test's step titles suggest. searchCriteria[0] is the outbound leg, [1] the return; this
  # first scenario pins that with the station ids so the scenarios below can key on the index.
  #
  # "Anytime" is the time field's PLACEHOLDER, not a selectable option (amtrak-search-inputs.vue
  # binds :placeholder="$t('amtrak.anytime')" on a clearable app-timepicker), so leaving both time
  # fields untouched IS the "Anytime" case. The supplier request still needs a time of day, and the
  # form fills 00:00 for the outbound leg and 01:00 for the return.
  Scenario: "Anytime" on both legs sends 00:00 outbound and 01:00 inbound
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas" without clicking search button
    Then the Amtrak departure and return time selectors should both show "Anytime"
    When I click the search button
    Then I wait for select text to be visible
    When I capture the "request" payload for request type "Sabre Amtrak Search (Outbound)" from Storage
    Then in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[0].journeyCriteria.departure.locationId" should contain "NYP"
    And in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[1].journeyCriteria.departure.locationId" should contain "WAS"
    And in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[0].journeyCriteria.departure.dateTime" should contain "T00:00"
    And in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[1].journeyCriteria.departure.dateTime" should contain "T01:00"

  # Only the return leg gets a time. The outbound keeps its "Anytime" default of 00:00, while the
  # explicit 00:00 on the return replaces the 01:00 the default would otherwise have sent - the
  # one case where the two legs coincide, so it also proves the return picker is wired to leg 2.
  Scenario: A return time of 00:00 replaces the "Anytime" default of 01:00
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas" without clicking search button
    And I set the Amtrak return time to "00:00"
    And I click the search button
    Then I wait for select text to be visible
    When I capture the "request" payload for request type "Sabre Amtrak Search (Outbound)" from Storage
    Then in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[0].journeyCriteria.departure.dateTime" should contain "T00:00"
    And in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[1].journeyCriteria.departure.dateTime" should contain "T00:00"

  #Blocked by bug 84632
  # Departure and return set to different times, on the hour and then off it. The off-the-hour row
  # is what proves the minutes reach the supplier: the picker offers them in steps of 15.
  #
  # *** The "00:15 / 01:45" example FAILS on bug 84632 *** app-timepicker's close() resets an
  # unset field to 00:00, and hour 00 is the picker's own default, so the FIRST 00:xx selection on
  # a field publishes nothing before that reset lands and the search goes out as T00:00. Every
  # other time is correct, which is why the row above passes. Left asserting T00:15 on purpose:
  # this is the expectation test case 71537 states, and the row turns green when 84632 is fixed.
  Scenario Outline: Times picked for both legs are sent per leg - departure <departure>, return <return>
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas" without clicking search button
    And I set the Amtrak departure time to "<departure>"
    And I set the Amtrak return time to "<return>"
    And I click the search button
    Then I wait for select text to be visible
    When I capture the "request" payload for request type "Sabre Amtrak Search (Outbound)" from Storage
    Then in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[0].journeyCriteria.departure.dateTime" should contain "T<departure>"
    And in the captured "request" payload for request type "Sabre Amtrak Search (Outbound)", path "searchCriteria[1].journeyCriteria.departure.dateTime" should contain "T<return>"

    Examples:
      | departure | return |
      | 02:00     | 10:00  |
      | 00:15     | 01:45  |
