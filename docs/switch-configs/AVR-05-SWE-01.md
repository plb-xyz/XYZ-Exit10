# AVR-05-SWE-01

- **IP:** `10.154.10.25`
- **Model:** CX 6300F 24P (JL666A)
- **Location:** IDF-GF-P2
- **Port Count:** 24 + 1 uplink

## Port Assignment

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 20 | AVR-5-L4o-01 |  |
| 2 | 20 | AVR-5-L4o-02 |  |
| 3 | 20 | AVR-5-L4o-03 |  |
| 4 | 20 | AVR-5-L4o-04 |  |
| 5 | 20 | AVR-05-AMP-01 |  |
| 6-20 | empty | — | Left unconfigured (default state) |
| 21 | 40 | NOD-002 |  |
| 22 | 40 | Reserved - no device | Reserved port |
| 23 | empty | — | Left unconfigured (default state) |
| 24 | 40 | Reserved - no device | Reserved port |
| 25 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |

## Complete AOS-CX CLI

```text
! ============================================================
! AVR-05-SWE-01 — IDF-GF-P2
! IP: 10.154.10.25 | Model: CX 6300F 24P (JL666A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=sACN-Lighting
! ============================================================

configure terminal

  hostname AVR-05-SWE-01

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
    ip address 10.154.10.25/24
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
    description "AVR-5-L4o-01"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/2
    description "AVR-5-L4o-02"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/3
    description "AVR-5-L4o-03"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/4
    description "AVR-5-L4o-04"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/5
    description "AVR-05-AMP-01"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/21
    description "NOD-002"
    vlan access 40
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/22
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/24
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
