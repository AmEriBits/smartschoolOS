# ADR 0001: Start with a modular monolith

- Status: Accepted
- Context: The POC spans many connected domains, and early microservices would add operational overhead before load and team boundaries are known.
- Decision: Build a NestJS modular monolith with explicit module ownership, versioned API/event contracts, and independently deployable workers from the same codebase.
- Consequences: Modules must not write into another domain's tables. Extract a service only when reliability, scaling, or ownership evidence warrants it.
