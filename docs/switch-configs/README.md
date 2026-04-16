# Exit10 Aruba Switch Configurations

This folder contains one per-switch Aruba AOS-CX configuration document for the Exit10 network.

## Global Standards Used

- Firmware target: **AOS-CX 10.13/10.14**
- Control VLAN gateway: **10.154.10.1**
- Trunk ports: `vlan trunk allowed all` + `vlan trunk native 10`
- Trunks carry VLANs **10, 20, 30, 40**
- Empty ports are intentionally left unconfigured
- Reserved ports are configured as access + `no shutdown` + `description "Reserved - no device"`
- IGMP snooping querier is enabled on VLAN 40

## Switch Files

| Hostname | IP | Model | Location | Config File |
|---|---|---|---|---|
| AVR-08-SFP-01 | 10.154.10.20 | CX 6300M 24P SFP (JL658A) | EER — Core Fiber | [AVR-08-SFP-01.md](./AVR-08-SFP-01.md) |
| AVR-01-SWE-01 | 10.154.10.21 | CX 6300F 24P (JL666A) | IDF-FF-03A | [AVR-01-SWE-01.md](./AVR-01-SWE-01.md) |
| AVR-02-SWE-01 | 10.154.10.22 | CX 6300F 48P (JL665A) | IDF-GF-06 | [AVR-02-SWE-01.md](./AVR-02-SWE-01.md) |
| AVR-03-SWE-01 | 10.154.10.23 | CX 6300F 24P (JL666A) | IDF-FF-08 | [AVR-03-SWE-01.md](./AVR-03-SWE-01.md) |
| AVR-04-SWE-01 | 10.154.10.24 | CX 6300F 24P (JL666A) | IDF-GF-P1 | [AVR-04-SWE-01.md](./AVR-04-SWE-01.md) |
| AVR-05-SWE-01 | 10.154.10.25 | CX 6300F 24P (JL666A) | IDF-GF-P2 | [AVR-05-SWE-01.md](./AVR-05-SWE-01.md) |
| AVR-07-SWE-01 | 10.154.10.27 | CX 6300F 48P (JL665A) | EER | [AVR-07-SWE-01.md](./AVR-07-SWE-01.md) |
| AVR-08-SWE-01 | 10.154.10.28 | CX 6300F 48P (JL665A) | EER | [AVR-08-SWE-01.md](./AVR-08-SWE-01.md) |
| AVR-10-SWE-01 | 10.154.10.30 | CX 6300F 48P (JL665A) | EER | [AVR-10-SWE-01.md](./AVR-10-SWE-01.md) |

> Note: Landlord ports are configured with `vlan access 1` as a placeholder. Confirm final VLAN ID with the landlord network team before deployment.
