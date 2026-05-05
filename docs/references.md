# Exit10 Network & AV Technical References

## Project Network Decisions

| VLAN | Name | IGMP Snooping | Querier | QoS | EEE | Notes |
|---|---|---|---|---|---|---|
| 10 | Control | default | no | no | default | Management, SNMP, ISAAC |
| 20 | QLAN | default | no | no | default | Q-SYS unicast TCP |
| 30 | Dante | ON | YES | trust DSCP on Dante ports + strict priority | OFF (no eee) |
| 40 | sACN | ON | YES | no | default | GrandMA3 multicast |

## 1) Network / Switching

- **Aruba AOS-CX 6300 Series Documentation** — Platform documentation for Aruba CX 6300 switching hardware/software — https://www.arubanetworks.com/techdocs/AOS-CX/10.14/
- **Aruba AOS-CX IGMP Snooping Guide** — Aruba guidance for multicast and IGMP snooping behavior/configuration — https://www.arubanetworks.com/techdocs/AOS-CX/10.14/HTML/multicast_6300-6400-8xxx-9300/
- **Aruba AOS-CX QoS / DSCP Guide** — Aruba QoS and DSCP trust/priority mapping reference — https://www.arubanetworks.com/techdocs/AOS-CX/10.14/HTML/qos_6300-6400/
- **Aruba AOS-CX Spanning Tree (MSTP) Guide** — Aruba spanning-tree (MSTP/RPVST) operational reference — https://www.arubanetworks.com/techdocs/AOS-CX/10.14/HTML/l2_bridging_6300-6400/
- **IEEE 802.3az (Energy Efficient Ethernet)** — EEE standard relevant to Dante stability guidance — https://standards.ieee.org/standard/802_3az-2010.html

## 2) Dante / Audinate

- **Audinate Dante Network Design Guide** — Vendor best-practice guidance for Dante transport, clocking, and switch behavior — https://www.getdante.com/resources/
- **ESTA E1.31 Streaming ACN (sACN) Specification** — Streaming ACN protocol reference used in mixed AV networks — https://tsp.esta.org/tsp/documents/published_docs.php
- **Disable EEE on Dante ports (`no eee`)** — Project requirement to avoid Dante dropouts from EEE behavior — [docs/switch-configs/](./switch-configs/)
- **QoS DSCP priorities: CS7 (56), EF (46), CS1 (8)** — Project QoS mapping requirement for Dante PTP/audio/reserved classes — [docs/switch-configs/](./switch-configs/)
- **Strict priority queueing when QoS is enabled** — Project requirement to preserve Dante timing and audio delivery priority — [docs/switch-configs/](./switch-configs/)
- **Dante transport VLAN = 30** — Project VLAN design assignment for Dante endpoints — [docs/aruba-commands-reference.md](./aruba-commands-reference.md)

## 3) sACN / Lighting

- **ESTA E1.31 Streaming ACN (sACN) Specification** — Protocol specification for sACN multicast transport — https://tsp.esta.org/tsp/documents/published_docs.php
- **GrandMA3 Network Setup Guide** — MA Lighting network setup guidance for console/sACN operation — https://help.malighting.com/grandMA3/2.0/
- **IGMP snooping ON for VLAN 40** — Project requirement for sACN multicast control — [docs/switch-configs/](./switch-configs/)
- **IGMP querier enabled on VLAN 40 (one per VLAN)** — Project requirement to maintain multicast group state — [docs/switch-configs/](./switch-configs/)
- **sACN multicast transport details** — Uses UDP/5568 and 239.255.x.x multicast range in this deployment — https://tsp.esta.org/tsp/documents/published_docs.php
- **Lighting always routed through MA** — System behavior requirement defined by project scope — [PROJECT-SCOPE.md](../PROJECT-SCOPE.md)
- **sACN transport VLAN = 40** — Project VLAN design assignment for lighting traffic — [docs/aruba-commands-reference.md](./aruba-commands-reference.md)

## 4) Q-SYS (QLAN)

- **QSC Q-SYS Network Configuration Guide** — Vendor guidance for Q-SYS network deployment and control/audio transport — https://q-syshelp.qsc.com/
- **QLAN transport VLAN = 20** — Project VLAN design assignment for Q-SYS traffic — [docs/aruba-commands-reference.md](./aruba-commands-reference.md)
- **Q-SYS traffic model** — Project states Q-SYS uses unicast TCP with no special multicast requirements — [docs/aruba-commands-reference.md](./aruba-commands-reference.md)

## 5) SNMP / ISAAC

- **Aruba SNMP CLI (`snmp-server vrf default`)** — Required project switch setting for ISAAC SNMP monitoring integration — [docs/switch-configs/](./switch-configs/)
- **ISAAC monitoring on Control VLAN (VLAN 10)** — Project requirement for switch telemetry path and management segmentation — [docs/aruba-commands-reference.md](./aruba-commands-reference.md)

## 6) Project-specific references

- **Per-switch CLI configurations** — Authoritative per-switch configuration documents — [docs/switch-configs/](./switch-configs/)
- **Aruba command reference** — Exit10 Aruba command baseline and VLAN conventions — [docs/aruba-commands-reference.md](./aruba-commands-reference.md)
- **Project architecture scope** — Overall operational architecture and control-system behavior — [PROJECT-SCOPE.md](../PROJECT-SCOPE.md)

## Source Confidence

Vendor standards/protocol behavior (Aruba AOS-CX, Audinate, ESTA E1.31, QSC, MA, IEEE) comes from primary vendor/standards documentation listed above.  
Exit10-specific settings (VLAN assignments, `no eee`, Dante/sACN IGMP behavior, QoS/queueing decisions, SNMP/ISAAC expectations) come from this repository’s project documentation and switch configuration baseline, and reflect project implementation choices plus established AV networking best practice.
