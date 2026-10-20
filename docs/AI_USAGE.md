# Use of generative AI

> Grading criterion (3 pts): relevant prompts, **verification** of results, **detection and correction of errors**, full understanding of the generated code.
> ⚠ Fill this file honestly with YOUR own interactions. Keep screenshots or links of the conversations.

## 1. Tools used

| Tool | For what |
|---|---|
| `<e.g. Claude / ChatGPT / Copilot>` | Project scaffolding, contract review, test ideas, documentation |

## 2. How we verified the AI output

- Every contract was **compiled** (Remix + Hardhat) and **tested** (`npx hardhat test`, 18 tests).
- We read each function line by line and can explain it (see `QA_PREP.md`).
- We compared security patterns with the official OpenZeppelin documentation.
- We ran the full demo scenario manually (mint → list → buy → withdraw) with 3 MetaMask accounts.

## 3. Errors / issues found and corrected

Examples of real points that had to be checked or fixed during the project:

| # | Problem | How we detected it | Fix |
|---|---|---|---|
| 1 | Solidity 0.8.24 defaults to the `cancun` EVM version; Ganache does not support its new opcodes | Deployment fails / invalid opcode | Set `evmVersion: "paris"` in Hardhat and in Remix (Advanced configurations) |
| 2 | OpenZeppelin v5 moved `ReentrancyGuard` from `security/` to `utils/` and `Ownable` now needs `Ownable(msg.sender)` | Compilation error with old (v4) examples | Updated imports and constructor |
| 3 | `loadFixture` only works on the Hardhat in-memory network | Tests failed with `--network ganache` | Run tests on Hardhat network, use Ganache only for the demo |
| 4 | Frontend: if `approve` failed, the `list` tx was still sent | Code review | `runTx` returns `true/false`, listing only after successful approval |
| 5 | `<add your own>` | | |

## 4. Prompt log (examples — replace with yours)

| Date | Prompt (summary) | Result | Accepted / modified / rejected and why |
|---|---|---|---|
| | "Write an ERC-721 marketplace with escrow and pull payments using OpenZeppelin 5" | Contract draft | Modified: added fee cap, `onlySeller` modifier |
| | "Write a Hardhat test proving the withdraw is protected against reentrancy" | Attacker contract + test | Accepted after reading and running it |
| | | | |

## 5. What we learned / limits of the AI

- AI suggestions can be based on **outdated library versions** → always check the installed version.
- AI does not run the code → tests are the proof, not the AI's explanation.
