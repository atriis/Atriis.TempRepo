# ADO Test Case ID: 74846
# Test Name: 74846 [Cars] - New Travel Policy For Cars - "Agreement rate"
# Labels: Cars, general, Regression, Travel policy, OOP, Agreement, Transportation
# Precondition: pmac@corp.am's corporate travel policy ("Testim: Agreement Rate") has a Cars condition
#   "Agreement Rate" is "Agreement Rate" with action "Request OOP" (GTP Admin > Corporate Administration
#   > Travel Policies). The results tooltip shows the condition text "Agreement Rate", and Add to trip
#   stays enabled because the action is Request OOP, not Restrict result selection.

@regression @cars @transportation @travel-policy @oop @agreement @ado:74846
Feature: 74846 Cars - Travel Policy - Agreement Rate car policy flags agreement fares as out of policy
  As a corporate traveler whose travel policy has an "Agreement Rate" car condition
  I want agreement car fares to be flagged by that policy in the results
  So that I book cars according to the corporate agreement rules

  @priority:high
  Scenario: Enterprise agreement car is out of policy with the Agreement Rate explanation
    Given I am logged in as "pmac@corp.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Enterprise" and 1 months ahead
    Then handshake badge should be visible in car results
    And the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Agreement Rate"
