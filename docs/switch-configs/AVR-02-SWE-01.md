# AVR-02-SWE-01 — IDF-GF-06

## Overview

| Field | Value |
|---|---|
| Hostname | `AVR-02-SWE-01` |
| IP | `10.154.10.22` |
| Model | CX 6300F 48P (JL665A) |
| Part # | JL665A |
| Location | IDF-GF-06 |
| Port count | 48 + 1 uplink |

## Port Assignment Table

| Port | VLAN | Device | Notes |
|---|---|---|---|
| 1 | 20 | AVR-02-AMP-01 |  |
| 2 | 20 | AVR-02-AMP-02 |  |
| 3 | 20 | AVR-02-AMP-03 |  |
| 4 | 20 | AVR-02-AMP-04 |  |
| 5 | 20 | AVR-02-AMP-05 |  |
| 6 | 20 | TSC-101 |  |
| 7 | empty | — | Left unconfigured (default state) |
| 8 | empty | — | Left unconfigured (default state) |
| 9 | empty | — | Left unconfigured (default state) |
| 10 | empty | — | Left unconfigured (default state) |
| 11 | empty | — | Left unconfigured (default state) |
| 12 | empty | — | Left unconfigured (default state) |
| 13 | 10 | ACB-101 |  |
| 14 | 10 | ACB-101 |  |
| 15 | 10 | ACB-105 |  |
| 16 | 10 | ACB-105 |  |
| 17 | 10 | ACB-202 |  |
| 18 | 10 | ACB-202 |  |
| 19 | 10 | ACB-203 |  |
| 20 | 10 | ACB-203 |  |
| 21 | 10 | ACB-204 |  |
| 22 | 10 | ACB-204 |  |
| 23 | empty | — | Left unconfigured (default state) |
| 24 | empty | — | Left unconfigured (default state) |
| 25 | empty | — | Left unconfigured (default state) |
| 26 | empty | — | Left unconfigured (default state) |
| 27 | 30 | ACB-101 |  |
| 28 | 30 | ACB-105 |  |
| 29 | 30 | ACB-202 |  |
| 30 | 30 | ACB-203 |  |
| 31 | 30 | ACB-204 |  |
| 32 | 30 | Reserved - no device | Reserved port |
| 33 | empty | — | Left unconfigured (default state) |
| 34 | empty | — | Left unconfigured (default state) |
| 35 | 40 | RLP-401 |  |
| 36 | 40 | Reserved - no device | Reserved port |
| 37-48 | empty | — | Left unconfigured (default state) |
| 49 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |

## Step 1 — Initial Setup

```text
! ============================================================
! STEP 1 — INITIAL SETUP (run once via serial console / default web UI)
! Factory default credentials: admin / (no password)
! ============================================================

configure terminal

  ! --- Hostname ---
  hostname AVR-02-SWE-01

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
    ip address 10.154.10.22/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

> Note: Run this first via serial console or factory web UI before connecting to the network.

## Step 2 — Main Configuration

### To connect to switch
| Windows PowerShell | `ssh admin@10.154.10.22` |
|---|---|

```text
! ============================================================
! AVR-02-SWE-01 — IDF-GF-06
! IP: 10.154.10.22 | Model: CX 6300F 48P (JL665A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=Lighting
! ============================================================

configure terminal

  hostname AVR-02-SWE-01

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
    ip address 10.154.10.22/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- QoS for Dante (Audinate recommended DSCP priorities) ---
  qos dscp-map 56 local-priority 7    ! CS7  — PTP clock sync (High)
  qos dscp-map 46 local-priority 5    ! EF   — Dante audio (Medium)
  qos dscp-map 8  local-priority 1    ! CS1  — Reserved (Low)


  ! --- IGMP Snooping ---
  vlan 30
    ip igmp snooping enable
  vlan 40
    ip igmp snooping enable
  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 8

  ! --- Interfaces ---
  interface 1/1/1
    description "AVR-02-AMP-01"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/2
    description "AVR-02-AMP-02"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/3
    description "AVR-02-AMP-03"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/4
    description "AVR-02-AMP-04"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/5
    description "AVR-02-AMP-05"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/6
    description "TSC-101"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/13
    description "ACB-101"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/14
    description "ACB-101"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/15
    description "ACB-105"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/16
    description "ACB-105"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/17
    description "ACB-202"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/18
    description "ACB-202"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/19
    description "ACB-203"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/20
    description "ACB-203"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/21
    description "ACB-204"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/22
    description "ACB-204"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/27
    description "ACB-101"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/28
    description "ACB-105"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/29
    description "ACB-202"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/30
    description "ACB-203"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/31
    description "ACB-204"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/32
    description "Reserved - no device"
    vlan access 30
    qos trust dscp
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/35
    description "RLP-401"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/36
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/49
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no spanning-tree bpdu-guard
    no shutdown

end

write memory
```

## Notes & Verification

- No uncertain ports were identified in the provided assignment table.
- `spanning-tree port-type admin-edge` makes endpoint ports forward immediately (faster link-up for end devices).
- `no shutdown` administratively enables each configured port.
- Verify Dante ports: `show running-config interface 1/1/<port>` should include `vlan access 30` and `qos trust dscp`.
- Verify multicast: VLAN 30 and VLAN 40 should show `ip igmp snooping enable`; querier should run from AVR-08-SFP-01 only.
