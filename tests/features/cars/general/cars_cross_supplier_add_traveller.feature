@regression
Feature: Cross-Supplier Cars Login and Add Traveller
  As a QA engineer
  I want to verify the cross-supplier login and traveler flow works for cars
  So that I can ensure the system supports multiple car suppliers

  @priority:critical
  Scenario: Login with car supplier and add traveler
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
