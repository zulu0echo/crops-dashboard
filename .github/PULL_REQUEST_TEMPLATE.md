## What changed
<!-- Provider(s) and criterion IDs touched, and old -> new score for each. -->

## Artifact inspected
<!-- For each changed score: the exact artifact (contract + function/role + block, or repo + commit + path + lines, or document URL + quoted passage). -->

## How a reviewer re-checks it
<!-- Must match the `recheck` field on the evidence for any score of 2 or 3. -->

## Conflict of interest
<!-- Are you employed by, paid by, invested in, or competing with any provider touched here? "None" or describe. -->

## Checklist
- [ ] `npm run validate` passes locally (with `GITHUB_TOKEN` set)
- [ ] Every criterion is still listed (scored or `unknown: true`), each with `assessed_by` and `review`
- [ ] No score is raised on `claimed` evidence, and no score is lowered on third-party claims alone
- [ ] `components` lists every part of the payment path, including closed services
- [ ] Ratings of 2 or 3 have a second reviewer not affiliated with me
- [ ] If I am the provider: I used `provider_response` for my view and changed a score only with new admissible evidence
