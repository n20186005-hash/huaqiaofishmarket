# Local validation

Run the package check, build, source/output audit and behavior tests documented in README. Build output is ignored and must be reproduced from committed source. The deployment target is the existing Cloudflare project `huaqiaofishmarket`; its prior successful check is not proof that a later commit is deployed. Production build, exact domain bindings and browser visual/interaction checks remain separate acceptance gates.
