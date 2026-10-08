# Test Name: hybrid for 59199 AFKL Flight booking with umlaut in traveler name - ticket issued for pax with middle name
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Umlaut,Middle Name,Ticket Issued,Full Purchase,Payload Validation
# Owner: Bruna Santos

@regression @flights @afkl @ndc @umlaut @middle-name @full-purchase @payload-validation
Feature: 59199 HYBRID AFKL NDC - Flight booking with umlaut in traveler name and middle name
  As a corporate traveler
  I want to book a flight for travelers with umlaut characters and middle names
  So that the ticket is issued correctly with the full traveler details

  # ADO 59199 (hybrid of 59194) covers bugs 58956 (umlaut breaks OrderCreate with "Attribute value
  # not matching regular expression"), 56191 / 62066 (second traveler gets the first traveler's
  # ticket, or only one ticket is saved) and 57462 (traveler email sent instead of the corporate
  # web confirmation email). ndc@testim.com's corporate sends web@confirmation.com as CTC0.
  # The trip is cancelled before the payload checks so a failed assertion never leaves tickets behind.
  Scenario: Book an AFKL round trip with umlaut traveler and a guest traveler with middle name
    Given I am logged in as "ndc@testim.com" booking a new trip
    And I have added traveler by name "Sönja Götz"
    And I have added a random guest traveler with middle name "Jonas"
    When I search for a round trip flight from "AMS" to "CDG"
    And flight results should be available
    And I filter airline results by "Air France" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I refresh the page
    And I open flight details in cart
    Then each of the 2 travelers in flight details should have a different ticket number
    When I remember the flight details ticket number of the traveler named "Götz" as "umlautTravelerTicket"
    And I remember the flight details ticket number of the random guest traveler as "middleNameTravelerTicket"
    And I close the open drawer
    Then I successfully cancel the trip
    # Booking request: umlaut sent as its transliteration, the umlaut traveler is PAX1,
    # the guest's middle name is kept, and CTC0 carries the web confirmation email.
    When I capture the "request" payload for request type "OrderCreateV01 (Booking)" from Storage
    Then the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "<GivenName>Soenja</GivenName>"
    And the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "<Surname>Goetz</Surname>"
    And the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "</Individual><PaxID>PAX1</PaxID>"
    And the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "<GivenName>{guestFirstName} Jonas</GivenName>"
    And the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "<ContactInfoID>CTC0</ContactInfoID><EmailAddress><EmailAddressText>web@confirmation.com</EmailAddressText>"
    When I capture the "response" payload for request type "OrderCreateV01 (Booking)" from Storage
    Then the captured "response" payload for request type "OrderCreateV01 (Booking)" should not contain "not matching regular expression"
    And the captured "response" payload for request type "OrderCreateV01 (Booking)" should contain "<ns3:PaxID>PAX1</ns3:PaxID>"
    # Ticketing: each ticket shown on the trip belongs to the same passenger at the airline.
    When I capture the "response" payload for request type "OrderRetrieveV02 (Ticketing)" from Storage
    Then the captured "response" payload for request type "OrderRetrieveV02 (Ticketing)" should contain "<ns2:PaxRefID>PAX1</ns2:PaxRefID><ns2:PaymentInfoRefID>PMT_{umlautTravelerTicket}</ns2:PaymentInfoRefID>"
    And the captured "response" payload for request type "OrderRetrieveV02 (Ticketing)" should contain "<ns2:PaxRefID>PAX2</ns2:PaxRefID><ns2:PaymentInfoRefID>PMT_{middleNameTravelerTicket}</ns2:PaymentInfoRefID>"
