# Data Governance

| Class | Owner / access | Retention & deletion | Export / protection |
|---|---|---|---|
| Public | product owner; public read | reviewed lifecycle | public only; integrity controls |
| Anonymous | analytics steward; isolated analysts | purpose schedule; delete/aggregate | no reidentification; pseudonymization |
| Registered | privacy steward; authorized product staff | account lifecycle + legal schedule | subject-rights workflow; encrypted |
| Verified Physician / Professional | verification steward; minimum reviewers | credential expiry + schedule | no identifiable sale; strict audit |
| Enterprise | tenant steward; tenant-bound roles | contract + schedule | tenant-only, encrypted, DPA-controlled |
| Research | research steward; approved protocol | protocol/IRB schedule | deidentified/limited only, disclosure review |
| Testing / Synthetic | engineering owner | short environment schedule | no production PII; access isolation |
| Archived | records owner | approved legal schedule | restricted, encrypted, immutable where required |
| Deleted | privacy owner | deletion proof/irreversible tombstone | no operational access; backup expiry tracked |

Every dataset has a steward, purpose, legal basis/consent reference, schema, lineage, classification, region, retention clock, deletion mechanism, backup disposition, access policy, and approved recipients. PII vault, event lake, evidence ledger, security logs, and enterprise aggregates are separate domains. Deletion propagates to derived identifiable data and is tracked through backup aging; legal holds pause only documented scopes.
