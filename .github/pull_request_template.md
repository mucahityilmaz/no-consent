## What does this PR do?

<!-- Brief description of the change -->

## CMP added / changed

<!-- Which consent management platform does this affect? -->

## Test site(s)

<!-- URL(s) you tested on -->

## Checklist

- [ ] Selector tested on a real consent panel (not mocked)
- [ ] `findOn()` is cheap — one `querySelectorAll` + filter, no async
- [ ] `flip()` is async and returns the total count of toggles flipped
- [ ] Sub-views handled (or confirmed not applicable for this CMP)
- [ ] No JS-API calls that auto-save (`setUserDisagreeToAll()`, `rejectAll()`, etc.)
- [ ] Extension returns to the user's starting view after flipping
- [ ] Manually verified: button appears → count correct → click → all toggles visibly flip
