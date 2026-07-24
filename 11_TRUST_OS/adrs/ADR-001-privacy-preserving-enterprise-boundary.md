# ADR-001: Privacy-preserving enterprise boundary

**Status:** Accepted. **Decision:** Enterprise endpoints and exports serve only policy-approved aggregates. Minimum cohort, small-cell/complementary suppression, query controls, and disclosure review are enforced centrally. Identifiable physician/employer data and raw Decision Episode histories are prohibited.

**Consequences:** Enterprise feature design begins from aggregate questions and may reject valuable-looking but unsafe slices. The central gate simplifies auditability and prevents product-specific exceptions.
