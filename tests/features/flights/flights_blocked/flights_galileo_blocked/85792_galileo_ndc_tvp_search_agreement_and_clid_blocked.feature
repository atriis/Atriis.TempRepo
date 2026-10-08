# Test Name: ** Blocked - Galileo NDC returns no results for 277478 on dev *** 85792 Galileo NDC - TVP NDC search sends the CLID on every request and the agreement on a separate one
# Status: Active (BLOCKED - no Galileo NDC content for 277478@277478.COM on dev)
# Labels: Flights,Galileo,Galileo NDC,Travelport,Agreement,CLID,payload,search
# Owner: Yael Alef
# Created: 2026-10-01
# Updated: 2026-10-08

# ADO Test Case ID: 85792
# ADO workitem ID: 85390 (User Story)
#
# Story: TVP NDC search puts the CLID and the corporate agreement in
# PricingModifiersAir.OrganizationInformation.OrganizationIdentifier. The CLID
# (organizationCodeType "OrganizationLoyaltyProgram") must be on every NDC search. When the
# corporation has an agreement, a second NDC search carries it (organizationCodeType "Account",
# one entry per agreement carrier, with "supplier"), and the log name shows it:
# "UAPI TVP NDC Flight Search <agreement> CLID: <clids> (Flight Search)".
#
# Test data (dev corporation of 277478@277478.COM): CLID TP ABC123, KL ABC123213123; agreement
# 123456 on TP. The agreement request is sent only when TP is the preferred carrier; an open
# search with no carrier sends only the CLID request (Bug 85781).
#
# BLOCKED since 2026-10-08: on dev, the LIS-OPO TP search for 277478@277478.COM returns
# "No results found" in under a second with no TVP NDC request logged (trip 3925077). The same
# search for tapCorp@tvpNdc.gdg reaches TVP NDC (trip 3925084), but that corporation has no CLID or
# agreement, so it cannot stand in. Move back to flights_galileo_non_booking once 277478
# returns Galileo NDC results again. The user is now preselected as the traveller, so the
# scenario checks the preselected tag instead of clicking "Add me".
@blocked @ado:85390 @tc:85792 @regression @flights @galileo @ndc @payload @agreement
Feature: BLOCKED - 85792 Galileo NDC - TVP NDC search with agreement and CLID

  As a corporate traveller with a TAP agreement and NDC client IDs
  I want every TVP NDC search to carry the CLID and the agreement to go out on its own request
  So that Travelport can return both the public and the agreement NDC fares

  Scenario: LIS-OPO with TAP sends a CLID-only request and an agreement request with the CLID
    Given I am logged in as "277478@277478.COM" booking a new trip
    And the selected traveler should be "WILL NEVER" by default
    When I search for a round trip flight from "LIS" to "OPO" with preferred carrier "TP"
    And flight results should be available

    # Request without the agreement: CLID only, no Account entry.
    When I capture the "request" payload for request type "UAPI TVP NDC Flight Search CLID: * (Flight Search)" from Storage
    Then the captured "request" payload for request type "UAPI TVP NDC Flight Search CLID: * (Flight Search)" should contain "\"organizationCodeType\":\"OrganizationLoyaltyProgram\""
    And the captured "request" payload for request type "UAPI TVP NDC Flight Search CLID: * (Flight Search)" should not contain "\"organizationCodeType\":\"Account\""

    # Request with the agreement: Account 123456 for TP, and the CLID still sent.
    When I capture the "request" payload for request type "UAPI TVP NDC Flight Search 123456 CLID: * (Flight Search)" from Storage
    Then the captured "request" payload for request type "UAPI TVP NDC Flight Search 123456 CLID: * (Flight Search)" should contain "\"supplier\":\"TP\",\"organizationCodeType\":\"Account\",\"value\":\"123456\""
    And the captured "request" payload for request type "UAPI TVP NDC Flight Search 123456 CLID: * (Flight Search)" should contain "\"organizationCodeType\":\"OrganizationLoyaltyProgram\""
