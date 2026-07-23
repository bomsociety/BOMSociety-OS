# Sprint 15 design critique

**Review completed before implementation.** This is a combined Principal Product Designer (Apple) and Staff Product Designer (Stripe) critique of the current public homepage.

## System-level findings

| Lens | Finding | Why it confuses or weakens the experience |
| --- | --- | --- |
| Visual hierarchy | The hero asks the user to parse a mission label, a career claim, a circular ranking visualization, and enterprise intelligence at once. | The first decision is unclear: physician learning, personal ranking, or an enterprise product. |
| Typography | All-caps labels, large display copy, dense small labels, and multiple emphasis treatments compete. | Important information loses its hierarchy, especially on smaller screens. |
| Alignment and grid | The hero uses a three-column layout while the workspace uses an unrelated, changing grid. At breakpoints the intelligence panel migrates between positions. | The page feels assembled rather than intentionally composed. |
| Whitespace and density | The hero is visually dense; the opportunity section and workspace create multiple competing starting points. | A time-constrained clinician cannot quickly identify the next useful action. |
| Responsiveness | Current breakpoint overrides reassign columns and minimum widths in several competing rules. | This risks collapsed columns, unexpected order changes, and overflow. |
| CTA clarity | The primary action, opportunity actions, question cards, progress controls, and enterprise preview all use button-like treatments. | Users cannot predict whether an action opens content, scrolls, or merely changes state. |
| Color consistency | Navy, blue, mint, gold, and several panel backgrounds are all used as emphasis colors. | The product feels more like a dashboard prototype than a premium, restrained system. |
| Interaction clarity | The ranking is presented as a consequential personal score without an obvious source or onboarding context. | First-time users can reasonably question its validity; returning users do not know what changed. |
| Enterprise messaging | Enterprise intelligence competes in the hero with the physician value proposition. | Buyers get a thin preview while physicians are distracted from the core product promise. |
| Physician messaging | “Mission,” ranking language, and enterprise signals precede a useful physician outcome. | The page makes a clinician work before offering practical help. |
| Emotional response and premium feel | The circular score, repeated boxed regions, and dense labels create visual noise. | It lacks the calm confidence, restraint, and craft expected from a premium decision product. |
| Navigation flow | Header links do not include a clear account state; sign-up is absent. | New visitors cannot understand the membership path, and returning visitors have no clear destination. |

## Screen review

### Screen 1: hero

1. “BOMSociety Mission” is organization-first and does not help a physician choose an action.
2. The ranking is circular and occupies disproportionate attention; the compact supporting text is hard to scan.
3. Decision Intelligence™ is in the hero, where it competes with the physician promise and makes the page feel split between two audiences.
4. The former stronger, physician-first message (“Level up the business side of medicine”) is no longer visible.
5. The CTA hierarchy does not clearly distinguish the primary physician path from enterprise exploration.

### Screen 2: opportunity and decision workspace

1. “Find My Biggest Opportunity” is not immediately associated with the three reading-depth choices.
2. The depth choices appear once in the opportunity block and again in the decision module, duplicating labels and creating uncertainty about which control is primary.
3. The workspace grid is expressed through multiple later CSS overrides and breakpoint reassignment; its source order and intended hierarchy are not durable.
4. Enterprise intelligence does not maintain a permanent sidebar position.
5. Narrow viewport handling risks a dense cluster of cards and an unclear scan order.
6. Question cards update selection state but do not visibly update the learning module title or content, which can feel like a dead interaction.

## Persona-specific confusion audit

| Persona | Confusion points |
| --- | --- |
| First-time physician | Does the ranking apply to me before I have taken any action? Where should I start: the hero CTA, an opportunity depth, or a question? |
| Returning physician | What changed since the last visit, and how does the score relate to completed learning? There is no obvious account or saved-progress entry point. |
| Medical student | Career-stage relevance is not stated; compensation and ranking language can signal that the product is not for them. |
| Resident | The page does not quickly identify contract and first-job support as an immediate, concrete path. |
| Fellow | The transition from training to choosing a practice is hidden among many equal-weight questions. |
| Attending | A personal ranking can feel gamified instead of credible; high-value choices such as compensation and ownership need stronger evidence framing. |
| Administrator | The physician-learning product and enterprise offer are intermixed, so the buyer path and desired outcome are unclear. |
| Enterprise buyer | “Enterprise preview” does not say what can be purchased, how data is governed, or how to begin a sales conversation. |
| PE investor | The private-equity signal is one item in a long list without a point of view, scope, or governance context. |
| McKinsey consultant | The product lacks a clear information architecture separating user workflow, intelligence outputs, definitions, and methodology. |

## Design direction adopted

1. Restore the concise physician-first hero promise and remove the mission label.
2. Make the ranking a calm, elongated status block—not the hero’s visual center.
3. Build Screen 2 as a deliberate desktop grid: decision rail, learning canvas, permanent Decision Intelligence™ sidebar; collapse in source order only at smaller widths.
4. Put one “Find My Biggest Opportunity” control immediately above three equal reading-depth cards, then connect each card to the module state.
5. Keep enterprise messaging in the persistent sidebar and make its CTA open a contact route.
6. Give every active visible control a specific outcome; represent unavailable sign-up as an explicitly disabled “Coming soon” control.
7. Use a restrained navy / white / blue system, consistent 12–16px radii, and predictable spacing.
