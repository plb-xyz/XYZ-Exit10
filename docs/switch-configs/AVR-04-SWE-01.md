# AVR-04-SWE-01

- **IP:** `10.154.10.24`
- **Model:** CX 6300F 24P (JL666A)
- **Location:** IDF-GF-P1
- **Port Count:** 24 + 1 uplink

## Port Assignment

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 20 | AVR-04-AMP-01 |  |
| 2 | 20 | AVR-04-AMP-02 |  |
| 3 | 20 | AVR-04-L4o-01 |  |
| 4 | 20 | AVR-04-L4o-02 |  |
| 5 | 20 | AVR-04-L4o-03 |  |
| 6 | 20 | AVR-04-L4o-04 |  |
| 7 | 20 | AVR-04-L4o-05 |  |
| 8 | 20 | AVR-04-L4o-06 |  |
| 9 | 20 | AVR-04-L4o-07 |  |
| 10 | 20 | AVR-04-L4o-08 |  |
| 11 | 20 | AVR-04-L4o-09 |  |
| 12 | 20 | AVR-04-L4o-10 |  |
| 13-20 | empty | — | Left unconfigured (default state) |
| 21 | 40 | NOD-001 |  |
| 22 | 40 | Reserved - no device | Reserved port |
| 23 | empty | — | Left unconfigured (default state) |
| 24 | empty | — | Left unconfigured (default state) |
| 25 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |

## Complete AOS-CX CLI

```text
! ============================================================
! AVR-04-SWE-01 — IDF-GF-P1
! IP: 10.154.10.24 | Model: CX 6300F 24P (JL666A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=sACN-Lighting
! ============================================================

configure terminal

  hostname AVR-04-SWE-01

  ! --- VLANs ---
  vlan 10
    name Control
  vlan 20
    name QLAN
  vlan 30
    name Dante
  vlan 40
    name sACN-Lighting

  ! --- Management IP (Control VLAN SVI) ---
  interface vlan 10
    ip address 10.154.10.24/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- IGMP Snooping (required for sACN multicast on VLAN 40) ---
  ip igmp snooping
  vlan 40
    ip igmp snooping
    ip igmp snooping querier

  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 8

  ! --- Interfaces ---
  interface 1/1/1
    description "AVR-04-AMP-01"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/2
    description "AVR-04-AMP-02"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/3
    description "AVR-04-L4o-01"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/4
    description "AVR-04-L4o-02"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/5
    description "AVR-04-L4o-03"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/6
    description "AVR-04-L4o-04"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/7
    description "AVR-04-L4o-05"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/8
    description "AVR-04-L4o-06"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/9
    description "AVR-04-L4o-07"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/10
    description "AVR-04-L4o-08"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/11
    description "AVR-04-L4o-09"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/12
    description "AVR-04-L4o-10"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/21
    description "NOD-001"
    vlan access 40
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/22
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/25
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

end

write memory
```

## Notes

- No uncertain ports were identified in the provided assignment table.
