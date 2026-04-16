# AVR-08-SWE-01

- **IP:** `10.154.10.28`
- **Model:** CX 6300F 48P (JL665A)
- **Location:** EER
- **Port Count:** 48 + 3 uplink/expansion

## Port Assignment

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 20 | AVR-08-PC-01-2 |  |
| 2 | 1 | Landlord | Landlord network (placeholder VLAN 1) |
| 3 | 10 | ISAAC 01 Port 2 |  |
| 4 | 10 | ISAAC 02 |  |
| 5-6 | empty | — | Left unconfigured (default state) |
| 7 | 10 | MA Console 1 Port 1 |  |
| 8 | 10 | MA Console 2 Port 1 |  |
| 9 | 10 | AVR-08-LRU-01 Port 1 |  |
| 10 | 10 | AVR-08-LRU-02 Port 1 |  |
| 11 | 10 | AVR-08-LPU-01 Port 1 |  |
| 12 | 10 | AVR-08-LPU-02 Port 1 |  |
| 13 | 10 | AVR-08-LPU-03 Port 1 |  |
| 14 | empty | — | Left unconfigured (default state) |
| 15 | 10 | AVR-08-MPC-01 Port 1 |  |
| 16 | 10 | AVR-08-MPC-02 Port 1 |  |
| 17 | 10 | ISAAC 01 Port 1 |  |
| 18 | 10 | ISAAC 01 iDRAC |  |
| 19 | 10 | ISAAC 02 Port 1 |  |
| 20 | 10 | ISAAC 02 iDRAC |  |
| 21 | 10 | AVR-08-UPS-01 |  |
| 22 | 10 | AVR-08-PC-01-1 |  |
| 23-24 | empty | — | Left unconfigured (default state) |
| 25 | 30 | AVR-08-MPC-01 Port 2 |  |
| 26 | 30 | AVR-08-MPC-02 Port 2 |  |
| 27-34 | empty | — | Left unconfigured (default state) |
| 35 | 10 | Grand MA Console 1 Port 2 |  |
| 36 | 10 | Grand MA Console 2 Port 2 |  |
| 37 | 10 | AVR-08-LRU-01 Port 2 |  |
| 38 | 10 | AVR-08-LRU-02 Port 2 |  |
| 39 | 10 | AVR-08-LPU-01 Port 2 |  |
| 40 | 10 | AVR-08-LPU-02 Port 2 |  |
| 41 | 10 | AVR-08-LPU-03 Port 2 |  |
| 42 | 40 | NOD-003 |  |
| 43-44 | empty | — | Left unconfigured (default state) |
| 45 | 1 | Reserved - no device | Reserved port |
| 46 | 1 | Reserved - no device | Reserved port |
| 47 | 1 | Reserved - no device | Reserved port |
| 48 | 1 | Reserved - no device | Reserved port |
| 49-50 | empty | — | Left unconfigured (default state) |
| 51 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |

## Complete AOS-CX CLI

```text
! ============================================================
! AVR-08-SWE-01 — EER
! IP: 10.154.10.28 | Model: CX 6300F 48P (JL665A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=sACN-Lighting
! ============================================================

configure terminal

  hostname AVR-08-SWE-01

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
    ip address 10.154.10.28/24
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
    description "AVR-08-PC-01-2"
    vlan access 20
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/2
    description "Landlord"
    vlan access 1
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/3
    description "ISAAC 01 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/4
    description "ISAAC 02"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/7
    description "MA Console 1 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/8
    description "MA Console 2 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/9
    description "AVR-08-LRU-01 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/10
    description "AVR-08-LRU-02 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/11
    description "AVR-08-LPU-01 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/12
    description "AVR-08-LPU-02 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/13
    description "AVR-08-LPU-03 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/15
    description "AVR-08-MPC-01 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/16
    description "AVR-08-MPC-02 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/17
    description "ISAAC 01 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/18
    description "ISAAC 01 iDRAC"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/19
    description "ISAAC 02 Port 1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/20
    description "ISAAC 02 iDRAC"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/21
    description "AVR-08-UPS-01"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/22
    description "AVR-08-PC-01-1"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/25
    description "AVR-08-MPC-01 Port 2"
    vlan access 30
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/26
    description "AVR-08-MPC-02 Port 2"
    vlan access 30
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/35
    description "Grand MA Console 1 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/36
    description "Grand MA Console 2 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/37
    description "AVR-08-LRU-01 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/38
    description "AVR-08-LRU-02 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/39
    description "AVR-08-LPU-01 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/40
    description "AVR-08-LPU-02 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/41
    description "AVR-08-LPU-03 Port 2"
    vlan access 10
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/42
    description "NOD-003"
    vlan access 40
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/45
    description "Reserved - no device"
    vlan access 1
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/46
    description "Reserved - no device"
    vlan access 1
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/47
    description "Reserved - no device"
    vlan access 1
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/48
    description "Reserved - no device"
    vlan access 1
    spanning-tree port-type admin-edge
    no shutdown

  interface 1/1/51
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

end

write memory
```

## Notes

- Landlord ports use `vlan access 1` as a placeholder; verify final landlord VLAN ID with the landlord network team.
- No uncertain ports were identified in the provided assignment table.
