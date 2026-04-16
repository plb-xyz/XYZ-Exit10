# AVR-10-SWE-01

- **IP:** `10.154.10.30`
- **Model:** CX 6300F 48P (JL665A)
- **Location:** EER
- **Port Count:** 48 + 1 uplink

## Port Assignment

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 10 | AVR-10-VSR-01 |  |
| 2 | 10 | AVR-10-VSR-02 |  |
| 3 | 10 | AVR-10-VSR-03 |  |
| 4 | 10 | AVR-10-VSR-04 |  |
| 5 | 10 | AVR-10-VSR-05 |  |
| 6 | 10 | AVR-10-VSR-06 |  |
| 7 | 10 | AVR-10-VSR-07 |  |
| 8 | 10 | AVR-10-VSR-08 |  |
| 9 | 10 | AVR-10-VSR-SFP-01 |  |
| 10 | 10 | AVR-09-H15-01A |  |
| 11 | 10 | AVR-09-H15-01B |  |
| 12 | 10 | MPU-S9900-01 |  |
| 13 | 10 | MPU-S9900-02 |  |
| 14 | 10 | AVR-09-UPS-001 |  |
| 15 | 10 | AVR-10-UPS-01 |  |
| 16 | 10 | AVR-11-UPS-01 |  |
| 17-26 | empty | — | Left unconfigured (default state) |
| 27 | 30 | AVR-10-VSR-01 |  |
| 28 | 30 | AVR-10-VSR-02 |  |
| 29-48 | empty | — | Left unconfigured (default state) |
| 49 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |

## Complete AOS-CX CLI

```text
! ============================================================
! AVR-10-SWE-01 — EER
! IP: 10.154.10.30 | Model: CX 6300F 48P (JL665A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=sACN-Lighting
! ============================================================

configure terminal

  hostname AVR-10-SWE-01

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
    ip address 10.154.10.30/24
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
    description "AVR-10-VSR-01"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/2
    description "AVR-10-VSR-02"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/3
    description "AVR-10-VSR-03"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/4
    description "AVR-10-VSR-04"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/5
    description "AVR-10-VSR-05"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/6
    description "AVR-10-VSR-06"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/7
    description "AVR-10-VSR-07"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/8
    description "AVR-10-VSR-08"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/9
    description "AVR-10-VSR-SFP-01"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/10
    description "AVR-09-H15-01A"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/11
    description "AVR-09-H15-01B"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/12
    description "MPU-S9900-01"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/13
    description "MPU-S9900-02"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/14
    description "AVR-09-UPS-001"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/15
    description "AVR-10-UPS-01"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/16
    description "AVR-11-UPS-01"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/27
    description "AVR-10-VSR-01"
    vlan access 30
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/28
    description "AVR-10-VSR-02"
    vlan access 30
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/49
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

end

write memory
```

## Notes

- No uncertain ports were identified in the provided assignment table.
