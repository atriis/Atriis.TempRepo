# Test Name: 86404 DB Rail - certifyURL sends the AirPlus Kostenstelle when the Cost Centre profile field is 'Show Only In Case Empty'
# Description: Regression for bug 85442. A dynamic profile field synced with Air Plus - Cost Centre (KS)
# Description: and set to booker display Search + "Show Only In Case Empty" is hidden at search when the
# Description: profile already holds a value. Deutsche Bahn must still receive that value as
# Description: zahlungsdaten.zusatzdaten.kostenstelle in the certifyURL punch-out request.
# Status: Active
# Labels: Regression,Rail,DB Rail,AirPlus,Transportation,payload
# Owner: Yael Alef
#
# Test data: jskrl@jskrl.com (coca cola corp) - Cost Accounting Number synced to AirPlus KS with
# "Show Only In Case Empty", profile value 123456; DB Rail paid by the AirPlus central card.
# Punch-out only: the Deutsche Bahn window is closed straight away, nothing is booked.
@transportation @rails @deutschebahn @regression @payload @ado:86404
Feature: 86404 DB Rail - certifyURL sends the AirPlus Kostenstelle from the profile
  As a corporate traveler paying DB Rail with an AirPlus card
  I want my profile cost centre sent to Deutsche Bahn even when the question is hidden
  So that the booking carries the right Kostenstelle without asking me again

  Scenario: Hidden prefilled AirPlus cost centre reaches Deutsche Bahn as kostenstelle
    Given I am logged in as "jskrl@jskrl.com" booking a new trip
    And I have added myself as the traveler
    And I dismiss the document expiry warnings
    When I select DB Rail in the search form
    And I continue to Deutsche Bahn from the search form
    And I capture the "request" payload for request type "certifyURL" from Storage
    Then the captured "request" payload for request type "certifyURL" should contain "\"kostenstelle\":\"123456\""
