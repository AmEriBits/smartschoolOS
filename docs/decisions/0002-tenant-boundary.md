# ADR 0002: Organisation is the tenant boundary

- Status: Accepted for POC; validate commercial and legal model before production
- Context: Pilot is one school organisation with two campuses and shared administration.
- Decision: Organisation/group is the tenant boundary; schools and campuses remain distinct scoped entities.
- Consequences: Tenant scope is mandatory for school-owned data. Campus authorization is enforced where a domain needs campus-level separation. Guardians receive relationship-scoped access per child.
