# AVR-04-SWE-01 — IDF-GF-P1

## Overview

| Field | Value |
|---|---|
| Hostname | `AVR-04-SWE-01` |
| IP | `10.154.10.24` |
| Model | CX 6300F 24P (JL666A) |
| Part # | JL666A |
| Location | IDF-GF-P1 |
| Port count | 24 + 1 uplink |

## Port Assignment Table

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
| 13 | 10 | Reserved - no device |  |
| 14 | 10 | Reserved - no device |  |
| 15 | — | SPARE |  |
| 16 | — | SPARE |  |
| 17 | — | SPARE |  |
| 18 | — | SPARE |  |
| 19 | — | SPARE |  |
| 20 | — | SPARE |  |
| 21 | 40 | NOD-001 |  |
| 22 | 40 | Reserved - no device |  |
| 23 | 40 | Reserved - no device |  |
| 24 | 40 | Reserved - no device |  |
| 25 | TRUNK | AVR-08-SFP-01 | Uplink trunk (native VLAN 10, all VLANs tagged) |
| 26 | — | SPARE |  |
| 27 | — | SPARE |  |
| 28 | — | SPARE |  |

## Step 1 — Initial Setup

```text
! ============================================================
! STEP 1 — INITIAL SETUP (run once via serial console / default web UI)
! Factory default credentials: admin / (no password)
! ============================================================

configure terminal

  ! --- Hostname ---
  hostname AVR-04-SWE-01

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
    ip address 10.154.10.24/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

end

write memory
```

> Note: Run this first via serial console or factory web UI before connecting to the network.

## Step 2 — Main Configuration

### To connect to switch
| Windows PowerShell | `ssh admin@10.154.10.24` |
|---|---|

```text
! ============================================================
! AVR-04-SWE-01 — IDF-GF-P1
! IP: 10.154.10.24 | Model: CX 6300F 24P (JL666A)
! VLANs: 10=Control 20=QLAN 30=Dante 40=Lighting 50=Landlord
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
    name Lighting
  vlan 50
    name Landlord

  ! --- Management IP (Control VLAN SVI) ---
  interface vlan 10
    ip address 10.154.10.24/24
    no shutdown

  ! --- Default route ---
  ip route 0.0.0.0/0 10.154.10.1

  ! --- IGMP Snooping ---
  vlan 30
    ip igmp snooping enable
  vlan 40
    ip igmp snooping enable
  vlan 50
    no ip igmp snooping
  ! --- Spanning Tree ---
  spanning-tree mode mstp
  spanning-tree priority 8

  ! --- Interfaces ---
  interface 1/1/1
    description "AVR-04-AMP-01"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/2
    description "AVR-04-AMP-02"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/3
    description "AVR-04-L4o-01"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/4
    description "AVR-04-L4o-02"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/5
    description "AVR-04-L4o-03"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/6
    description "AVR-04-L4o-04"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/7
    description "AVR-04-L4o-05"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/8
    description "AVR-04-L4o-06"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/9
    description "AVR-04-L4o-07"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/10
    description "AVR-04-L4o-08"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/11
    description "AVR-04-L4o-09"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/12
    description "AVR-04-L4o-10"
    vlan access 20
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/13
    description "Reserved - no device"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/14
    description "Reserved - no device"
    vlan access 10
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/15
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/16
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/17
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/18
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/19
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/20
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/21
    description "NOD-001"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/22
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/23
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/24
    description "Reserved - no device"
    vlan access 40
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    no shutdown

  interface 1/1/25
    description "TRUNK to AVR-08-SFP-01"
    vlan trunk allowed all
    vlan trunk native 10
    no spanning-tree bpdu-guard
    no shutdown

  interface 1/1/26
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/27
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

  interface 1/1/28
    description "SPARE"
    vlan access 1
    spanning-tree port-type admin-edge
    spanning-tree bpdu-guard
    shutdown

end

write memory
```

## Notes & Verification

- No uncertain ports were identified in the provided assignment table.
- `spanning-tree port-type admin-edge` makes endpoint ports forward immediately (faster link-up for end devices).
- `no shutdown` administratively enables each configured port.
- Verify Dante ports: `show running-config interface 1/1/<port>` should include `vlan access 30` and `qos trust dscp`.
- Verify multicast: VLAN 30 and VLAN 40 should show `ip igmp snooping enable`; querier should run from AVR-08-SFP-01 only.
