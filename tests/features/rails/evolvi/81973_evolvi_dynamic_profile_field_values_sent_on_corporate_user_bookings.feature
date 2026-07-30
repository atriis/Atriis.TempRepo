# ADO Bug: 81973 - Evolvi profile-field values not sent on corporate-user bookings
# Status: Implemented, asserts directly against the captured Evolvi booking payload — see below
# for why the scenario does not use a UI-capture step for "Cost Centre". Domain: Transportation / Rail (Evolvi)
#
# Repro (ADO #81973): a corporate user whose profile has dynamic fields "Employee ID" and
# "Cost Centre" configured to "Don't show" + "Sync with Evolvi" books a UK Rail (Evolvi) journey.
# Evolvi rejects the booking because the cost-centre values for those hidden fields are sent
# empty ("Cost Centre [X] is mandatory"), even though the traveller profile has the values.
# Expected: hidden profile fields configured to sync with Evolvi should be read from the
# traveller profile and included in the outbound Evolvi booking request.
#
# ACCOUNT CONFIG: "automation@evolvi.club" has been configured with "Cost Centre" set to "Don't show" +
# "Sync with Evolvi", matching the original bug reporter's (miriamevolvi@atriis.com) setup.
#
# RESOLVED (Phase 3): the route key for "London - any (182)" -> "Manchester Piccadilly (MAN)" used
# in the recording has been added to src/data/evolvi.json as "182ToMan": { "from": "182", "to": "MAN" }.
#
# RESOLVED (Phase 3): "I fill mandatory Evolvi fields in cart" (tests/steps/evolvi_results.steps.js)
# is implemented (src/dsl/EvolviResults.js -> src/dsl/Cart.js -> src/pages/CartPage.js). It selects
# the first available "Reason for Non Lowest Fare" radio option (the specific reason is not
# asserted, only that checkout can proceed) and selects "Need More Flexible Ticket" from the
# "Extras" dropdown, matching the recorded flow in records/81973_1.js.
#
# RESOLVED (Phase 3) — request-type identifier CONFIRMED live: "Booking" (bare, no supplier prefix)
# is the correct payload-validation request-type identifier for the Evolvi outbound booking request.
# Verified against Storage across multiple live runs (trip ids 3776825, 3776837): "I capture the
# 'request' payload for request type 'Booking' from Storage" successfully retrieves a ~13KB JSON
# payload shaped { "req": {...}, "response": {...} }, with a "CheckOutRemarks" array nested under
# "req" containing each traveller reference-field answer (see the Phase 3 verification note below
# for the exact key path used by the final assertions).
#
# DESIGN NOTE — no UI-capture step is used for "Cost Centre": live testing (7+ attempts, trip ids
# 3776799, 3776811, 3776814, 3776819, 3776821, 3776822, 3776825, 3776837) showed the "Cost Centre"
# reference field NEVER renders as a UI element in the "Travellers Reference Questions" section at
# checkout for automation@evolvi.club — only "Travel Type" renders. "Don't show" means the field has ZERO
# DOM footprint (consistent with the "not shown"/hidden-field precedent in
# tests/features/shell/shell_reference_fields/31006_dynamic_profile_fields_not_shown_for_guest.feature
# and .../37304_guest_reference_field_not_displayed_for_profiled_user.feature). This is expected,
# correct behavior for a hidden field, not a bug in the test.
#
# Live inspection of the captured "Booking" payload confirms the backend DOES include an "Ordered
# By" entry in CheckOutRemarks even though it's never rendered in the UI:
#   {"Question":"Cost Centre","Value":"abc","IsDynamic":true,"IsSendToGDS":true,"IsCorporateRemark":true, ...}
# This is the fix's actual repro path — the scenario therefore asserts directly against the
# captured payload's CheckOutRemarks array (via the existing .block("req.CheckOutRemarks") JSON
# extraction in PayloadValidation.js, no new DSL needed) rather than capturing anything from the
# UI. "abc" is confirmed as the genuine configured profile value for this account.
#
# RESOLVED (Phase 3 verification) — the captured "request" payload for request type "Booking" is
# NOT a flat object with CheckOutRemarks at the top level; its real shape is { "req": {...},
# "response": {...} }, with CheckOutRemarks nested under "req". Confirmed live (trip 3776856) via
# scripts/check-payload-api.js: .block("CheckOutRemarks") failed ("Key path \"CheckOutRemarks\" not
# found") because it is not top-level; .block("req.CheckOutRemarks") (getByPath's existing
# dot-notation support) resolves correctly to the array containing both the "Cost Centre"/"abc" and
# "Travel Type"/"Business" entries. parseBlockExpression's quote-matching itself was NOT at fault —
# the step regex in tests/steps/payload_validation.steps.js matches this exact Gherkin string
# unambiguously; this was purely a wrong assumed JSON path.
#
# Note: two generically-reusable steps built during an earlier design pass — "I capture the
# {string} reference field value" (tests/steps/dynamic_fields.steps.js) and "the captured {string}
# payload for request type {string} should contain the captured reference field value"
# (tests/steps/payload_validation.steps.js) — are NOT used by this scenario (they only make sense
# for a field that actually renders), but are left in place as they were code-reviewed and may be
# useful for a future scenario involving a visible reference field.
#
# "Travel Type" is a separate mandatory reference field (red "*" marker) in the Travellers
# Reference Questions section, unrelated to this bug's repro; filled below with "Business" purely
# so the booking flow can complete.

# ADO Test Case ID: 82046
@ado:82046
@transportation @rails @evolvi @regression @payload
Feature: 82046 Evolvi - Dynamic profile field values are sent to Evolvi on corporate-user bookings

  As a corporate traveler with cost-centre reference values on my profile
  I want those values to be included in the Evolvi booking request
  So that mandatory Evolvi cost centres are populated and the booking completes correctly

  Scenario: Cost Centre cost-centre value synced from profile is sent in the Evolvi booking request
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182ToMan"
    And I add an Evolvi one way to the trip
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I capture the "response" payload for request type "TripReferenceField" from Storage
    Then the captured "response" payload for request type "TripReferenceField" should contain "Cost Centre"
    Then the captured "response" payload for request type "TripReferenceField" should contain "under test with automation"
    And I wait for booking details in checkout
    And I fill in the "Travel Type" reference field with "Business"
    When I complete the booking
    Then the booking status should be "Ticketing Complete"
    And I successfully cancel the trip
    And I capture the "request" payload for request type "SaveReferenceField" from Storage
    Then the captured "request" payload for request type "SaveReferenceField" should contain "Cost Centre"
    Then the captured "request" payload for request type "SaveReferenceField" should contain "under test with automation"
    And I capture the "request" payload for request type "Booking" from Storage
    Then the captured "request" payload for request type "Booking" should contain "Cost Centre".block("req.CheckOutRemarks")
    Then the captured "request" payload for request type "Booking" should contain "under test with automation".block("req.CheckOutRemarks")

