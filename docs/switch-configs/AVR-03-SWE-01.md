# AVR-03-SWE-01 — IDF-FF-08

## Overview

| Field | Value |
|---|---|
| Hostname | `AVR-03-SWE-01` |
| IP | `10.154.10.23` |
| Model | CX 6300F 24P (JL666A) |
| Part # | JL666A |
| Location | IDF-FF-08 |
| Port count | 24 + 1 uplink |

## Port Assignment Table

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 20 | AVR-03-AMP-01 |  |
| 2 | 20 | AVR-03-AMP-02 |  |
| 3 | 20 | AVR-03-AMP-03 |  |
| 4 | 20 | AVR-03-AMP-04 |  |
| 5 | 20 | AVR-03-AMP-05 |  |
| 6 | 20 | AVR-03-AMP-06 |  |
| 7 | 20 | AVR-03-AMP-07 |  |
| 8 | 20 | AVR-03-AMP-08 |  |
| 9 | 20 | AVR-03-AMP-09 |  |
| 10 | 20 | AVR-03-AMP-10 |  |
| 11 | 20 | TSC-301 |  |
| 12 | empty | — | Left unconfigured (default state) |
| 13 | 10 | AVR-03-UPS-01 |  |
| 14 | 10 | ACB-301 |  |
| 15 | 10 | ACB-301 (port B) |  |
| 16 | 10 | ACB-302 |  |
| 17 | 10 | ACB-302 (port B) |  |
| 18 | empty | — | Left unconfigured (default state) |
| 19 | 30 | ACB-301 |  |
| 20 | 30 | WISK-NODE-102 |  |
| 21 | 30 | WISK-NODE-101 |  |
| 22 | 40 | Reserved - no device | Reserved port |
| 23 | 10 | RLP-402 |  |
| 24 | empty | — | Left unconfigured (default state) |
| 25 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |

## Step 1 — Initial Setup

```text
! ============================================================
! STEP 1 — INITIAL SETUP (run once via serial console / default web UI)
! Factory default credentials: admin / (no password)
! ============================================================

configure terminal

  ! --- Hostname ---
  hostname AVR-03-SWE-01

  ! --- Admin user ---
  user admin group administrators password plaintext Exit10-2026!

  ! --- Enable HTTPS web UI ---
  https-server vrf default
  https-server rest access-mode read-write

  ! --- Enable SSH ---
  ssh server vrf default

  ! --- SNMP (required for ISAAC integration) ---
  snmp-server vrf default

  ! --- Management accessible on ALL ports (not just MGMT port) ---
  ! This allows SSH and web UI access from any connected port on any VLAN
  https-server vrf default
  ssh server vrf default

  ! --- Management IP on Control VLAN SVI (accessible from all ports) ---
  interface vlan 10
    ip address 10.154.10.23/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

> Note: Run this first via serial console or factory web UI before connecting to the network.

## Step 2 — Main Configuration

### To connect to switch
| Windows PowerShell | `ssh admin@10.154.10.23` |
|---|---|

```text
! ============================================================
! AVR-03-SWE-01 — IDF-FF-08
! IP: 10.154.10.23 | Model: CX 6300F 24P (JL666A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=Lighting
! ============================================================

configure terminal

  hostname AVR-03-SWE-01

  ! --- VLANs ---
  vlan 10
    name Control
  vlan 20
    name QLAN
  vlan 30
    name Dante
  vlan 40
    name Lighting

  ! --- Management IP (Control VLAN SVI) ---
  interface vlan 10
    ip address 10.154.10.23/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- QoS for Dante (Audinate recommended DSCP priorities) ---
  qos dscp-map 56 local-priority 7    ! CS7  — PTP clock sync (High)
  qos dscp-map 46 local-priority 5    ! EF   — Dante audio (Medium)
  qos dscp-map 8  local-priority 1    ! CS1  — Reserved (Low)


  ! --- IGMP Snooping ---
  vlan 30
    no ip igmp snooping
  vlan 40
    ip igmp snooping
    ip igmp snooping querier

  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 8

  ! --- Interfaces ---
  interface 1/1/1
    description "AVR-03-AMP-01"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/2
    description "AVR-03-AMP-02"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/3
    description "AVR-03-AMP-03"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/4
    description "AVR-03-AMP-04"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/5
    description "AVR-03-AMP-05"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/6
    description "AVR-03-AMP-06"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/7
    description "AVR-03-AMP-07"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/8
    description "AVR-03-AMP-08"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/9
    description "AVR-03-AMP-09"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/10
    description "AVR-03-AMP-10"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/11
    description "TSC-301"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/13
    description "AVR-03-UPS-01"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/14
    description "ACB-301"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/15
    description "ACB-301 (port B)"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/16
    description "ACB-302"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/17
    description "ACB-302 (port B)"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/19
    description "ACB-301"
    vlan access 30
    qos trust dscp
    no eee
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/20
    description "WISK-NODE-102"
    vlan access 30
    qos trust dscp
    no eee
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/21
    description "WISK-NODE-101"
    vlan access 30
    qos trust dscp
    no eee
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/22
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/23
    description "RLP-402"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpduguard enable
    no shutdown

  interface 1/1/25
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no shutdown

end

write memory
```

## Notes & Verification

- No uncertain ports were identified in the provided assignment table.
- `spanning-tree port-type admin-edge` makes endpoint ports forward immediately (faster link-up for end devices).
- `no shutdown` administratively enables each configured port.
- Verify Dante ports: `show running-config interface 1/1/<port>` should include `vlan access 30` and `no eee`.
- Verify multicast: VLAN 30 should show `no ip igmp snooping`; VLAN 40 should show snooping + querier enabled.
