# Deferred Payload Checks: checking a call that shows up after your test has finished

Some calls you want to check aren't made by the flow your test drives. A background process makes them a few minutes later. The best-known example is the **passive hotel segment**: you book an Amadeus flight and a Non-GDS hotel in the same trip, and about 3–10 minutes later the app writes the hotel into the Amadeus PNR with a `PNR_AddMultiElements` call.

The old way was to wait for it inside the scenario (`I wait for 300 seconds`). That works, but a browser and a parallel worker sit idle the whole time, and you still have to guess how long to wait.

With a deferred check, the scenario **writes down what it expects, together with its trip number, and finishes straight away.** When the whole run is over, a small script goes back to each of those trips and polls the log until the call turns up. By then most of the waiting has already happened while other scenarios were running. 🎉

---

## The short version

1. Make sure the scenario has the trip number (it usually already does, see below).
2. Add the deferred step as the **last** step of the scenario:

   ```gherkin
   And I complete the booking
   # The hotel passive is written to the Amadeus PNR by a background process minutes after booking
   Then after the run, the "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain:
     | <segmentName>HU</segmentName> |
     | /HTS-                         |
     | <longFreetext>HN-             |
   ```

3. Run the test, then run the verifier:

   ```powershell
   npx cucumber-js tests/features/shell/shell_multiproducts/85676_amadeus_passive_hotel_city_and_dates_not_repeated.feature
   npm run deferred:verify
   ```

You don't need to change anything in CI. Every workflow already runs the verifier right after the cucumber step.

---

## How the trip number gets reused

The deferred check never searches for "the latest trip". It saves **the exact trip number your scenario was using** when the step ran, and the verifier later looks only at that trip's log.

Here's how it works:

- `Given I am logged in as "..." booking a new trip` reads the trip number from the URL and stores it on the world as `this.tripId`.
- The deferred step copies `this.tripId` into the check it registers, along with the time the scenario started.
- After the run, the verifier lists that trip's calls of the request type you named, reading only calls logged **after the scenario started**. That way a reused trip, or an earlier attempt, can't give a false pass.

Watch out for these:

| Situation | What to do |
|---|---|
| You open a second trip with `When I book a new trip` | `this.tripId` still points at the **first** trip. Add `And I store the current trip number for payload validation` after the new trip opens. |
| You added `And I log the trip number from the URL` | That's fine, but it only **prints** the number to the log. It doesn't store anything, so don't count on it to set the trip. |
| The step fails with *"needs the trip number, but none was captured"* | No step stored a trip number. Use the `booking a new trip` login step, or add `I store the current trip number for payload validation`. |

You can also use world placeholders in the table, such as `{tripNumber}` or a value you stored earlier. They're filled in when the step runs, not when the verifier runs.

---

## Writing the expected texts

- Each table row is **one text** that must appear somewhere in the payload.
- Each text only has to appear in **one** logged call of that request type. Different rows can match different calls, the same as the normal `should contain` steps.
- Matching is plain text: no XPath, JSON paths or "should not contain". If you need those, capture the call live with the regular payload steps.
- Add one row that proves the setup is the one you think it is. In 85676, `/HTS-` only appears with Passive Hotel Format "Option 6". Without that row, the test could pass on a different office configuration without proving anything.

---

## What happens when

```
 scenario runs ──► deferred step registers the check (no waiting)
                   │
 After hook ───────► scenario PASSED?  yes → writes test-results/deferred-payload-checks/<file>.json
                   │                   no  → writes nothing (it's already red)
                   ▼
 cucumber-js exits
                   ▼
 npm run deferred:verify
   ├─ polls each trip every 30s, up to 5 min after the step ran
   ├─ writes the outcome back onto the original scenario
   │    • cucumber-report.json  → an extra "(verified after the run) ..." step
   │    • cucumber-junit.xml    → a <failure> if it failed
   │    • allure-results/       → status set to failed if it failed
   └─ exits 1 if any check failed
```

A few details:

- **Retries:** only the attempt that passed registers its check, so with `--retry` you check the trip that attempt booked, not the one from the failed attempt.
- **CI reports:** because the result is written back onto the scenario, the CI summary, the nightly rerun plan and the ADO sync all see a failed deferred check as a failed scenario.
- **Leftovers:** if you run locally and forget to verify, the files stay in `test-results/deferred-payload-checks/`. On the next verify, anything older than that run's start time is thrown away, so old trips never get mixed into the new run.

---

## Running it locally

PowerShell 5.1 doesn't support `&&`, so run the two commands one after the other:

```powershell
npx cucumber-js <your feature>
npm run deferred:verify
```

(In Git Bash you could write `npx cucumber-js <feature> && npm run deferred:verify`, but `&&` skips the verifier when cucumber fails. Running them separately is the safer habit.)

You'll see output like this:

```
[deferred-payload-checks] Verifying 1 scenario(s) with deferred payload checks
[deferred-payload-checks] FAILED  85676 Amadeus - ... (trip 3905743)
[deferred-payload-checks]   ok   the "request" payload ... contains "<segmentName>HU</segmentName>" ...
[deferred-payload-checks]   FAIL the "request" payload ... contains "<longFreetext>HN-" ...
[deferred-payload-checks] 0 passed, 1 failed — details in test-results/deferred-payload-checks-results.json
```

`test-results/deferred-payload-checks-results.json` contains the full story for each check: which texts were missing, how many calls were inspected and how long it waited.

### Changing the timing

| Env var | Default | Meaning |
|---|---|---|
| `DEFERRED_PAYLOAD_CHECK_TIMEOUT_MINUTES` | `5` | How long after **the step ran** to keep looking |
| `DEFERRED_PAYLOAD_CHECK_POLL_INTERVAL_MS` | `30000` | Time between polls |

```powershell
$env:DEFERRED_PAYLOAD_CHECK_TIMEOUT_MINUTES = "10"; npm run deferred:verify
```

The clock starts when the step registered the check, not when the verifier starts. In a long suite, most checks are already past their wait and pass on the first poll.

---

## Good habits

- ✅ **Keep the deferred step last.** Nothing after it can rely on the call, because the call hasn't happened yet.
- ✅ **Add a comment above it** explaining why it's deferred. The next person will wonder why the step says "after the run".
- ✅ **Don't cancel the trip** in the same scenario if the background call depends on it still being live.
- ❌ Don't wait for background calls with `I wait for N seconds`. That's what this mechanism replaces.
- ❌ Don't use it for calls the flow makes immediately. The live payload steps are faster and give the answer inside the scenario.

---

## Where the code lives

| What | File |
|---|---|
| The Gherkin step | [tests/steps/payload_validation.steps.js](../tests/steps/payload_validation.steps.js) |
| Registering after a pass | [tests/support/hooks.js](../tests/support/hooks.js) (the `After` hook that calls `writeRegistration`) |
| Polling logic | [src/utils/deferredPayloadChecks.js](../src/utils/deferredPayloadChecks.js) |
| The verifier + report patching | [scripts/verify-deferred-payload-checks.js](../scripts/verify-deferred-payload-checks.js) |
| A real example | [85676_amadeus_passive_hotel_city_and_dates_not_repeated.feature](../tests/features/shell/shell_multiproducts/85676_amadeus_passive_hotel_city_and_dates_not_repeated.feature) |
| Reference entry | [PayloadValidation.md §13](PayloadValidation.md) |

Questions or a new background call you want to cover? The 85676 feature is the template. Copy its last step and swap in your request type and texts.
